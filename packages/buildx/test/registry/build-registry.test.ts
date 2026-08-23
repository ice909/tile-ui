import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { beforeEach, afterEach, expect } from 'vitest';

import { buildRegistry } from '../../src/registry/build-registry';
import { createReactRegistryConfig } from '../../src/registry/presets/react';
import { createVueRegistryConfig } from '../../src/registry/presets/vue';
import { reactRegistryManifest } from '../../../react/src/registry/manifest';
import { vueRegistryManifest } from '../../../vue/src/registry/manifest';

function expectRegistrySafeCssVars(item: { cssVars?: { light?: Record<string, string>; dark?: Record<string, string>; theme?: Record<string, string> } }) {
	const names = Object.values(item.cssVars ?? {}).flatMap((variables) => Object.keys(variables ?? {}));
	expect(names.length).toBeGreaterThan(0);
	expect(names.every((name) => name.startsWith('tile-'))).toBe(true);
}

function expectScopedDerivedTokens(styles: string, defaultTheme: { cssVars: { light: Record<string, string> } }) {
	const stylesItem = JSON.parse(styles) as { cssVars: { light: Record<string, string> }; files: Array<{ target: string; content: string }> };
	const aliases = stylesItem.files.find((file) => file.target === 'styles/variables/_colors.scss')?.content;

	expect(stylesItem.cssVars.light).not.toHaveProperty('tile-primary-hover');
	expect(defaultTheme.cssVars.light).not.toHaveProperty('tile-primary-hover');
	expect(aliases).toContain('var(--tile-primary-hover, color-mix(in srgb, var(--primary) 90%, var(--background)))');
	expect(aliases).toContain('var(--tile-radius-sm, max(0px, calc(var(--radius) - 0.25rem)))');
}

let tempDir = '';

beforeEach(async () => {
	tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tile-ui-buildx-'));
});

afterEach(async () => {
	if (tempDir) {
		await fs.rm(tempDir, { recursive: true, force: true });
	}
});

describe('buildRegistry', () => {
	it('builds react button registry output', async () => {
		const outDir = path.join(tempDir, 'react');
		await buildRegistry({
			manifest: reactRegistryManifest,
			...createReactRegistryConfig({
				workspaceRoot: path.resolve(__dirname, '../../../..'),
				outDir,
			}),
		});

		const content = await fs.readFile(path.join(outDir, 'button.json'), 'utf-8');
		const button = JSON.parse(content) as { files: Array<{ content: string }> };
		const core = await fs.readFile(path.join(outDir, 'core.json'), 'utf-8');
		const styles = await fs.readFile(path.join(outDir, 'styles.json'), 'utf-8');
		expect(content).toContain('"name": "button"');
		expect(button.files.every((file) => !file.content.includes('@tile-ui/styles'))).toBe(true);
		expect(button.files.every((file) => !file.content.includes('@tile-ui/core'))).toBe(true);
		expect(content).toContain('"registryDependencies": [');
		expect(content).toContain('"@tile-ui/core"');
		expect(content).toContain('"@tile-ui/utils"');
		expect(content).toContain('"@tile-ui/styles"');
		expect(content).toContain("@use '../../../styles/variables/colors' as *;");
		expect(core).toContain("import { capitalize, formatBytes, generateId } from './utils';");
		expect(styles).toContain('"type": "registry:style"');
		expect(styles).toContain('"cssVars"');
		const stylesItem = JSON.parse(styles) as { cssVars?: { light?: Record<string, string>; dark?: Record<string, string>; theme?: Record<string, string> } };
		expectRegistrySafeCssVars(stylesItem);
		expect(styles).toContain('"target": "styles/tokens.scss"');
		expect(styles).toContain('"target": "styles/theme.scss"');
		expect(styles).toContain('"target": "styles/reset.scss"');
		const defaultTheme = JSON.parse(await fs.readFile(path.join(outDir, 'theme-default.json'), 'utf-8')) as { cssVars: { light: Record<string, string> } };
		expect(defaultTheme.cssVars.light.background).toBe('#ffffff');
		expectScopedDerivedTokens(styles, defaultTheme);
	});

	it('builds expanded react registry items', async () => {
		const outDir = path.join(tempDir, 'react-expanded');
		await buildRegistry({
			manifest: reactRegistryManifest,
			...createReactRegistryConfig({
				workspaceRoot: path.resolve(__dirname, '../../../..'),
				outDir,
			}),
		});

		const registry = await fs.readFile(path.join(outDir, 'registry.json'), 'utf-8');
		expect(registry).toContain('"name": "input"');
		expect(registry).toContain('"name": "textarea"');
		expect(registry).toContain('"name": "label"');
		expect(registry).toContain('"name": "card"');
		expect(registry).toContain('"name": "core"');
		expect(registry).toContain('"name": "styles"');
		expect(registry).toContain('"type": "registry:style"');
		expect(registry).toContain('"cssVars"');
		expect(registry).toContain('"name": "use-copy-to-clipboard"');
		expect(registry).toContain('"name": "use-media-query"');
		expect(registry).toContain('"name": "use-local-storage"');
		const portal = JSON.parse(await fs.readFile(path.join(outDir, 'portal.json'), 'utf-8')) as { files: Array<{ target: string; content: string }> };
		const dialog = JSON.parse(await fs.readFile(path.join(outDir, 'dialog.json'), 'utf-8')) as { registryDependencies: string[]; files: Array<{ content: string }> };
		expect(portal.files.map((file) => file.target)).toEqual(['components/ui/portal/index.ts', 'components/ui/portal/portal.tsx']);
		expect(portal.files[0]?.content).toContain("from './portal'");
		expect(dialog.registryDependencies).toContain('@tile-ui/portal');
		expect(dialog.registryDependencies).not.toContain('portal');
		expect(dialog.files.some((file) => file.content.includes("from '../portal'"))).toBe(true);
	});

	it('builds vue button registry output', async () => {
		const outDir = path.join(tempDir, 'vue');
		await buildRegistry({
			manifest: vueRegistryManifest,
			...createVueRegistryConfig({
				workspaceRoot: path.resolve(__dirname, '../../../..'),
				outDir,
			}),
		});

		const content = await fs.readFile(path.join(outDir, 'button.json'), 'utf-8');
		const button = JSON.parse(content) as { files: Array<{ content: string }> };
		const core = await fs.readFile(path.join(outDir, 'core.json'), 'utf-8');
		const styles = await fs.readFile(path.join(outDir, 'styles.json'), 'utf-8');
		expect(content).toContain('"name": "button"');
		expect(button.files.every((file) => !file.content.includes('@tile-ui/styles'))).toBe(true);
		expect(button.files.every((file) => !file.content.includes('@tile-ui/core'))).toBe(true);
		expect(content).toContain('"registryDependencies": [');
		expect(content).toContain('"@tile-ui/core"');
		expect(content).toContain('"@tile-ui/utils"');
		expect(content).toContain('"@tile-ui/styles"');
		expect(content).toContain("@use '../../../styles/variables/colors' as *;");
		expect(core).toContain("import { capitalize, formatBytes, generateId } from './utils';");
		expect(styles).toContain('"type": "registry:style"');
		expect(styles).toContain('"cssVars"');
		expectRegistrySafeCssVars(JSON.parse(styles));
		const defaultTheme = JSON.parse(await fs.readFile(path.join(outDir, 'theme-default.json'), 'utf-8')) as { cssVars: { light: Record<string, string> } };
		expect(defaultTheme.cssVars.light.background).toBe('#ffffff');
		expectScopedDerivedTokens(styles, defaultTheme);
	});

	it('builds expanded vue registry items', async () => {
		const outDir = path.join(tempDir, 'vue-expanded');
		await buildRegistry({
			manifest: vueRegistryManifest,
			...createVueRegistryConfig({
				workspaceRoot: path.resolve(__dirname, '../../../..'),
				outDir,
			}),
		});

		const registry = await fs.readFile(path.join(outDir, 'registry.json'), 'utf-8');
		expect(registry).toContain('"name": "input"');
		expect(registry).toContain('"name": "textarea"');
		expect(registry).toContain('"name": "label"');
		expect(registry).toContain('"name": "card"');
		expect(registry).toContain('"name": "core"');
		expect(registry).toContain('"name": "styles"');
		expect(registry).toContain('"type": "registry:style"');
		expect(registry).toContain('"cssVars"');
		expect(registry).toContain('"name": "use-copy-to-clipboard"');
		expect(registry).toContain('"name": "use-media-query"');
		expect(registry).toContain('"name": "use-local-storage"');
		const portal = JSON.parse(await fs.readFile(path.join(outDir, 'portal.json'), 'utf-8')) as { files: Array<{ target: string; content: string }> };
		const dialog = JSON.parse(await fs.readFile(path.join(outDir, 'dialog.json'), 'utf-8')) as { registryDependencies: string[]; files: Array<{ content: string }> };
		expect(portal.files.map((file) => file.target)).toEqual(['components/ui/portal/index.ts', 'components/ui/portal/portal.tsx']);
		expect(portal.files[0]?.content).toContain("from './portal'");
		expect(dialog.registryDependencies).toContain('@tile-ui/portal');
		expect(dialog.registryDependencies).not.toContain('portal');
		expect(dialog.files.some((file) => file.content.includes("from '../portal'"))).toBe(true);
	});
});
