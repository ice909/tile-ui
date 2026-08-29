import fs from 'node:fs';
import path from 'node:path';

import type { RegistryWatcherHandle, RegistryWatchOptions } from './types';

function isCancellationFromSignal(error: unknown, signal: AbortSignal) {
	return signal.aborted && (error === signal.reason || (error instanceof Error && error.name === 'AbortError'));
}

export async function watchRegistry(options: RegistryWatchOptions) {
	const debounceMs = options.debounceMs ?? 100;
	const watchRetryMs = options.watchRetryMs ?? 100;
	const watchRetryLimit = options.watchRetryLimit ?? 3;
	const watchers = new Map<string, RegistryWatcherHandle>();
	const retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
	const resourceErrors: unknown[] = [];
	const watch: NonNullable<RegistryWatchOptions['watch']> =
		options.watch ?? ((targetPath, onChange) => fs.watch(targetPath, { recursive: true }, onChange) as unknown as RegistryWatcherHandle);
	const reportError = options.onError ?? ((error: unknown) => console.error('Registry rebuild failed:', error));
	let timer: ReturnType<typeof setTimeout> | null = null;
	let activeController: AbortController | null = null;
	let activeBuild: Promise<void> | null = null;
	let rebuildQueued = false;
	let disposed = false;
	let disposePromise: Promise<void> | null = null;
	let lifecycleError: unknown;

	const safeReportError = (error: unknown) => {
		try {
			reportError(error);
		} catch (reportingError) {
			console.error('Registry rebuild error reporter failed:', reportingError);
		}
	};

	const closeWatcher = (watcher: RegistryWatcherHandle, context: string) => {
		try {
			watcher.close();
		} catch (error) {
			const closeError = new Error(`Failed to close registry watcher (${context}).`, { cause: error });
			resourceErrors.push(closeError);
			safeReportError(closeError);
		}
	};

	const scheduleBuild = () => {
		if (disposed) return;
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			void runBuild(false);
		}, debounceMs);
	};

	const createWatcher = (targetPath: string, attempt = 0): RegistryWatcherHandle | null => {
		try {
			const watcher = watch(targetPath, scheduleBuild);
			watcher.on('error', (error: Error) => {
				if (disposed || watchers.get(targetPath) !== watcher) return;
				watchers.delete(targetPath);
				closeWatcher(watcher, `after error for '${targetPath}'`);
				safeReportError(error);
				scheduleWatcherRetry(targetPath, 1);
			});
			watchers.set(targetPath, watcher);
			return watcher;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT' && attempt === 0) return null;
			throw error;
		}
	};

	const scheduleWatcherRetry = (targetPath: string, attempt: number) => {
		if (disposed) return;
		if (attempt > watchRetryLimit) {
			lifecycleError = new Error(`Failed to recreate registry watcher for '${targetPath}' after ${watchRetryLimit} attempts.`);
			safeReportError(lifecycleError);
			return;
		}

		const retryTimer = setTimeout(() => {
			retryTimers.delete(targetPath);
			if (disposed) return;
			try {
				createWatcher(targetPath, attempt);
			} catch (error) {
				safeReportError(error);
				scheduleWatcherRetry(targetPath, attempt + 1);
			}
		}, watchRetryMs);
		retryTimers.set(targetPath, retryTimer);
	};

	const dispose = () => {
		if (disposePromise) return disposePromise;

		disposed = true;
		rebuildQueued = false;
		disposePromise = Promise.resolve().then(async () => {
			process.off('SIGINT', handleSignal);
			process.off('SIGTERM', handleSignal);
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			for (const retryTimer of retryTimers.values()) clearTimeout(retryTimer);
			retryTimers.clear();

			const controller = activeController;
			controller?.abort(new DOMException('Registry watcher disposed.', 'AbortError'));
			for (const [targetPath, watcher] of watchers) closeWatcher(watcher, `disposing '${targetPath}'`);
			watchers.clear();

			const errors: unknown[] = [];
			try {
				await (activeBuild ?? Promise.resolve());
			} catch (error) {
				if (!controller || !isCancellationFromSignal(error, controller.signal)) errors.push(error);
			}
			if (lifecycleError) errors.push(lifecycleError);
			errors.push(...resourceErrors);
			if (errors.length === 1) throw errors[0];
			if (errors.length > 1) throw new AggregateError(errors, 'Registry watcher disposal failed.');
		});
		return disposePromise;
	};

	const handleSignal = () => {
		void dispose()
			.then(() => {
				process.exitCode = 0;
			})
			.catch((error) => {
				safeReportError(error);
				process.exitCode = 1;
			});
	};

	const runBuild = async (initial: boolean) => {
		if (disposed) return;
		if (activeBuild) {
			rebuildQueued = true;
			return;
		}

		const controller = new AbortController();
		activeController = controller;
		const build = Promise.resolve().then(() => options.run(controller.signal));
		activeBuild = build;

		try {
			await build;
		} catch (error) {
			if (initial && !disposed && !isCancellationFromSignal(error, controller.signal)) throw error;
			if (!initial && !disposed && !isCancellationFromSignal(error, controller.signal)) safeReportError(error);
		} finally {
			if (activeBuild === build) {
				activeBuild = null;
				activeController = null;
			}
			if (!disposed && rebuildQueued) {
				rebuildQueued = false;
				scheduleBuild();
			}
		}
	};

	process.on('SIGINT', handleSignal);
	process.on('SIGTERM', handleSignal);

	try {
		for (const watchPath of options.watchPaths) {
			const targetPath = path.resolve(watchPath);
			if (!watchers.has(targetPath)) createWatcher(targetPath);
		}
		await runBuild(true);
	} catch (error) {
		try {
			await dispose();
		} catch (disposeError) {
			throw new AggregateError([error, disposeError], 'Registry watcher setup failed and rollback was incomplete.');
		}
		throw error;
	}

	return dispose;
}
