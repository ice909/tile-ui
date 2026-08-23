import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { colors, createThemeVariables, radii, runtimeTokenMetadata, runtimeTokenRefs, shadows, tileDerivedTokenFallbacks, tileExtensionCssVars } from '../src/tokens';

const workspaceRoot = path.resolve(__dirname, '../../..');

describe('设计令牌兼容性', () => {
	it('保留旧版 JS 导出的具体值', () => {
		expect(colors.primary).toBe('#18181b');
		expect(shadows.default).toBe('0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)');
		expect(radii).toEqual({ sm: '0.25rem', default: '0.5rem', md: '0.75rem', lg: '1rem', full: '9999px' });
	});

	it('通过独立导出提供运行时 CSS 变量引用', () => {
		expect(runtimeTokenRefs.primary).toBe('var(--primary)');
		expect(runtimeTokenRefs['tile-shadow']).toBe('var(--tile-shadow, 0 1px 3px 0 rgb(var(--tile-shadow-color) / 0.1), 0 1px 2px -1px rgb(var(--tile-shadow-color) / 0.1))');
		expect(runtimeTokenRefs.radius).toBe('var(--radius)');
	});

	it('SCSS 扩展令牌与核心元数据保持完全同步', () => {
		const tokenSource = fs.readFileSync(path.join(workspaceRoot, 'packages/styles/scss/tokens.scss'), 'utf-8');
		const aliasSource = fs.readFileSync(path.join(workspaceRoot, 'packages/styles/scss/variables/_colors.scss'), 'utf-8');
		const scssTokens = Object.fromEntries([...tokenSource.matchAll(/--(tile-[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
		const scssDerivedFallbacks = Object.fromEntries([...aliasSource.matchAll(/\$[\w-]+:\s*var\(--(tile-[\w-]+),\s*(.+)\);/g)].map((match) => [match[1], match[2].trim()]));

		expect(scssTokens).toEqual(tileExtensionCssVars);
		expect(scssDerivedFallbacks).toEqual(tileDerivedTokenFallbacks);
		expect(
			Object.keys(runtimeTokenMetadata)
				.filter((name) => name.startsWith('tile-'))
				.sort(),
		).toEqual([...Object.keys(tileExtensionCssVars), ...Object.keys(tileDerivedTokenFallbacks)].sort());
		expect(
			Object.keys(runtimeTokenRefs)
				.filter((name) => name.startsWith('tile-'))
				.sort(),
		).toEqual([...Object.keys(tileExtensionCssVars), ...Object.keys(tileDerivedTokenFallbacks)].sort());
	});

	it('派生令牌作为消费位置的回退表达式而不是根变量默认值', () => {
		expect(tileExtensionCssVars).not.toHaveProperty('tile-primary-hover');
		expect(tileExtensionCssVars).not.toHaveProperty('tile-field-subtle');
		expect(tileExtensionCssVars).not.toHaveProperty('tile-radius-sm');
		expect(runtimeTokenRefs['tile-primary-hover']).toBe('var(--tile-primary-hover, color-mix(in srgb, var(--primary) 90%, var(--background)))');
		expect(runtimeTokenRefs['tile-radius-sm']).toBe('var(--tile-radius-sm, max(0px, calc(var(--radius) - 0.25rem)))');
		expect(runtimeTokenMetadata['tile-field-subtle']).toEqual({
			variable: '--tile-field-subtle',
			category: 'color',
			fallback: 'color-mix(in srgb, var(--input) 50%, var(--background))',
		});
		expect(createThemeVariables('light')).not.toHaveProperty('--tile-primary-hover');
		expect(createThemeVariables('light', { 'tile-primary-hover': 'hotpink' })).toHaveProperty('--tile-primary-hover', 'hotpink');
	});
});
