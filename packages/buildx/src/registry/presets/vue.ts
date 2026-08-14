import fs from 'node:fs';
import path from 'node:path';

import type { RegistryBuildOptions, VirtualRegistryFile } from '../types';
import { transformVueFile } from '../transforms/vue';

function read(workspaceRoot: string, relativePath: string) {
	return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf-8');
}

/**
 * core 虚拟文件需要包含的组件清单 (类型 + 纯逻辑)
 */
const CORE_COMPONENTS = [
	'button',
	'input',
	'textarea',
	'label',
	'card',
	'badge',
	'skeleton',
	'kbd',
	'separator',
	'table',
	'progress',
	'avatar',
	'switch',
	'checkbox',
	'collapsible',
	'breadcrumb',
	'pagination',
	'alert',
	'aspect-ratio',
	'spinner',
	'empty',
	'marker',
	'item',
	'button-group',
	'input-group',
	'native-select',
	'field',
	'toggle',
	'toggle-group',
	'tabs',
	'accordion',
	'radio-group',
	'slider',
	'scroll-area',
	'tooltip',
	'popover',
	'hover-card',
	'dialog',
	'alert-dialog',
	'sheet',
	'dropdown-menu',
	'context-menu',
	'menubar',
	'navigation-menu',
	'select',
	'combobox',
	'command',
	'chart',
	'calendar',
	'drawer',
	'form',
	'sidebar',
	'carousel',
	'resizable',
	'attachment',
	'bubble',
	'direction',
	'message',
	'message-scroller',
	'sonner',
	'input-otp',
];

/**
 * 拼接 core 虚拟文件内容 (types + logic)
 */
function buildCoreSource(workspaceRoot: string) {
	const parts: string[] = ["import { capitalize, formatBytes, generateId } from './utils';", ''];

	for (const name of CORE_COMPONENTS) {
		const types = read(workspaceRoot, `packages/core/src/components/${name}/${name}.types.ts`);
		const logic = read(workspaceRoot, `packages/core/src/components/${name}/${name}.logic.ts`)
			.split('\n')
			.filter((line) => !line.startsWith('import ') && !line.startsWith('import type '))
			.join('\n')
			.trimEnd();

		parts.push(types, '', logic, '');
	}

	return parts.join('\n');
}

export function createVueRegistryConfig(input: { workspaceRoot: string; outDir: string }): Omit<RegistryBuildOptions, 'manifest'> {
	return {
		framework: 'vue',
		workspaceRoot: input.workspaceRoot,
		outDir: input.outDir,
		transforms: {
			file: transformVueFile,
			buildVirtualFiles: async ({ workspaceRoot }): Promise<VirtualRegistryFile[]> => {
				const helpers = read(workspaceRoot, 'packages/core/src/utils/helpers.ts');
				const cn = read(workspaceRoot, 'packages/core/src/utils/cn.ts');
				const core = buildCoreSource(workspaceRoot);

				return [
					...CORE_COMPONENTS.map((name) => ({
						source: `__virtual__/${name}/core.ts`,
						content: core,
					})),
					{
						source: '__virtual__/shared/utils.ts',
						content: `${cn}\n${helpers}`,
					},
				];
			},
		},
		validate: {
			forbidWorkspaceImports: ['@tile-ui/core', '@tile-ui/styles'],
		},
	};
}
