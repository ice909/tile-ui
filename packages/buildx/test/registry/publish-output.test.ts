import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, vi } from 'vitest';

import { publishRegistryOutput, RegistryPostCommitError, RegistryRollbackError } from '../../src/registry/pipeline/publish-output';

let tempDir = '';

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((next) => {
		resolve = next;
	});
	return { promise, resolve };
}

function collectErrors(error: unknown): unknown[] {
	if (error instanceof AggregateError) return [error, ...error.errors.flatMap(collectErrors)];
	if (error instanceof Error && error.cause) return [error, ...collectErrors(error.cause)];
	return [error];
}

beforeEach(async () => {
	tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tile-ui-publish-'));
});

afterEach(async () => {
	vi.restoreAllMocks();
	await fs.rm(tempDir, { recursive: true, force: true });
});

describe('publishRegistryOutput', () => {
	it('serializes concurrent publishers for the same destination', async () => {
		const outDir = path.join(tempDir, 'registry');
		const firstStaging = path.join(tempDir, '.registry.staging-first');
		const firstBackup = path.join(tempDir, '.registry.backup-first');
		const secondStaging = path.join(tempDir, '.registry.staging-second');
		const secondBackup = path.join(tempDir, '.registry.backup-second');
		const firstLocked = deferred();
		const releaseFirst = deferred();
		await fs.mkdir(outDir);
		await fs.mkdir(firstStaging);
		await fs.mkdir(secondStaging);
		await fs.writeFile(path.join(outDir, 'registry.json'), 'old\n');
		await fs.writeFile(path.join(firstStaging, 'registry.json'), 'first\n');
		await fs.writeFile(path.join(secondStaging, 'registry.json'), 'second\n');

		const first = publishRegistryOutput(outDir, firstStaging, firstBackup, {
			hooks: {
				onLockAcquired: async () => {
					firstLocked.resolve();
					await releaseFirst.promise;
				},
			},
		});
		await firstLocked.promise;
		const second = publishRegistryOutput(outDir, secondStaging, secondBackup, { lock: { retryMs: 1, timeoutMs: 1_000 } });
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(await fs.readFile(path.join(outDir, 'registry.json'), 'utf-8')).toBe('old\n');

		releaseFirst.resolve();
		await Promise.all([first, second]);
		expect(await fs.readFile(path.join(outDir, 'registry.json'), 'utf-8')).toBe('second\n');
		expect((await fs.readdir(tempDir)).filter((entry) => entry.includes('.registry.'))).toEqual([]);
	});

	it('preserves the committed generation when backup cleanup fails', async () => {
		const outDir = path.join(tempDir, 'registry');
		const stagingDir = path.join(tempDir, '.registry.staging-test');
		const backupDir = path.join(tempDir, '.registry.backup-test');
		await fs.mkdir(outDir);
		await fs.mkdir(stagingDir);
		await fs.writeFile(path.join(outDir, 'registry.json'), 'old\n');
		await fs.writeFile(path.join(stagingDir, 'registry.json'), 'new\n');
		const realRm = fs.rm.bind(fs);
		vi.spyOn(fs, 'rm').mockImplementation(async (targetPath, options) => {
			if (targetPath === backupDir) throw Object.assign(new Error('backup cleanup failed'), { code: 'EIO' });
			await realRm(targetPath, options);
		});

		await expect(publishRegistryOutput(outDir, stagingDir, backupDir)).rejects.toBeInstanceOf(RegistryPostCommitError);
		expect(await fs.readFile(path.join(outDir, 'registry.json'), 'utf-8')).toBe('new\n');
		expect(await fs.readFile(path.join(backupDir, 'registry.json'), 'utf-8')).toBe('old\n');
		await expect(fs.access(path.join(tempDir, '.registry.lock'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('restores the previous generation when publishing staging fails', async () => {
		const outDir = path.join(tempDir, 'registry');
		const stagingDir = path.join(tempDir, '.registry.staging-test');
		const backupDir = path.join(tempDir, '.registry.backup-test');
		await fs.mkdir(outDir);
		await fs.mkdir(stagingDir);
		await fs.writeFile(path.join(outDir, 'registry.json'), 'old\n');
		await fs.writeFile(path.join(stagingDir, 'registry.json'), 'new\n');
		const realRename = fs.rename.bind(fs);
		let renameCount = 0;
		vi.spyOn(fs, 'rename').mockImplementation(async (source, destination) => {
			renameCount += 1;
			if (renameCount === 2) throw Object.assign(new Error('publish failed'), { code: 'EIO' });
			await realRename(source, destination);
		});

		await expect(publishRegistryOutput(outDir, stagingDir, backupDir)).rejects.toThrow('publish failed');
		expect(await fs.readFile(path.join(outDir, 'registry.json'), 'utf-8')).toBe('old\n');
		expect((await fs.readdir(tempDir)).filter((entry) => entry.includes('.registry.'))).toEqual([]);
	});

	it('preserves the backup when publication and rollback both fail', async () => {
		const outDir = path.join(tempDir, 'registry');
		const stagingDir = path.join(tempDir, '.registry.staging-test');
		const backupDir = path.join(tempDir, '.registry.backup-test');
		await fs.mkdir(outDir);
		await fs.mkdir(stagingDir);
		await fs.writeFile(path.join(outDir, 'registry.json'), 'old\n');
		await fs.writeFile(path.join(stagingDir, 'registry.json'), 'new\n');
		const realRename = fs.rename.bind(fs);
		vi.spyOn(fs, 'rename').mockImplementation(async (source, destination) => {
			if (source === stagingDir && destination === outDir) throw Object.assign(new Error('publish failed'), { code: 'EIO' });
			if (source === backupDir && destination === outDir) throw Object.assign(new Error('rollback failed'), { code: 'EIO' });
			await realRename(source, destination);
		});

		await expect(publishRegistryOutput(outDir, stagingDir, backupDir)).rejects.toBeInstanceOf(RegistryRollbackError);
		expect(await fs.readFile(path.join(backupDir, 'registry.json'), 'utf-8')).toBe('old\n');
		await expect(fs.access(stagingDir)).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(fs.access(path.join(tempDir, '.registry.lock'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('reports staging and lock cleanup failures together', async () => {
		const outDir = path.join(tempDir, 'registry');
		const stagingDir = path.join(tempDir, '.registry.staging-test');
		const backupDir = path.join(tempDir, '.registry.backup-test');
		await fs.mkdir(stagingDir);
		await fs.writeFile(path.join(stagingDir, 'registry.json'), 'new\n');
		const controller = new AbortController();
		const realRm = fs.rm.bind(fs);
		vi.spyOn(fs, 'rm').mockImplementation(async (targetPath, options) => {
			if (targetPath === stagingDir || String(targetPath).includes('.registry.lock.release-')) {
				throw Object.assign(new Error(`cleanup failed: ${targetPath}`), { code: 'EIO' });
			}
			await realRm(targetPath, options);
		});

		let caught: unknown;
		try {
			await publishRegistryOutput(outDir, stagingDir, backupDir, {
				signal: controller.signal,
				hooks: { onLockAcquired: () => controller.abort(new DOMException('abort', 'AbortError')) },
			});
		} catch (error) {
			caught = error;
		}
		const errors = collectErrors(caught);
		expect(errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'AbortError' }),
				expect.objectContaining({ code: 'EIO', message: expect.stringContaining(stagingDir) }),
				expect.objectContaining({ code: 'EIO', message: expect.stringContaining('.registry.lock.release-') }),
			]),
		);
	});
});
