import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect } from 'vitest';

import { buildRegistry } from '../../src/registry/build-registry';
import { beginRegistryPublication, reconcileRegistryTransactions } from '../../src/registry/pipeline/publish-output';

let tempDir = '';

async function createOwnedBackup(outDir: string, input: { id: string; createdAt: number; content: string; validRecord?: boolean; validGeneration?: boolean }) {
	const parent = path.dirname(outDir);
	const backupName = `.${path.basename(outDir)}.backup-${input.id}`;
	const backupDir = path.join(parent, backupName);
	const recordPath = path.join(parent, `.${path.basename(outDir)}.transaction-${input.id}.json`);
	await fs.mkdir(backupDir);
	await fs.writeFile(path.join(backupDir, 'registry.json'), input.validGeneration === false ? 'not-json\n' : `${JSON.stringify({ generation: input.content })}\n`);
	await fs.writeFile(
		recordPath,
		input.validRecord === false
			? '{ malformed'
			: `${JSON.stringify({ schema: 1, id: input.id, outDir: path.resolve(outDir), backupName, createdAt: input.createdAt }, null, 2)}\n`,
	);
	return { backupDir, recordPath };
}

beforeEach(async () => {
	tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tile-ui-recovery-'));
});

afterEach(async () => {
	await fs.rm(tempDir, { recursive: true, force: true });
});

describe('registry transaction recovery', () => {
	it('restores a valid owned backup when output is missing', async () => {
		const outDir = path.join(tempDir, 'registry');
		const transaction = await createOwnedBackup(outDir, { id: '100-1-old', createdAt: 100, content: 'old' });
		const lock = await beginRegistryPublication(outDir);
		await lock.release();

		expect(JSON.parse(await fs.readFile(path.join(outDir, 'registry.json'), 'utf-8'))).toEqual({ generation: 'old' });
		await expect(fs.access(transaction.backupDir)).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(fs.access(transaction.recordPath)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('keeps the restored generation when the next build fails during staging', async () => {
		const outDir = path.join(tempDir, 'registry');
		const sourcePath = path.join(tempDir, 'source.ts');
		await createOwnedBackup(outDir, { id: '100-1-old', createdAt: 100, content: 'old' });
		await fs.writeFile(sourcePath, 'export const value = true;\n');

		await expect(
			buildRegistry({
				framework: 'solid',
				workspaceRoot: tempDir,
				outDir,
				manifest: {
					name: 'test',
					homepage: 'https://example.com',
					items: [
						{ name: 'source', type: 'registry:lib', title: 'Source', description: 'Source', files: [{ source: 'source.ts', type: 'registry:lib', transform: 'copy' }] },
					],
				},
				transforms: { file: async ({ content }) => ({ content, target: 'source.ts' }) },
				hooks: { onStagedFile: () => Promise.reject(new Error('staging failed')) },
			}),
		).rejects.toThrow('staging failed');

		expect(JSON.parse(await fs.readFile(path.join(outDir, 'registry.json'), 'utf-8'))).toEqual({ generation: 'old' });
	});

	it('selects the newest valid owned backup deterministically', async () => {
		const outDir = path.join(tempDir, 'registry');
		await createOwnedBackup(outDir, { id: '100-1-old', createdAt: 100, content: 'old' });
		await createOwnedBackup(outDir, { id: '200-1-new', createdAt: 200, content: 'new' });
		await reconcileRegistryTransactions(outDir);

		expect(JSON.parse(await fs.readFile(path.join(outDir, 'registry.json'), 'utf-8'))).toEqual({ generation: 'new' });
		expect((await fs.readdir(tempDir)).filter((entry) => entry.includes('.registry.backup-') || entry.includes('.registry.transaction-'))).toEqual([]);
	});

	it('ignores unrelated backup-like directories', async () => {
		const outDir = path.join(tempDir, 'registry');
		const unrelated = path.join(tempDir, '.registry.backup-unrelated');
		await fs.mkdir(unrelated);
		await fs.writeFile(path.join(unrelated, 'registry.json'), '{}\n');
		await reconcileRegistryTransactions(outDir);

		await expect(fs.access(outDir)).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(fs.access(unrelated)).resolves.toBeUndefined();
	});

	it('preserves and reports malformed transaction metadata safely', async () => {
		const outDir = path.join(tempDir, 'registry');
		const malformed = await createOwnedBackup(outDir, { id: '100-1-bad', createdAt: 100, content: 'old', validRecord: false });
		const artifacts: string[] = [];
		await reconcileRegistryTransactions(outDir, {
			onRecoveryArtifact: (artifactPath) => {
				artifacts.push(artifactPath);
			},
		});

		expect(artifacts).toEqual([malformed.recordPath]);
		await expect(fs.access(malformed.backupDir)).resolves.toBeUndefined();
		await expect(fs.access(malformed.recordPath)).resolves.toBeUndefined();
		await expect(fs.access(outDir)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('leaves no owned transaction metadata after a successful build', async () => {
		const outDir = path.join(tempDir, 'registry');
		const sourcePath = path.join(tempDir, 'source.ts');
		await createOwnedBackup(outDir, { id: '100-1-old', createdAt: 100, content: 'old' });
		await fs.writeFile(sourcePath, 'export const value = true;\n');
		await buildRegistry({
			framework: 'solid',
			workspaceRoot: tempDir,
			outDir,
			manifest: {
				name: 'test',
				homepage: 'https://example.com',
				items: [
					{ name: 'source', type: 'registry:lib', title: 'Source', description: 'Source', files: [{ source: 'source.ts', type: 'registry:lib', transform: 'copy' }] },
				],
			},
			transforms: { file: async ({ content }) => ({ content, target: 'source.ts' }) },
		});

		expect((await fs.readdir(tempDir)).filter((entry) => entry.includes('.registry.backup-') || entry.includes('.registry.transaction-'))).toEqual([]);
	});
});
