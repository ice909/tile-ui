import fs from 'node:fs/promises';
import path from 'node:path';

import { buildItemJson, buildRegistryIndex } from './pipeline/build-item-json';
import { cleanupOutput } from './pipeline/cleanup-output';
import { beginRegistryPublication, createRegistryTransactionPaths, publishRegistryOutput, RegistryPostCommitError, RegistryRollbackError } from './pipeline/publish-output';
import { resolveItemFiles } from './pipeline/resolve-item-files';
import { validateManifest } from './pipeline/validate-manifest';
import { validateSassDependencies } from './pipeline/validate-sass-dependencies';
import { writeJsonFile } from './pipeline/write-output';
import type { BuiltRegistryFile } from './pipeline/build-item-json';
import type { RegistryBuildOptions } from './types';

function throwIfAborted(signal?: AbortSignal) {
	if (signal?.aborted) {
		throw signal.reason ?? new DOMException('Registry build aborted.', 'AbortError');
	}
}

export async function buildRegistry(options: RegistryBuildOptions) {
	throwIfAborted(options.signal);
	validateManifest(options.manifest);

	const publicationLock = await beginRegistryPublication(options.outDir, { signal: options.signal });
	const { stagingDir, backupDir } = createRegistryTransactionPaths(options.outDir);
	const cleanupErrors: unknown[] = [];
	let primaryError: unknown;

	try {
		const virtualFiles =
			(await options.transforms.buildVirtualFiles?.({
				workspaceRoot: options.workspaceRoot,
				manifest: options.manifest,
			})) ?? [];
		const expectedFileNames = ['registry.json'];
		const builtItems = new Map<string, BuiltRegistryFile[]>();

		for (const item of options.manifest.items) {
			throwIfAborted(options.signal);
			const resolvedFiles = await resolveItemFiles(options.workspaceRoot, item, virtualFiles);
			const files: BuiltRegistryFile[] = [];

			for (const resolved of resolvedFiles) {
				throwIfAborted(options.signal);
				const transformed = await options.transforms.file({
					framework: options.framework,
					item,
					file: resolved.file,
					content: resolved.content,
					workspaceRoot: options.workspaceRoot,
				});

				for (const forbiddenImport of options.validate?.forbidWorkspaceImports ?? []) {
					if (transformed.content.includes(forbiddenImport)) {
						throw new Error(`Transformed file for '${item.name}' still contains forbidden import '${forbiddenImport}'.`);
					}
				}

				files.push({
					path: resolved.file.source,
					type: resolved.file.type,
					target: transformed.target,
					content: transformed.content,
				});
			}

			builtItems.set(item.name, files);
		}

		validateSassDependencies(options.manifest, builtItems);

		for (const item of options.manifest.items) {
			throwIfAborted(options.signal);
			const itemJson = buildItemJson(options.manifest, item, builtItems.get(item.name) ?? []);
			const itemFileName = `${item.name}.json`;
			expectedFileNames.push(itemFileName);
			await writeJsonFile(path.join(stagingDir, itemFileName), itemJson, options.signal);
			await options.hooks?.onStagedFile?.(path.join(stagingDir, itemFileName));
		}

		throwIfAborted(options.signal);
		await writeJsonFile(path.join(stagingDir, 'registry.json'), buildRegistryIndex(options), options.signal);
		await options.hooks?.onStagedFile?.(path.join(stagingDir, 'registry.json'));
		throwIfAborted(options.signal);
		await cleanupOutput(stagingDir, expectedFileNames);
		await publishRegistryOutput(options.outDir, stagingDir, backupDir, { signal: options.signal, lockHandle: publicationLock });
	} catch (error) {
		primaryError = error;
		const cleanupPaths = error instanceof RegistryPostCommitError || error instanceof RegistryRollbackError ? [stagingDir] : [stagingDir, backupDir];
		for (const targetPath of cleanupPaths) {
			try {
				await fs.rm(targetPath, { recursive: true, force: true });
			} catch (cleanupError) {
				cleanupErrors.push(cleanupError);
			}
		}
	} finally {
		try {
			await publicationLock.release();
		} catch (error) {
			cleanupErrors.push(error);
		}
	}

	if (primaryError && cleanupErrors.length > 0) {
		throw new AggregateError([primaryError, ...cleanupErrors], `Registry build failed and transaction cleanup was incomplete for '${options.outDir}'.`);
	}
	if (primaryError) throw primaryError;
	if (cleanupErrors.length > 0) {
		throw new RegistryPostCommitError(`Registry generation committed at '${options.outDir}', but lock cleanup failed.`, { cause: new AggregateError(cleanupErrors) });
	}
}
