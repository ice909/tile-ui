import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { reactRegistryManifest } from '../../../react/src/registry/manifest';
import { vueRegistryManifest } from '../../../vue/src/registry/manifest';

const workspaceRoot = path.resolve(__dirname, '../../../..');

const EXPECTED_UI_COMPONENTS = [
	'accordion',
	'alert',
	'alert-dialog',
	'aspect-ratio',
	'attachment',
	'avatar',
	'badge',
	'breadcrumb',
	'bubble',
	'button',
	'button-group',
	'calendar',
	'card',
	'carousel',
	'chart',
	'checkbox',
	'collapsible',
	'combobox',
	'command',
	'context-menu',
	'dialog',
	'direction',
	'drawer',
	'dropdown-menu',
	'empty',
	'field',
	'form',
	'hover-card',
	'input',
	'input-group',
	'input-otp',
	'item',
	'kbd',
	'label',
	'marker',
	'menubar',
	'message',
	'message-scroller',
	'native-select',
	'navigation-menu',
	'pagination',
	'popover',
	'progress',
	'radio-group',
	'resizable',
	'scroll-area',
	'select',
	'separator',
	'sheet',
	'sidebar',
	'skeleton',
	'slider',
	'sonner',
	'spinner',
	'switch',
	'table',
	'tabs',
	'textarea',
	'toggle',
	'toggle-group',
	'tooltip',
];

describe.each([
	['react', reactRegistryManifest],
	['vue', vueRegistryManifest],
])('%s manifest 完整性', (_framework, manifest) => {
	it('覆盖全部 61 个 UI 组件且无重复', () => {
		const uiNames = manifest.items.filter((item) => item.type === 'registry:ui').map((item) => item.name);
		expect(new Set(uiNames).size).toBe(uiNames.length);
		expect([...uiNames].sort()).toEqual([...EXPECTED_UI_COMPONENTS].sort());
	});

	it('每个 item 至少包含一个 file', () => {
		for (const item of manifest.items) {
			expect(item.files.length, `${item.name} 缺少 file`).toBeGreaterThan(0);
		}
	});

	it('每个 UI item 的源码文件真实存在', () => {
		for (const item of manifest.items.filter((i) => i.type === 'registry:ui')) {
			for (const file of item.files) {
				expect(fs.existsSync(path.join(workspaceRoot, file.source)), `${file.source} 不存在`).toBe(true);
			}
		}
	});

	it('registryDependencies 引用的 item 均存在', () => {
		const names = new Set(manifest.items.map((item) => item.name));
		for (const item of manifest.items) {
			for (const dep of item.registryDependencies ?? []) {
				if (dep.startsWith('@tile-ui/')) {
					const local = dep.slice('@tile-ui/'.length);
					expect(names.has(local), `${item.name} 引用未知依赖 ${dep}`).toBe(true);
				}
			}
		}
	});
});

describe('核心库导出与 UI 组件一致性', () => {
	it('@tile-ui/core 导出全部 61 个组件的样式键', () => {
		const coreIndex = fs.readFileSync(path.join(workspaceRoot, 'packages/core/src/components/index.ts'), 'utf-8');
		for (const name of EXPECTED_UI_COMPONENTS) {
			expect(coreIndex, `core 缺少 ${name}`).toContain(`'./${name}'`);
		}
	});

	it('两个框架的 UI 组件集合保持一致', () => {
		const reactNames = reactRegistryManifest.items
			.filter((i) => i.type === 'registry:ui')
			.map((i) => i.name)
			.sort();
		const vueNames = vueRegistryManifest.items
			.filter((i) => i.type === 'registry:ui')
			.map((i) => i.name)
			.sort();
		expect(reactNames).toEqual(vueNames);
	});
});
