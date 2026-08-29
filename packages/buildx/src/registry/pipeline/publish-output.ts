import fs from 'node:fs/promises';
import path from 'node:path';

import { acquireOutputLock, type OutputLockHandle, type OutputLockOptions } from './output-lock';

const TRANSACTION_SCHEMA = 1;

interface TransactionMetadata {
	schema: number;
	id: string;
	outDir: string;
	backupName: string;
	createdAt: number;
}

export class RegistryPostCommitError extends Error {
	readonly committed = true;
}

export class RegistryRollbackError extends AggregateError {
	readonly recoveryRequired = true;
}

function transactionId() {
	return `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2)}`;
}

function siblingPath(outDir: string, kind: 'staging' | 'backup', id: string) {
	return path.join(path.dirname(outDir), `.${path.basename(outDir)}.${kind}-${id}`);
}

function transactionRecordPath(outDir: string, id: string) {
	return path.join(path.dirname(outDir), `.${path.basename(outDir)}.transaction-${id}.json`);
}

async function pathExists(targetPath: string) {
	try {
		await fs.access(targetPath);
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
}

function combineErrors(primary: unknown, cleanupErrors: unknown[], message: string) {
	if (cleanupErrors.length === 0) return primary;
	if (primary instanceof RegistryPostCommitError) return new RegistryPostCommitError(message, { cause: new AggregateError([primary, ...cleanupErrors], message) });
	if (primary instanceof RegistryRollbackError) return new RegistryRollbackError([primary, ...cleanupErrors], message);
	return new AggregateError([primary, ...cleanupErrors], message);
}

function throwIfAborted(signal?: AbortSignal) {
	if (signal?.aborted) throw signal.reason ?? new DOMException('Registry publication aborted.', 'AbortError');
}

function isTransactionMetadata(value: unknown, outDir: string, id: string): value is TransactionMetadata {
	if (!value || typeof value !== 'object') return false;
	const metadata = value as Partial<TransactionMetadata>;
	return (
		metadata.schema === TRANSACTION_SCHEMA &&
		metadata.id === id &&
		metadata.outDir === path.resolve(outDir) &&
		metadata.backupName === path.basename(siblingPath(outDir, 'backup', id)) &&
		typeof metadata.createdAt === 'number' &&
		Number.isFinite(metadata.createdAt)
	);
}

async function writeTransactionRecord(recordPath: string, metadata: TransactionMetadata, signal?: AbortSignal) {
	const candidatePath = `${recordPath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
	let primaryError: unknown;
	try {
		throwIfAborted(signal);
		await fs.writeFile(candidatePath, `${JSON.stringify(metadata, null, 2)}\n`, { encoding: 'utf-8', signal });
		throwIfAborted(signal);
		await fs.rename(candidatePath, recordPath);
	} catch (error) {
		primaryError = error;
	}
	try {
		await fs.rm(candidatePath, { force: true });
	} catch (cleanupError) {
		if (primaryError) throw new AggregateError([primaryError, cleanupError], `Failed to create transaction record '${recordPath}'.`);
		throw cleanupError;
	}
	if (primaryError) throw primaryError;
}

async function isValidGeneration(backupDir: string) {
	try {
		JSON.parse(await fs.readFile(path.join(backupDir, 'registry.json'), 'utf-8'));
		return true;
	} catch {
		return false;
	}
}

interface OwnedTransaction {
	metadata: TransactionMetadata;
	recordPath: string;
	backupDir: string;
}

export interface RegistryRecoveryOptions {
	signal?: AbortSignal;
	onRecoveryArtifact?: (artifactPath: string, reason: string) => Promise<void> | void;
}

async function reportRecoveryArtifact(options: RegistryRecoveryOptions, artifactPath: string, reason: string) {
	throwIfAborted(options.signal);
	if (options.onRecoveryArtifact) {
		await options.onRecoveryArtifact(artifactPath, reason);
		throwIfAborted(options.signal);
		return;
	}
	console.warn(`Registry recovery artifact preserved at '${artifactPath}': ${reason}`);
}

async function readOwnedTransactions(outDir: string, options: RegistryRecoveryOptions) {
	throwIfAborted(options.signal);
	const parent = path.dirname(outDir);
	const prefix = `.${path.basename(outDir)}.transaction-`;
	const transactions: OwnedTransaction[] = [];
	let entries: string[];
	try {
		entries = await fs.readdir(parent);
		throwIfAborted(options.signal);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return transactions;
		throw error;
	}

	for (const entry of entries.filter((name) => name.startsWith(prefix) && name.endsWith('.json')).sort()) {
		throwIfAborted(options.signal);
		const recordPath = path.join(parent, entry);
		const id = entry.slice(prefix.length, -'.json'.length);
		try {
			const value: unknown = JSON.parse(await fs.readFile(recordPath, 'utf-8'));
			throwIfAborted(options.signal);
			if (!isTransactionMetadata(value, outDir, id)) {
				await reportRecoveryArtifact(options, recordPath, 'Transaction metadata is malformed or belongs to another destination.');
				continue;
			}
			const backupDir = path.join(parent, value.backupName);
			if (!(await isValidGeneration(backupDir))) {
				await reportRecoveryArtifact(options, recordPath, `Owned transaction backup is missing or invalid: '${backupDir}'.`);
				continue;
			}
			transactions.push({ metadata: value, recordPath, backupDir });
		} catch (error) {
			throwIfAborted(options.signal);
			await reportRecoveryArtifact(options, recordPath, `Transaction metadata could not be read: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	return transactions.sort((left, right) => right.metadata.createdAt - left.metadata.createdAt || right.metadata.id.localeCompare(left.metadata.id));
}

async function removeTransaction(transaction: OwnedTransaction) {
	const errors: unknown[] = [];
	for (const targetPath of [transaction.backupDir, transaction.recordPath]) {
		try {
			await fs.rm(targetPath, { recursive: true, force: true });
		} catch (error) {
			errors.push(error);
		}
	}
	if (errors.length > 0) throw new AggregateError(errors, `Failed to clean recovered registry transaction '${transaction.metadata.id}'.`);
}

export async function reconcileRegistryTransactions(outDir: string, options: RegistryRecoveryOptions = {}) {
	throwIfAborted(options.signal);
	const transactions = await readOwnedTransactions(outDir, options);
	const cleanupErrors: unknown[] = [];

	if (!(await pathExists(outDir)) && transactions.length > 0) {
		throwIfAborted(options.signal);
		const selected = transactions.shift()!;
		await fs.rename(selected.backupDir, outDir);
		try {
			await fs.rm(selected.recordPath, { force: true });
		} catch (error) {
			cleanupErrors.push(error);
		}
	}

	if (await pathExists(outDir)) {
		for (const transaction of transactions) {
			throwIfAborted(options.signal);
			try {
				await removeTransaction(transaction);
			} catch (error) {
				cleanupErrors.push(error);
				await reportRecoveryArtifact(options, transaction.backupDir, 'Stale owned backup cleanup failed after a published generation was available.');
			}
		}
	}

	if (cleanupErrors.length > 0) throw new AggregateError(cleanupErrors, `Registry transaction reconciliation completed with cleanup errors for '${outDir}'.`);
}

export function createRegistryTransactionPaths(outDir: string) {
	const id = transactionId();
	return {
		id,
		stagingDir: siblingPath(outDir, 'staging', id),
		backupDir: siblingPath(outDir, 'backup', id),
		recordPath: transactionRecordPath(outDir, id),
	};
}

export interface RegistryPublicationSessionOptions extends RegistryRecoveryOptions {
	lock?: OutputLockOptions;
}

export async function beginRegistryPublication(outDir: string, options: RegistryPublicationSessionOptions = {}) {
	throwIfAborted(options.signal ?? options.lock?.signal);
	const lock = await acquireOutputLock(outDir, { ...options.lock, signal: options.signal ?? options.lock?.signal });
	try {
		await reconcileRegistryTransactions(outDir, { ...options, signal: options.signal ?? options.lock?.signal });
	} catch (error) {
		try {
			await lock.release();
		} catch (releaseError) {
			throw new AggregateError([error, releaseError], `Registry reconciliation and lock release failed for '${outDir}'.`);
		}
		throw error;
	}
	return lock;
}

export interface PublishRegistryOutputOptions extends RegistryRecoveryOptions {
	signal?: AbortSignal;
	lock?: OutputLockOptions;
	lockHandle?: OutputLockHandle;
	hooks?: {
		onLockAcquired?: () => Promise<void> | void;
	};
}

export async function publishRegistryOutput(outDir: string, stagingDir: string, backupDir: string, options: PublishRegistryOutputOptions = {}) {
	const ownsLock = !options.lockHandle;
	const lock = options.lockHandle ?? (await beginRegistryPublication(outDir, options));
	const id = path.basename(backupDir).slice(`.${path.basename(outDir)}.backup-`.length);
	const recordPath = transactionRecordPath(outDir, id);
	const metadata: TransactionMetadata = {
		schema: TRANSACTION_SCHEMA,
		id,
		outDir: path.resolve(outDir),
		backupName: path.basename(backupDir),
		createdAt: Number(id.split('-')[0]) || Date.now(),
	};
	let movedPublishedOutput = false;
	let committed = false;
	let primaryError: unknown;
	const cleanupErrors: unknown[] = [];

	try {
		await options.hooks?.onLockAcquired?.();
		options.signal?.throwIfAborted();

		if (await pathExists(outDir)) {
			await writeTransactionRecord(recordPath, metadata, options.signal);
			await fs.rename(outDir, backupDir);
			movedPublishedOutput = true;
		}

		options.signal?.throwIfAborted();
		await fs.rename(stagingDir, outDir);
		committed = true;

		if (movedPublishedOutput) {
			const transactionCleanupErrors: unknown[] = [];
			for (const targetPath of [backupDir, recordPath]) {
				try {
					await fs.rm(targetPath, { recursive: true, force: true });
				} catch (error) {
					transactionCleanupErrors.push(error);
				}
			}
			if (transactionCleanupErrors.length > 0) {
				throw new RegistryPostCommitError(
					`Registry generation committed at '${outDir}', but previous transaction cleanup failed. Inspect '${backupDir}' and '${recordPath}'.`,
					{ cause: new AggregateError(transactionCleanupErrors, 'Previous transaction cleanup errors.') },
				);
			}
			movedPublishedOutput = false;
		}
	} catch (error) {
		primaryError = error;
		if (!committed && movedPublishedOutput) {
			try {
				await fs.rename(backupDir, outDir);
				try {
					await fs.rm(recordPath, { force: true });
				} catch (recordCleanupError) {
					throw new AggregateError([error, recordCleanupError], `Registry output was restored, but transaction record cleanup failed: '${recordPath}'.`);
				}
				movedPublishedOutput = false;
			} catch (rollbackError) {
				primaryError = new RegistryRollbackError(
					[error, rollbackError],
					`Registry publication failed and rollback could not restore '${outDir}'. Previous output remains at '${backupDir}'.`,
				);
			}
		}
	} finally {
		try {
			await fs.rm(stagingDir, { recursive: true, force: true });
		} catch (error) {
			cleanupErrors.push(error);
		}
		if (ownsLock) {
			try {
				await lock.release();
			} catch (error) {
				cleanupErrors.push(error);
			}
		}
	}

	if (primaryError) throw combineErrors(primaryError, cleanupErrors, `Registry publication or cleanup failed for '${outDir}'.`);
	if (cleanupErrors.length > 0) {
		throw new RegistryPostCommitError(`Registry generation committed at '${outDir}', but post-commit cleanup failed.`, {
			cause: new AggregateError(cleanupErrors, 'Post-commit cleanup errors.'),
		});
	}
}
