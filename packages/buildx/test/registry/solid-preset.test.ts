import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { buildSolidUtilsSource } from '../../src/registry/presets/solid';

const workspaceRoot = path.resolve(__dirname, '../../../..');
const requireSolid = createRequire(path.join(workspaceRoot, 'packages/solid/package.json'));

let tempDir = '';

afterEach(async () => {
	if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
	tempDir = '';
});

async function fixture(files: Record<string, string>): Promise<string> {
	tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tile-solid-utils-'));
	await fs.mkdir(path.join(tempDir, 'packages/solid'), { recursive: true });
	await fs.writeFile(path.join(tempDir, 'packages/solid/package.json'), JSON.stringify({ name: '@tile-ui/solid' }));
	await fs.symlink(path.join(workspaceRoot, 'packages/solid/node_modules'), path.join(tempDir, 'packages/solid/node_modules'), 'dir');
	for (const [name, content] of Object.entries(files)) {
		const filePath = path.join(tempDir, name);
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, content);
	}
	return tempDir;
}

async function typeCheck(root: string, output: string) {
	await fs.writeFile(path.join(root, 'output.ts'), output);
	const solidRoot = path.dirname(requireSolid.resolve('solid-js/package.json'));
	await fs.writeFile(
		path.join(root, 'tsconfig.json'),
		JSON.stringify({
			compilerOptions: {
				target: 'ES2017',
				lib: ['DOM', 'DOM.Iterable', 'ESNext'],
				module: 'ESNext',
				moduleResolution: 'Bundler',
				strict: true,
				noEmit: true,
				ignoreDeprecations: '6.0',
				baseUrl: '.',
				paths: { 'solid-js': [solidRoot], 'solid-js/*': [`${solidRoot}/*`] },
			},
			include: ['output.ts'],
		}),
	);
	try {
		execFileSync(process.execPath, [requireSolid.resolve('typescript/lib/tsc.js'), '-p', path.join(root, 'tsconfig.json')], { stdio: 'pipe' });
	} catch (error) {
		const output = error as { stdout?: Buffer; stderr?: Buffer };
		throw new Error([output.stdout?.toString(), output.stderr?.toString()].filter(Boolean).join('\n'));
	}
}

async function compileAndRun(root: string, output: string, assertion?: string) {
	await fs.writeFile(path.join(root, 'runtime.ts'), output);
	await fs.writeFile(
		path.join(root, 'tsconfig.runtime.json'),
		JSON.stringify({
			compilerOptions: { target: 'ES2017', module: 'CommonJS', moduleResolution: 'Node', strict: true, outDir: 'runtime-dist', ignoreDeprecations: '6.0' },
			include: ['runtime.ts'],
		}),
	);
	try {
		execFileSync(process.execPath, [requireSolid.resolve('typescript/lib/tsc.js'), '-p', path.join(root, 'tsconfig.runtime.json')], { stdio: 'pipe' });
	} catch (error) {
		const output = error as { stdout?: Buffer; stderr?: Buffer };
		throw new Error([output.stdout?.toString(), output.stderr?.toString()].filter(Boolean).join('\n'));
	}
	const runtimePath = path.join(root, 'runtime-dist/runtime.js');
	if (assertion) execFileSync(process.execPath, ['-e', `const mod = require(${JSON.stringify(runtimePath)}); ${assertion}`], { stdio: 'pipe' });
	else execFileSync(process.execPath, [runtimePath], { stdio: 'pipe' });
}

describe('Solid virtual utils preset', () => {
	it('includes the real external-store bridge in the AST bundle and type-checks it', async () => {
		const output = buildSolidUtilsSource(workspaceRoot, [path.join(workspaceRoot, 'packages/solid/src/utils/index.ts')]);
		expect(output).toContain('export interface ExternalStore<T>');
		expect(output).toContain('export function createExternalStoreAccessor<T>');
		expect(output).not.toContain("from './form-store'");
		const root = await fixture({});
		await typeCheck(root, output);
	}, 30_000);

	it('emits local dependencies in postorder while preserving nested and sibling side-effect order', async () => {
		const root = await fixture({
			'utils/index.ts':
				"import './first';\nimport './second';\nconst trace = (globalThis as typeof globalThis & { __trace?: string[] }).__trace;\nif (trace?.join(',') !== 'setup,nested,first,second') throw new Error(`Unexpected order: ${trace?.join(',')}`);\nexport const ready = true;\n",
			'utils/first.ts': "import './nested';\n(globalThis as typeof globalThis & { __trace: string[] }).__trace.push('first');\n",
			'utils/second.ts': "(globalThis as typeof globalThis & { __trace: string[] }).__trace.push('second');\n",
			'utils/nested.ts': "import './setup';\n(globalThis as typeof globalThis & { __trace: string[] }).__trace.push('nested');\n",
			'utils/setup.ts': "(globalThis as typeof globalThis & { __trace?: string[] }).__trace = ['setup'];\n",
		});
		const output = buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')]);
		expect(output.indexOf("__trace = ['setup']")).toBeLessThan(output.indexOf("__trace.push('nested')"));
		expect(output.indexOf("__trace.push('nested')")).toBeLessThan(output.indexOf("__trace.push('first')"));
		expect(output.indexOf("__trace.push('first')")).toBeLessThan(output.indexOf("__trace.push('second')"));
		await typeCheck(root, output);
		await compileAndRun(root, output);
	});

	it('rejects local dependency cycles with a deterministic cycle path', async () => {
		const root = await fixture({
			'utils/index.ts': "export * from './a';\n",
			'utils/a.ts': "import './b';\nexport const a = true;\n",
			'utils/b.ts': "import './a';\nexport const b = true;\n",
		});
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow('Solid virtual utils dependency cycle: utils/a.ts -> utils/b.ts -> utils/a.ts');
	});

	it('removes multiline local imports recursively and preserves external aliases and type imports', async () => {
		const root = await fixture({
			'utils/index.ts': "export * from './feature';\n",
			'utils/feature.ts':
				"import {\n\thelper,\n\ttype HelperOptions,\n} from './helper';\nimport { createSignal as signal,\n\ttype Accessor\n} from 'solid-js';\nexport function feature(options: HelperOptions): Accessor<number> { return signal(helper(options))[0]; }\n",
			'utils/helper.ts': 'export interface HelperOptions { value: number; }\nexport const helper = (options: HelperOptions) => options.value;\n',
		});
		const output = buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')]);
		expect(output).toContain("import { type Accessor, createSignal as signal } from 'solid-js';");
		expect(output).toContain('export interface HelperOptions');
		expect(output).toContain('export const helper');
		expect(output).toContain('export function feature');
		expect(output).not.toContain("from './helper'");
		expect(output).not.toContain("export * from './feature'");
		await typeCheck(root, output);
	});

	it('rewrites local named aliases and preserves local named re-export aliases', async () => {
		const root = await fixture({
			'utils/index.ts': "export { feature as execute } from './feature';\n",
			'utils/feature.ts': "import { helper as run, type HelperOptions as Options } from './helper';\nexport function feature(options: Options) { return run(options); }\n",
			'utils/helper.ts': 'export interface HelperOptions { value: number; }\nexport function helper(options: HelperOptions) { return options.value; }\n',
		});
		const output = buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')]);
		expect(output).toContain('export function feature(options: HelperOptions)');
		expect(output).toContain('return helper(options)');
		expect(output).toContain('export { feature as execute };');
		expect(output).not.toMatch(/\brun\b|\bOptions\b/);
		await typeCheck(root, output);
	});

	it('rewrites alias references in local exports without a module specifier', async () => {
		const root = await fixture({
			'utils/index.ts': "export * from './feature';\n",
			'utils/feature.ts': "import { helper as run } from './helper';\nexport { run };\n",
			'utils/helper.ts': 'export function helper() { return 7; }\n',
		});
		const output = buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')]);
		expect(output).toContain('export { helper as run };');
		expect(output).not.toContain('export { run };');
		await typeCheck(root, output);
		await compileAndRun(root, output, "if (mod.run() !== 7) throw new Error('alias export failed')");
	});

	it('rewrites shorthand alias properties without changing the public property key', async () => {
		const root = await fixture({
			'utils/index.ts': "export * from './feature';\n",
			'utils/feature.ts': "import { helper as run } from './helper';\nexport const value = { run };\n",
			'utils/helper.ts': 'export function helper() { return 9; }\n',
		});
		const output = buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')]);
		expect(output).toContain('{ run: helper }');
		await typeCheck(root, output);
		await compileAndRun(root, `${output}\nif (value.run() !== 9) throw new Error('shorthand failed');\n`);
	});

	it('rejects local default and namespace imports with deterministic errors', async () => {
		let root = await fixture({
			'utils/index.ts': "export * from './feature';\n",
			'utils/feature.ts': "import helper from './helper';\nexport const feature = helper;\n",
			'utils/helper.ts': 'export default 1;\n',
		});
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow("Unsupported local default import 'helper' from './helper' in utils/feature.ts");
		await fs.rm(root, { recursive: true, force: true });
		tempDir = '';
		root = await fixture({
			'utils/index.ts': "export * from './feature';\n",
			'utils/feature.ts': "import * as helpers from './helper';\nexport const feature = helpers.value;\n",
			'utils/helper.ts': 'export const value = 1;\n',
		});
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow("Unsupported local namespace import 'helpers' from './helper' in utils/feature.ts");
	});

	it('rejects every local default-export form before generation', async () => {
		let root = await fixture({ 'utils/index.ts': "export * from './feature';\n", 'utils/feature.ts': 'export default function feature() {}\n' });
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow('Unsupported local default export in utils/feature.ts');
		await fs.rm(root, { recursive: true, force: true });
		tempDir = '';
		root = await fixture({ 'utils/index.ts': "export { default as feature } from './feature';\n", 'utils/feature.ts': 'const feature = 1; export default feature;\n' });
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow("Unsupported local default re-export from './feature' in utils/index.ts");
		await fs.rm(root, { recursive: true, force: true });
		tempDir = '';
		root = await fixture({ 'utils/index.ts': 'const feature = 1; export { feature as default };\n' });
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow('Unsupported local default export in utils/index.ts');
	});

	it('rejects public export alias collisions and declaration/export conflicts', async () => {
		let root = await fixture({
			'utils/index.ts': "export { first as shared } from './first';\nexport { second as shared } from './second';\n",
			'utils/first.ts': 'export const first = 1;\n',
			'utils/second.ts': 'export const second = 2;\n',
		});
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow("Solid virtual utils export 'shared' collides");
		await fs.rm(root, { recursive: true, force: true });
		tempDir = '';
		root = await fixture({
			'utils/index.ts': "export const shared = 1;\nexport { other as shared } from './other';\n",
			'utils/other.ts': 'export const other = 2;\n',
		});
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow("Solid virtual utils export 'shared' collides");
	});

	it('emits valid separate namespace and named external imports', async () => {
		const root = await fixture({
			'utils/index.ts': "export * from './first';\nexport * from './second';\n",
			'utils/first.ts': "import * as Solid from 'solid-js';\nexport const first = Solid.createSignal(1);\n",
			'utils/second.ts': "import { createMemo } from 'solid-js';\nexport const second = createMemo(() => 2);\n",
		});
		const output = buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')]);
		expect(output).toContain("import { createMemo } from 'solid-js';");
		expect(output).toContain("import * as Solid from 'solid-js';");
		expect(output).not.toContain('import * as Solid,');
		await typeCheck(root, output);
	});

	it.each([
		['type-first', "export * from './types';\nexport * from './value';\n"],
		['value-first', "export * from './value';\nexport * from './types';\n"],
	])('preserves value imports when merging type/value occurrences in %s order', async (_name, indexSource) => {
		const root = await fixture({
			'utils/index.ts': indexSource,
			'utils/types.ts': "import { type createSignal as signal } from 'solid-js';\nexport type SignalFactory = typeof signal;\n",
			'utils/value.ts': "import { createSignal as signal } from 'solid-js';\nexport const value = signal(3)[0];\n",
		});
		const output = buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')]);
		expect(output).toContain("import { createSignal as signal } from 'solid-js';");
		expect(output).not.toContain('type createSignal as signal');
		await typeCheck(root, output);
	});

	it('detects external import binding collisions and import-vs-declaration collisions', async () => {
		let root = await fixture({
			'utils/index.ts': "export * from './first';\nexport * from './second';\n",
			'utils/first.ts': "import { createSignal as shared } from 'solid-js';\nexport const first = shared;\n",
			'utils/second.ts': "import { createMemo as shared } from 'solid-js';\nexport const second = shared;\n",
		});
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow("Solid virtual utils import binding 'shared' collides");
		await fs.rm(root, { recursive: true, force: true });
		tempDir = '';
		root = await fixture({
			'utils/index.ts': "export * from './first';\nexport * from './second';\n",
			'utils/first.ts': "import { createSignal as shared } from 'solid-js';\nexport const first = shared;\n",
			'utils/second.ts': 'export function shared() {}\n',
		});
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow(
			"Solid virtual utils binding 'shared' collides between declaration utils/second.ts and 'solid-js' import 'createSignal' in utils/first.ts",
		);
	});

	it('fails deterministically for missing local dependencies', async () => {
		const root = await fixture({ 'utils/index.ts': "export * from './missing';\n" });
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow("Unable to resolve Solid virtual utils dependency './missing' from utils/index.ts");
	});

	it('fails deterministically for duplicate top-level declarations', async () => {
		const root = await fixture({
			'utils/index.ts': "export * from './first';\nexport * from './second';\n",
			'utils/first.ts': 'export const duplicate = 1;\n',
			'utils/second.ts': 'export function duplicate() {}\n',
		});
		expect(() => buildSolidUtilsSource(root, [path.join(root, 'utils/index.ts')])).toThrow(
			"Duplicate Solid virtual utils declaration 'duplicate' in utils/first.ts and utils/second.ts",
		);
	});
});
