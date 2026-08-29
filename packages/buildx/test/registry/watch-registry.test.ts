import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, vi } from 'vitest';

import { buildRegistry } from '../../src/registry/build-registry';
import { loadRegistryManifest } from '../../src/registry/load-registry-manifest';
import { acquireOutputLock } from '../../src/registry/pipeline/output-lock';
import { watchRegistry } from '../../src/registry/watch-registry';
import type { PackageRegistryManifest, RegistryWatcherHandle, RegistryWatchOptions } from '../../src/registry/types';
let tempDir = '';

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((next) => {
		resolve = next;
	});
	return { promise, resolve };
}

function createWatchHarness() {
	const callbacks: Array<() => void> = [];
	const errorCallbacks: Array<(error: Error) => void> = [];
	const close = vi.fn();
	const watch = vi.fn(((_targetPath: string, onChange: () => void): RegistryWatcherHandle => {
		callbacks.push(onChange);
		return {
			close,
			on: (_event: 'error', listener: (error: Error) => void) => {
				errorCallbacks.push(listener);
			},
		};
	}) satisfies NonNullable<RegistryWatchOptions['watch']>);
	return {
		callbacks,
		errorCallbacks,
		close,
		watch,
	};
}

async function flushBuild() {
	await vi.advanceTimersByTimeAsync(1);
	await Promise.resolve();
}

async function waitFor(assertion: () => Promise<void>, timeoutMs = 2_000) {
	const deadline = Date.now() + timeoutMs;
	let lastError: unknown;

	while (Date.now() < deadline) {
		try {
			await assertion();
			return;
		} catch (error) {
			lastError = error;
			await new Promise((resolve) => setTimeout(resolve, 25));
		}
	}

	throw lastError;
}

beforeEach(async () => {
	tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tile-ui-watch-'));
});

afterEach(async () => {
	process.exitCode = undefined;
	vi.useRealTimers();
	vi.restoreAllMocks();
	if (tempDir) {
		await fs.rm(tempDir, { recursive: true, force: true });
	}
});

describe('watchRegistry', () => {
	it('reports a transient rebuild failure and succeeds on the next edit', async () => {
		vi.useFakeTimers();
		const harness = createWatchHarness();
		const error = new Error('temporary failure');
		const onError = vi.fn();
		const run = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
		const cleanup = await watchRegistry({ run, watchPaths: [tempDir], debounceMs: 1, onError, watch: harness.watch });

		harness.callbacks[0]?.();
		await flushBuild();
		expect(onError).toHaveBeenCalledWith(error);
		expect(run).toHaveBeenCalledTimes(2);

		harness.callbacks[0]?.();
		await flushBuild();
		expect(run).toHaveBeenCalledTimes(3);
		await cleanup();
	});

	it('cleanup during an active build prevents queued builds and output writes', async () => {
		vi.useFakeTimers();
		const harness = createWatchHarness();
		const transformStarted = deferred();
		const releaseTransform = deferred();
		const sourcePath = path.join(tempDir, 'source.ts');
		const outDir = path.join(tempDir, 'output');
		await fs.writeFile(sourcePath, 'export const value = true;\n', 'utf-8');

		const run = vi.fn(async (signal: AbortSignal) => {
			await buildRegistry({
				framework: 'solid',
				workspaceRoot: tempDir,
				outDir,
				signal,
				manifest: {
					name: 'test',
					homepage: 'https://example.com',
					items: [
						{ name: 'source', type: 'registry:lib', title: 'Source', description: 'Source', files: [{ source: 'source.ts', type: 'registry:lib', transform: 'copy' }] },
					],
				},
				transforms: {
					file: async ({ content }) => {
						transformStarted.resolve();
						await releaseTransform.promise;
						return { content, target: 'source.ts' };
					},
				},
			});
		});

		const watcherPromise = watchRegistry({ run, watchPaths: [tempDir], debounceMs: 1, watch: harness.watch });
		await transformStarted.promise;
		harness.callbacks[0]?.();
		await flushBuild();

		process.emit('SIGTERM');
		process.emit('SIGTERM');
		releaseTransform.resolve();
		const dispose = await watcherPromise;
		await dispose();
		await vi.runAllTimersAsync();

		expect(run).toHaveBeenCalledTimes(1);
		expect(harness.close).toHaveBeenCalledTimes(1);
		await expect(fs.readdir(outDir)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('watcher disposal aborts an initial build blocked on publication lock contention', async () => {
		const harness = createWatchHarness();
		const sourcePath = path.join(tempDir, 'source.ts');
		const outDir = path.join(tempDir, 'output');
		await fs.writeFile(sourcePath, 'export const value = true;\n', 'utf-8');
		const owner = await acquireOutputLock(outDir);
		const ownerToken = JSON.parse(await fs.readFile(path.join(owner.lockPath, 'owner.json'), 'utf-8')) as { token: string };

		const watcherPromise = watchRegistry({
			run: (signal) =>
				buildRegistry({
					framework: 'solid',
					workspaceRoot: tempDir,
					outDir,
					signal,
					manifest: {
						name: 'test',
						homepage: 'https://example.com',
						items: [
							{
								name: 'source',
								type: 'registry:lib',
								title: 'Source',
								description: 'Source',
								files: [{ source: 'source.ts', type: 'registry:lib', transform: 'copy' }],
							},
						],
					},
					transforms: { file: async ({ content }) => ({ content, target: 'source.ts' }) },
				}),
			watchPaths: [tempDir],
			watch: harness.watch,
		});
		await new Promise((resolve) => setTimeout(resolve, 20));
		const startedAt = Date.now();
		process.emit('SIGTERM');
		const dispose = await watcherPromise;
		await dispose();
		expect(Date.now() - startedAt).toBeLessThan(500);
		expect(harness.close).toHaveBeenCalledTimes(1);
		expect((JSON.parse(await fs.readFile(path.join(owner.lockPath, 'owner.json'), 'utf-8')) as { token: string }).token).toBe(ownerToken.token);
		await expect(fs.access(outDir)).rejects.toMatchObject({ code: 'ENOENT' });
		await owner.release();
	});

	it('ignores missing optional paths but rejects other synchronous watch errors', async () => {
		const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
		const denied = Object.assign(new Error('denied'), { code: 'EACCES' });
		const close = vi.fn();
		const on = vi.fn();
		const watch = vi
			.fn()
			.mockImplementationOnce(() => {
				throw missing;
			})
			.mockImplementationOnce(() => ({ close, on }))
			.mockImplementationOnce(() => {
				throw denied;
			});

		await expect(watchRegistry({ run: vi.fn(), watchPaths: ['missing', 'opened', 'denied'], watch })).rejects.toBe(denied);
		expect(close).toHaveBeenCalledTimes(1);
		expect(on).toHaveBeenCalledWith('error', expect.any(Function));
	});

	it('reports FSWatcher errors and continues rebuilding', async () => {
		vi.useFakeTimers();
		const harness = createWatchHarness();
		const onError = vi.fn();
		const run = vi.fn();
		const dispose = await watchRegistry({ run, watchPaths: [tempDir], debounceMs: 1, watchRetryMs: 1, onError, watch: harness.watch });
		const watcherError = new Error('watcher failed');

		harness.errorCallbacks[0]?.(watcherError);
		expect(onError).toHaveBeenCalledWith(watcherError);
		await vi.advanceTimersByTimeAsync(1);
		expect(harness.watch).toHaveBeenCalledTimes(2);
		harness.callbacks[1]?.();
		await flushBuild();
		expect(run).toHaveBeenCalledTimes(2);
		await dispose();
	});

	it('continues recreation when closing the failed watcher throws', async () => {
		vi.useFakeTimers();
		const callbacks: Array<() => void> = [];
		const errorCallbacks: Array<(error: Error) => void> = [];
		const closeFailure = new Error('close failed');
		const onError = vi.fn();
		const watch = vi.fn(((_targetPath: string, onChange: () => void): RegistryWatcherHandle => {
			callbacks.push(onChange);
			return {
				close:
					watch.mock.calls.length === 1
						? () => {
								throw closeFailure;
							}
						: vi.fn(),
				on: (_event, listener) => errorCallbacks.push(listener),
			};
		}) satisfies NonNullable<RegistryWatchOptions['watch']>);
		const dispose = await watchRegistry({ run: vi.fn(), watchPaths: [tempDir], watchRetryMs: 1, onError, watch });

		errorCallbacks[0]?.(new Error('watcher failed'));
		await vi.advanceTimersByTimeAsync(1);
		expect(watch).toHaveBeenCalledTimes(2);
		await expect(dispose()).rejects.toThrow('Failed to close registry watcher');
		expect(onError).toHaveBeenCalledWith(expect.objectContaining({ cause: closeFailure }));
	});

	it('attempts every watcher close and aggregates disposal failures', async () => {
		const closeOne = new Error('close one');
		const closeTwo = new Error('close two');
		let watcherIndex = 0;
		const watch: NonNullable<RegistryWatchOptions['watch']> = () => {
			const closeError = watcherIndex++ === 0 ? closeOne : closeTwo;
			return {
				close: () => {
					throw closeError;
				},
				on: () => undefined,
			};
		};
		const dispose = await watchRegistry({ run: vi.fn(), watchPaths: ['one', 'two'], onError: vi.fn(), watch });

		const first = dispose();
		expect(dispose()).toBe(first);
		await expect(first).rejects.toMatchObject({ errors: expect.arrayContaining([expect.objectContaining({ cause: closeOne }), expect.objectContaining({ cause: closeTwo })]) });
	});

	it('aggregates setup failure with all watcher close failures', async () => {
		const setupError = Object.assign(new Error('setup denied'), { code: 'EACCES' });
		const closeOne = new Error('close one');
		const closeTwo = new Error('close two');
		let call = 0;
		const watch: NonNullable<RegistryWatchOptions['watch']> = () => {
			call += 1;
			if (call === 3) throw setupError;
			const closeError = call === 1 ? closeOne : closeTwo;
			return {
				close: () => {
					throw closeError;
				},
				on: () => undefined,
			};
		};

		await expect(watchRegistry({ run: vi.fn(), watchPaths: ['one', 'two', 'three'], onError: vi.fn(), watch })).rejects.toMatchObject({
			errors: expect.arrayContaining([
				setupError,
				expect.objectContaining({ errors: expect.arrayContaining([expect.objectContaining({ cause: closeOne }), expect.objectContaining({ cause: closeTwo })]) }),
			]),
		});
	});

	it('rejects disposal after watcher recreation is exhausted', async () => {
		vi.useFakeTimers();
		const harness = createWatchHarness();
		const onError = vi.fn();
		harness.watch
			.mockImplementationOnce((_targetPath, onChange): RegistryWatcherHandle => {
				harness.callbacks.push(onChange);
				return {
					close: harness.close,
					on: (_event: 'error', listener: (error: Error) => void) => {
						harness.errorCallbacks.push(listener);
					},
				};
			})
			.mockImplementation(() => {
				throw Object.assign(new Error('recreate failed'), { code: 'EIO' });
			});
		const dispose = await watchRegistry({ run: vi.fn(), watchPaths: [tempDir], watchRetryMs: 1, watchRetryLimit: 2, onError, watch: harness.watch });

		harness.errorCallbacks[0]?.(new Error('watcher failed'));
		await vi.advanceTimersByTimeAsync(2);
		await expect(dispose()).rejects.toThrow('Failed to recreate registry watcher');
		expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'recreate failed' }));
	});

	it('propagates a non-abort active build failure through disposal', async () => {
		const harness = createWatchHarness();
		const started = deferred();
		const release = deferred();
		const failure = Object.assign(new Error('cleanup failed'), { code: 'EIO' });
		const watcherPromise = watchRegistry({
			run: async () => {
				started.resolve();
				await release.promise;
				throw failure;
			},
			watchPaths: [tempDir],
			onError: vi.fn(),
			watch: harness.watch,
		});

		await started.promise;
		process.emit('SIGTERM');
		release.resolve();
		const dispose = await watcherPromise;
		await expect(dispose()).rejects.toBe(failure);
		await Promise.resolve();
		expect(process.exitCode).toBe(1);
	});

	it('initial build failure closes watchers, removes handlers, and ignores later callbacks', async () => {
		vi.useFakeTimers();
		const harness = createWatchHarness();
		const run = vi.fn().mockRejectedValue(new Error('initial failure'));
		const sigintListeners = process.listenerCount('SIGINT');
		const sigtermListeners = process.listenerCount('SIGTERM');

		await expect(watchRegistry({ run, watchPaths: [tempDir], debounceMs: 1, watch: harness.watch })).rejects.toThrow('initial failure');
		expect(harness.close).toHaveBeenCalledTimes(1);
		expect(process.listenerCount('SIGINT')).toBe(sigintListeners);
		expect(process.listenerCount('SIGTERM')).toBe(sigtermListeners);

		harness.callbacks[0]?.();
		await vi.runAllTimersAsync();
		expect(run).toHaveBeenCalledTimes(1);
	});

	it('runs initial build and rebuilds on watched changes', async () => {
		const watchedFile = path.join(tempDir, 'source.ts');
		await fs.writeFile(watchedFile, 'export const value = 1;\n', 'utf-8');

		const run = vi.fn<() => void>();

		const cleanup = await watchRegistry({
			run,
			watchPaths: [tempDir],
			debounceMs: 25,
		});

		expect(run).toHaveBeenCalledTimes(1);

		await fs.writeFile(watchedFile, 'export const value = 2;\n', 'utf-8');
		await new Promise((resolve) => setTimeout(resolve, 250));

		expect(run.mock.calls.length).toBeGreaterThan(1);
		await cleanup();
	});

	it('reloads statically imported manifest items before rebuilding output', async () => {
		const registryDir = path.join(tempDir, 'registry');
		const outDir = path.join(tempDir, 'output');
		const itemPath = path.join(registryDir, 'item.mjs');
		const manifestPath = path.join(registryDir, 'manifest.mjs');
		const sourcePath = path.join(tempDir, 'component.ts');

		await fs.mkdir(registryDir, { recursive: true });
		await fs.writeFile(sourcePath, 'export const component = true;\n', 'utf-8');
		await fs.writeFile(
			itemPath,
			`export const item = { name: 'sample', type: 'registry:lib', title: 'Sample', description: 'before', files: [{ source: 'component.ts', type: 'registry:lib', transform: 'copy', target: 'sample.ts' }] };\n`,
			'utf-8',
		);
		await fs.writeFile(
			manifestPath,
			`import { item } from './item.mjs';\nexport const testManifest = { name: 'test', homepage: 'https://example.com', items: [item] };\n`,
			'utf-8',
		);

		const run = async () => {
			const manifest = await loadRegistryManifest(manifestPath, 'testManifest');
			await buildRegistry({
				framework: 'solid',
				workspaceRoot: tempDir,
				outDir,
				manifest,
				transforms: {
					file: async ({ content, file }) => ({ content, target: file.target }),
				},
			});
		};

		const cleanup = await watchRegistry({ run, watchPaths: [registryDir], debounceMs: 25 });
		const readDescription = async () => {
			const item = JSON.parse(await fs.readFile(path.join(outDir, 'sample.json'), 'utf-8')) as PackageRegistryManifest['items'][number];
			return item.description;
		};

		expect(await readDescription()).toBe('before');
		await fs.writeFile(
			itemPath,
			`export const item = { name: 'sample', type: 'registry:lib', title: 'Sample', description: 'after', files: [{ source: 'component.ts', type: 'registry:lib', transform: 'copy', target: 'sample.ts' }] };\n`,
			'utf-8',
		);

		await waitFor(async () => {
			expect(await readDescription()).toBe('after');
		});
		await cleanup();
	});
});
