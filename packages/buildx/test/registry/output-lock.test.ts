import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, vi } from 'vitest';

import { acquireOutputLock } from '../../src/registry/pipeline/output-lock';

let tempDir = '';

function lockPathFor(outDir: string) {
	return path.join(path.dirname(outDir), `.${path.basename(outDir)}.lock`);
}

async function writeLock(outDir: string, metadata?: unknown, ageMs = 0) {
	const lockPath = lockPathFor(outDir);
	await fs.mkdir(lockPath);
	if (metadata !== undefined) {
		await fs.writeFile(path.join(lockPath, 'owner.json'), typeof metadata === 'string' ? metadata : `${JSON.stringify(metadata)}\n`);
	}
	if (ageMs > 0) {
		const date = new Date(Date.now() - ageMs);
		await fs.utimes(lockPath, date, date);
	}
	return lockPath;
}

async function readToken(lockPath: string) {
	return (JSON.parse(await fs.readFile(path.join(lockPath, 'owner.json'), 'utf-8')) as { token: string }).token;
}

beforeEach(async () => {
	tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tile-ui-lock-'));
});

afterEach(async () => {
	vi.restoreAllMocks();
	await fs.rm(tempDir, { recursive: true, force: true });
});

describe('acquireOutputLock', () => {
	it('publishes only a fully initialized candidate and releases it', async () => {
		const outDir = path.join(tempDir, 'nested', 'registry');
		let candidatePath = '';
		const lock = await acquireOutputLock(outDir, {
			hooks: {
				onCandidateReady: async (candidate) => {
					candidatePath = candidate;
					expect(await readToken(candidate)).toMatch(/^\d+-/);
					await expect(fs.access(lockPathFor(outDir))).rejects.toMatchObject({ code: 'ENOENT' });
				},
			},
		});
		expect(candidatePath).not.toBe(lock.lockPath);
		expect(await readToken(lock.lockPath)).toMatch(/^\d+-/);
		await expect(fs.access(candidatePath)).rejects.toMatchObject({ code: 'ENOENT' });
		await lock.release();
		await lock.release();
		await expect(fs.access(lock.lockPath)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('serializes acquisition until the current owner releases', async () => {
		const outDir = path.join(tempDir, 'registry');
		const first = await acquireOutputLock(outDir);
		let secondAcquired = false;
		const secondPromise = acquireOutputLock(outDir, { retryMs: 1, timeoutMs: 1_000 }).then((lock) => {
			secondAcquired = true;
			return lock;
		});
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(secondAcquired).toBe(false);
		await first.release();
		const second = await secondPromise;
		expect(secondAcquired).toBe(true);
		await second.release();
	});

	it('aborts promptly while another live owner holds the lock and preserves that owner', async () => {
		const outDir = path.join(tempDir, 'registry');
		const first = await acquireOutputLock(outDir);
		const ownerToken = await readToken(first.lockPath);
		const controller = new AbortController();
		const reason = new DOMException('stop waiting', 'AbortError');
		const startedAt = Date.now();
		const pending = acquireOutputLock(outDir, { signal: controller.signal, retryMs: 5_000, timeoutMs: 60_000 });
		await new Promise((resolve) => setTimeout(resolve, 20));
		controller.abort(reason);
		await expect(pending).rejects.toBe(reason);
		expect(Date.now() - startedAt).toBeLessThan(500);
		expect(await readToken(first.lockPath)).toBe(ownerToken);
		expect((await fs.readdir(tempDir)).filter((entry) => entry.startsWith('.registry.lock.candidate-'))).toEqual([]);
		await first.release();
	});

	it('rejects a pre-aborted signal without creating lock artifacts', async () => {
		const outDir = path.join(tempDir, 'registry');
		const controller = new AbortController();
		const reason = new Error('already stopped');
		controller.abort(reason);
		await expect(acquireOutputLock(outDir, { signal: controller.signal })).rejects.toBe(reason);
		expect(await fs.readdir(tempDir)).toEqual([]);
	});

	it('cleans a candidate when aborted during candidate initialization', async () => {
		const outDir = path.join(tempDir, 'registry');
		const controller = new AbortController();
		const reason = new DOMException('candidate stopped', 'AbortError');
		await expect(
			acquireOutputLock(outDir, {
				signal: controller.signal,
				hooks: { onCandidateReady: () => controller.abort(reason) },
			}),
		).rejects.toBe(reason);
		expect((await fs.readdir(tempDir)).filter((entry) => entry.includes('.registry.lock.'))).toEqual([]);
	});

	it('restores an observed stale owner when aborted before or after quarantine detachment', async () => {
		for (const phase of ['observed', 'detached'] as const) {
			const outDir = path.join(tempDir, `registry-${phase}`);
			const lockPath = await writeLock(outDir, { token: phase, pid: 2_147_483_647, hostname: os.hostname(), createdAt: Date.now() - 10_000 }, 10_000);
			const controller = new AbortController();
			const reason = new DOMException(`${phase} stopped`, 'AbortError');
			await expect(
				acquireOutputLock(outDir, {
					signal: controller.signal,
					staleMs: 1,
					hooks: phase === 'observed' ? { onLockObserved: () => controller.abort(reason) } : { onLockDetached: () => controller.abort(reason) },
				}),
			).rejects.toBe(reason);
			expect(await readToken(lockPath)).toBe(phase);
			expect((await fs.readdir(tempDir)).filter((entry) => entry.includes(`.${path.basename(outDir)}.lock.`))).toEqual([]);
		}
	});

	it('cleans its unpublished candidate after timeout', async () => {
		const outDir = path.join(tempDir, 'registry');
		await writeLock(outDir, { token: 'owner', pid: process.pid, hostname: os.hostname(), createdAt: Date.now() });
		await expect(acquireOutputLock(outDir, { retryMs: 1, timeoutMs: 10 })).rejects.toThrow(/pid=.*host=.*ageMs=/);
		expect((await fs.readdir(tempDir)).filter((entry) => entry.startsWith('.registry.lock.candidate-'))).toEqual([]);
	});

	it('recovers an aged same-host lock owned by a dead pid', async () => {
		const outDir = path.join(tempDir, 'registry');
		await writeLock(outDir, { token: 'dead', pid: 2_147_483_647, hostname: os.hostname(), createdAt: Date.now() - 10_000 }, 10_000);
		const lock = await acquireOutputLock(outDir, { retryMs: 1, timeoutMs: 100, staleMs: 10 });
		expect(await readToken(lock.lockPath)).not.toBe('dead');
		await lock.release();
		expect((await fs.readdir(tempDir)).filter((entry) => entry.includes('.registry.lock.'))).toEqual([]);
	});

	it.each([
		['missing', undefined],
		['partial', { token: 'partial' }],
		['malformed', '{ malformed'],
	])('quarantines and reports %s metadata without blocking availability', async (_kind, metadata) => {
		const outDir = path.join(tempDir, 'registry');
		await writeLock(outDir, metadata);
		const artifacts: string[] = [];
		const lock = await acquireOutputLock(outDir, {
			timeoutMs: 50,
			onRecoveryArtifact: (artifactPath) => {
				artifacts.push(artifactPath);
			},
		});
		expect(artifacts).toHaveLength(1);
		expect(path.basename(artifacts[0] ?? '')).toContain('.registry.lock.quarantine-');
		await expect(fs.access(artifacts[0] ?? '')).resolves.toBeUndefined();
		await lock.release();
		expect((await fs.readdir(tempDir)).filter((entry) => entry.startsWith('.registry.lock.candidate-'))).toEqual([]);
	});

	it('never recovers an aged foreign-host lock', async () => {
		const outDir = path.join(tempDir, 'registry');
		await writeLock(outDir, { token: 'foreign', pid: 2_147_483_647, hostname: 'foreign-host', createdAt: Date.now() - 10_000 }, 10_000);
		await expect(acquireOutputLock(outDir, { retryMs: 1, timeoutMs: 10, staleMs: 1 })).rejects.toThrow(/host=foreign-host/);
		expect(await readToken(lockPathFor(outDir))).toBe('foreign');
		expect((await fs.readdir(tempDir)).filter((entry) => entry.startsWith('.registry.lock.candidate-'))).toEqual([]);
	});

	it('handles a candidate publication race without exposing incomplete metadata', async () => {
		const outDir = path.join(tempDir, 'registry');
		const lockPath = lockPathFor(outDir);
		let injected = false;
		const lock = await acquireOutputLock(outDir, {
			retryMs: 1,
			timeoutMs: 100,
			hooks: {
				onCandidateReady: async () => {
					if (injected) return;
					injected = true;
					await fs.mkdir(lockPath);
					await fs.writeFile(
						path.join(lockPath, 'owner.json'),
						`${JSON.stringify({ token: 'dead', pid: 2_147_483_647, hostname: os.hostname(), createdAt: Date.now() - 10_000 })}\n`,
					);
					const date = new Date(Date.now() - 10_000);
					await fs.utimes(lockPath, date, date);
				},
			},
			staleMs: 1,
		});
		expect(await readToken(lock.lockPath)).not.toBe('dead');
		await lock.release();
	});

	it('preserves both filesystem objects when the observed lock is replaced before detachment', async () => {
		const outDir = path.join(tempDir, 'registry');
		const lockPath = await writeLock(outDir, { token: 'observed', pid: 2_147_483_647, hostname: os.hostname(), createdAt: Date.now() - 10_000 }, 10_000);
		const movedObserved = path.join(tempDir, '.registry.lock.observed-owner');
		let replaced = false;
		await expect(
			acquireOutputLock(outDir, {
				staleMs: 1,
				hooks: {
					onLockObserved: async () => {
						if (replaced) return;
						replaced = true;
						await fs.rename(lockPath, movedObserved);
						await fs.mkdir(lockPath);
						await fs.writeFile(
							path.join(lockPath, 'owner.json'),
							`${JSON.stringify({ token: 'replacement', pid: process.pid, hostname: os.hostname(), createdAt: Date.now() })}\n`,
						);
					},
				},
			}),
		).rejects.toThrow(/changed before detachment/);
		expect(await readToken(lockPath)).toBe('replacement');
		expect(await readToken(movedObserved)).toBe('observed');
	});

	it('aggregates candidate cleanup failure with acquisition failure', async () => {
		const outDir = path.join(tempDir, 'registry');
		await writeLock(outDir, { token: 'owner', pid: process.pid, hostname: os.hostname(), createdAt: Date.now() });
		const realRm = fs.rm.bind(fs);
		vi.spyOn(fs, 'rm').mockImplementation(async (targetPath, options) => {
			if (String(targetPath).includes('.registry.lock.candidate-')) throw Object.assign(new Error('candidate cleanup failed'), { code: 'EIO' });
			await realRm(targetPath, options);
		});
		await expect(acquireOutputLock(outDir, { retryMs: 1, timeoutMs: 10 })).rejects.toMatchObject({
			errors: expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('Timed out') }), expect.objectContaining({ code: 'EIO' })]),
		});
	});

	it('aggregates an exact abort reason with candidate cleanup failure', async () => {
		const outDir = path.join(tempDir, 'registry');
		await writeLock(outDir, { token: 'owner', pid: process.pid, hostname: os.hostname(), createdAt: Date.now() });
		const controller = new AbortController();
		const reason = new DOMException('abort with cleanup failure', 'AbortError');
		const realRm = fs.rm.bind(fs);
		vi.spyOn(fs, 'rm').mockImplementation(async (targetPath, options) => {
			if (String(targetPath).includes('.registry.lock.candidate-')) throw Object.assign(new Error('candidate cleanup failed'), { code: 'EIO' });
			await realRm(targetPath, options);
		});
		const pending = acquireOutputLock(outDir, { signal: controller.signal, retryMs: 5_000, timeoutMs: 60_000 });
		await new Promise((resolve) => setTimeout(resolve, 10));
		controller.abort(reason);
		await expect(pending).rejects.toMatchObject({ errors: expect.arrayContaining([reason, expect.objectContaining({ code: 'EIO' })]) });
	});

	it('releases only its detached owner and preserves a replacement owner', async () => {
		const outDir = path.join(tempDir, 'registry');
		let releaseRace = false;
		const lock = await acquireOutputLock(outDir, {
			hooks: {
				onLockDetached: async (_detachedPath, lockPath) => {
					if (!releaseRace) return;
					await fs.mkdir(lockPath);
					await fs.writeFile(
						path.join(lockPath, 'owner.json'),
						`${JSON.stringify({ token: 'replacement', pid: process.pid, hostname: os.hostname(), createdAt: Date.now() })}\n`,
					);
				},
			},
		});
		releaseRace = true;
		await lock.release();
		expect(await readToken(lock.lockPath)).toBe('replacement');
		expect((await fs.readdir(tempDir)).some((entry) => entry.startsWith('.registry.lock.release-'))).toBe(false);
	});
});
