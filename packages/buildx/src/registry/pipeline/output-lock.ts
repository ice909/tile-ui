import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

interface LockMetadata {
	token: string;
	pid: number;
	hostname: string;
	createdAt: number;
}

interface LockIdentity {
	dev: bigint;
	ino: bigint;
	mtimeMs: number;
}

interface LockObservation {
	metadata: LockMetadata | null;
	ageMs: number;
}

export interface OutputLockOptions {
	signal?: AbortSignal;
	timeoutMs?: number;
	retryMs?: number;
	staleMs?: number;
	onRecoveryArtifact?: (artifactPath: string, reason: string) => Promise<void> | void;
	hooks?: {
		onCandidateReady?: (candidatePath: string, lockPath: string) => Promise<void> | void;
		onLockObserved?: (lockPath: string) => Promise<void> | void;
		onLockDetached?: (detachedPath: string, lockPath: string) => Promise<void> | void;
	};
}

export interface OutputLockHandle {
	lockPath: string;
	release: () => Promise<void>;
}

function lockPathFor(outDir: string) {
	return path.join(path.dirname(outDir), `.${path.basename(outDir)}.lock`);
}

function uniqueSibling(targetPath: string, kind: string) {
	return `${targetPath}.${kind}-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function abortReason(signal: AbortSignal) {
	return signal.reason ?? new DOMException('Registry output lock acquisition aborted.', 'AbortError');
}

function throwIfAborted(signal?: AbortSignal) {
	if (signal?.aborted) throw abortReason(signal);
}

function abortable<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
	if (!signal) return operation;
	throwIfAborted(signal);
	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(abortReason(signal));
		signal.addEventListener('abort', onAbort, { once: true });
		operation.then(
			(value) => {
				signal.removeEventListener('abort', onAbort);
				resolve(value);
			},
			(error) => {
				signal.removeEventListener('abort', onAbort);
				reject(error);
			},
		);
	});
}

function delay(ms: number, signal?: AbortSignal) {
	if (!signal) return new Promise<void>((resolve) => setTimeout(resolve, ms));
	throwIfAborted(signal);
	return new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => {
			signal.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(abortReason(signal));
		};
		signal.addEventListener('abort', onAbort, { once: true });
	});
}

function isProcessAlive(pid: number) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return (error as NodeJS.ErrnoException).code === 'EPERM';
	}
}

function isValidMetadata(value: unknown): value is LockMetadata {
	if (!value || typeof value !== 'object') return false;
	const metadata = value as Partial<LockMetadata>;
	return (
		typeof metadata.token === 'string' &&
		metadata.token.length > 0 &&
		Number.isInteger(metadata.pid) &&
		(metadata.pid ?? 0) > 0 &&
		typeof metadata.hostname === 'string' &&
		metadata.hostname.length > 0 &&
		typeof metadata.createdAt === 'number' &&
		Number.isFinite(metadata.createdAt)
	);
}

async function readMetadata(targetPath: string) {
	try {
		const value: unknown = JSON.parse(await fs.readFile(path.join(targetPath, 'owner.json'), 'utf-8'));
		return isValidMetadata(value) ? value : null;
	} catch (error) {
		if (['ENOENT', 'EISDIR', 'SyntaxError'].includes((error as NodeJS.ErrnoException).code ?? (error as Error).name)) return null;
		throw error;
	}
}

async function readIdentity(targetPath: string): Promise<LockIdentity | null> {
	try {
		const stats = await fs.stat(targetPath, { bigint: true });
		return { dev: stats.dev, ino: stats.ino, mtimeMs: Number(stats.mtimeMs) };
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw error;
	}
}

function sameIdentity(left: LockIdentity, right: LockIdentity) {
	return left.dev === right.dev && left.ino === right.ino;
}

async function cleanupCandidate(candidatePath: string, primaryError?: unknown) {
	try {
		await fs.rm(candidatePath, { recursive: true, force: true });
	} catch (cleanupError) {
		if (primaryError) throw new AggregateError([primaryError, cleanupError], `Output lock operation failed and candidate cleanup was incomplete: '${candidatePath}'.`);
		throw cleanupError;
	}
	if (primaryError) throw primaryError;
}

async function createCandidate(lockPath: string, metadata: LockMetadata, options: OutputLockOptions) {
	const candidatePath = uniqueSibling(lockPath, 'candidate');
	let primaryError: unknown;
	try {
		throwIfAborted(options.signal);
		await fs.mkdir(candidatePath);
		throwIfAborted(options.signal);
		await fs.writeFile(path.join(candidatePath, 'owner.json'), `${JSON.stringify(metadata, null, 2)}\n`, { encoding: 'utf-8', signal: options.signal });
		throwIfAborted(options.signal);
		if (options.hooks?.onCandidateReady) await abortable(Promise.resolve(options.hooks.onCandidateReady(candidatePath, lockPath)), options.signal);
		throwIfAborted(options.signal);
		return candidatePath;
	} catch (error) {
		primaryError = error;
	}
	await cleanupCandidate(candidatePath, primaryError);
	throw primaryError;
}

async function detachObservedLock(lockPath: string, observed: LockIdentity, kind: string, options: OutputLockOptions, signal?: AbortSignal) {
	const detachedPath = uniqueSibling(lockPath, kind);
	throwIfAborted(signal);
	if (options.hooks?.onLockObserved) await abortable(Promise.resolve(options.hooks.onLockObserved(lockPath)), signal);
	throwIfAborted(signal);
	try {
		await fs.rename(lockPath, detachedPath);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw error;
	}
	try {
		throwIfAborted(signal);
		if (options.hooks?.onLockDetached) await abortable(Promise.resolve(options.hooks.onLockDetached(detachedPath, lockPath)), signal);
		throwIfAborted(signal);
		const detachedIdentity = await readIdentity(detachedPath);
		throwIfAborted(signal);
		if (!detachedIdentity || !sameIdentity(observed, detachedIdentity)) {
			throw new Error(`Registry lock changed before detachment at '${lockPath}'. Detached artifact preserved at '${detachedPath}' if restoration conflicted.`);
		}
		return detachedPath;
	} catch (error) {
		try {
			await restoreDetachedLock(lockPath, detachedPath);
		} catch (restoreError) {
			throw new AggregateError([error, restoreError], `Registry lock inspection failed and detached lock restoration was incomplete: '${detachedPath}'.`);
		}
		throw error;
	}
}

async function restoreDetachedLock(lockPath: string, detachedPath: string) {
	try {
		await fs.rename(detachedPath, lockPath);
	} catch (error) {
		if (['EEXIST', 'ENOTEMPTY'].includes((error as NodeJS.ErrnoException).code ?? '')) {
			throw new Error(`Registry lock ownership conflict at '${lockPath}'. Detached artifact preserved at '${detachedPath}'.`, { cause: error });
		}
		throw error;
	}
}

async function observeDetached(detachedPath: string, identity: LockIdentity): Promise<LockObservation> {
	const metadata = await readMetadata(detachedPath);
	return {
		metadata,
		ageMs: Math.max(0, Date.now() - (metadata?.createdAt ?? identity.mtimeMs)),
	};
}

function timeoutError(lockPath: string, observation: LockObservation | null, timeoutMs: number) {
	const owner = observation?.metadata;
	const detail = owner
		? `owner pid=${owner.pid}, host=${owner.hostname}, ageMs=${Math.round(observation.ageMs)}`
		: observation
			? `owner metadata is missing, partial, or malformed; ageMs=${Math.round(observation.ageMs)}`
			: 'owner changed while waiting';
	return new Error(`Timed out after ${timeoutMs}ms waiting for registry output lock '${lockPath}' (${detail}).`);
}

async function inspectOrRecover(lockPath: string, staleMs: number, options: OutputLockOptions) {
	throwIfAborted(options.signal);
	const observed = await readIdentity(lockPath);
	throwIfAborted(options.signal);
	if (!observed) return { retryNow: true, observation: null };
	const liveMetadata = await readMetadata(lockPath);
	throwIfAborted(options.signal);
	const liveAgeMs = Math.max(0, Date.now() - (liveMetadata?.createdAt ?? observed.mtimeMs));
	const liveObservation: LockObservation = { metadata: liveMetadata, ageMs: liveAgeMs };
	if (liveAgeMs < staleMs) return { retryNow: false, observation: liveObservation };
	if (liveMetadata && (liveMetadata.hostname !== os.hostname() || isProcessAlive(liveMetadata.pid))) {
		return { retryNow: false, observation: liveObservation };
	}

	const detachedPath = await detachObservedLock(lockPath, observed, 'quarantine', options, options.signal);
	if (!detachedPath) return { retryNow: true, observation: null };
	try {
		throwIfAborted(options.signal);
		const observation = await observeDetached(detachedPath, observed);
		throwIfAborted(options.signal);
		const owner = observation.metadata;

		if (!owner) {
			if (options.onRecoveryArtifact) {
				await abortable(
					Promise.resolve(options.onRecoveryArtifact(detachedPath, 'Aged lock metadata is missing, partial, or malformed. Artifact preserved for inspection.')),
					options.signal,
				);
			}
			throwIfAborted(options.signal);
			return { retryNow: true, observation };
		}
		await fs.rm(detachedPath, { recursive: true });
		throwIfAborted(options.signal);
		return { retryNow: true, observation };
	} catch (error) {
		try {
			await restoreDetachedLock(lockPath, detachedPath);
		} catch (restoreError) {
			if ((restoreError as NodeJS.ErrnoException).code !== 'ENOENT') {
				throw new AggregateError([error, restoreError], `Registry stale-lock recovery failed and quarantine restoration was incomplete: '${detachedPath}'.`);
			}
		}
		throw error;
	}
}

export async function acquireOutputLock(outDir: string, options: OutputLockOptions = {}): Promise<OutputLockHandle> {
	throwIfAborted(options.signal);
	const timeoutMs = options.timeoutMs ?? 10_000;
	const retryMs = options.retryMs ?? 25;
	const staleMs = options.staleMs ?? 60_000;
	const lockPath = lockPathFor(outDir);
	const metadata: LockMetadata = {
		token: `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		pid: process.pid,
		hostname: os.hostname(),
		createdAt: Date.now(),
	};
	const deadline = Date.now() + timeoutMs;
	let lastObservation: LockObservation | null = null;
	let acquired = false;

	await fs.mkdir(path.dirname(outDir), { recursive: true });
	throwIfAborted(options.signal);
	const candidatePath = await createCandidate(lockPath, metadata, options);

	try {
		while (true) {
			throwIfAborted(options.signal);
			const existing = await readIdentity(lockPath);
			throwIfAborted(options.signal);
			if (existing) {
				const result = await inspectOrRecover(lockPath, staleMs, options);
				lastObservation = result.observation;
				if (result.retryNow) continue;
				if (Date.now() >= deadline) throw timeoutError(lockPath, lastObservation, timeoutMs);
				await delay(Math.min(retryMs, Math.max(1, deadline - Date.now())), options.signal);
				continue;
			}

			try {
				throwIfAborted(options.signal);
				await fs.rename(candidatePath, lockPath);
				acquired = true;
				throwIfAborted(options.signal);
				break;
			} catch (error) {
				if (!['EEXIST', 'ENOTEMPTY'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
			}

			const result = await inspectOrRecover(lockPath, staleMs, options);
			lastObservation = result.observation;
			if (result.retryNow) continue;
			if (Date.now() >= deadline) throw timeoutError(lockPath, lastObservation, timeoutMs);
			await delay(Math.min(retryMs, Math.max(1, deadline - Date.now())), options.signal);
		}
	} catch (error) {
		const cleanupErrors: unknown[] = [];
		if (acquired) {
			try {
				const observed = await readIdentity(lockPath);
				if (observed) {
					const detachedPath = await detachObservedLock(lockPath, observed, 'abort', options);
					if (detachedPath) {
						const owner = await readMetadata(detachedPath);
						if (owner?.token === metadata.token) await fs.rm(detachedPath, { recursive: true });
						else await restoreDetachedLock(lockPath, detachedPath);
					}
				}
			} catch (cleanupError) {
				cleanupErrors.push(cleanupError);
			}
		}
		try {
			await cleanupCandidate(candidatePath);
		} catch (cleanupError) {
			cleanupErrors.push(cleanupError);
		}
		if (cleanupErrors.length > 0) throw new AggregateError([error, ...cleanupErrors], `Output lock acquisition failed and cleanup was incomplete: '${lockPath}'.`);
		throw error;
	}

	let released = false;
	return {
		lockPath,
		release: async () => {
			if (released) return;
			const observed = await readIdentity(lockPath);
			if (!observed) throw new Error(`Registry output lock disappeared before release: '${lockPath}'.`);
			const detachedPath = await detachObservedLock(lockPath, observed, 'release', options);
			if (!detachedPath) throw new Error(`Registry output lock disappeared before release: '${lockPath}'.`);
			const owner = await readMetadata(detachedPath);
			if (owner?.token !== metadata.token) {
				await restoreDetachedLock(lockPath, detachedPath);
				throw new Error(`Registry output lock ownership changed before release: '${lockPath}'.`);
			}
			await fs.rm(detachedPath, { recursive: true });
			released = true;
		},
	};
}
