import path from 'node:path';

import { transformSolidFile } from '../../../src/registry/transforms/solid';

const workspaceRoot = path.resolve(__dirname, '../../../../..');

describe('transformSolidFile', () => {
	it('requires an explicit Solid primitive target', async () => {
		await expect(
			transformSolidFile({
				framework: 'solid',
				workspaceRoot: '/workspace',
				item: { name: 'create-example', type: 'registry:hook', title: 'createExample', description: 'Example', files: [] },
				file: { source: 'example.ts', type: 'registry:hook', transform: 'solid-primitive' },
				content: 'export const createExample = () => true;\n',
			}),
		).rejects.toThrow("Solid primitive 'create-example' requires an explicit target.");
	});

	it('passes through a targeted Solid primitive without an export selection', async () => {
		const content = "import { createSignal } from 'solid-js';\nexport const createExample = () => createSignal(true);\n";
		const output = await transformSolidFile({
			framework: 'solid',
			workspaceRoot,
			item: { name: 'create-example', type: 'registry:hook', title: 'createExample', description: 'Example', files: [] },
			file: { source: 'example.ts', type: 'registry:hook', transform: 'solid-primitive', target: 'primitives/create-example.ts' },
			content,
		});

		expect(output).toEqual({ content, target: 'primitives/create-example.ts' });
	});

	it('selects a Solid primitive export and its local helper closure', async () => {
		const output = await transformSolidFile({
			framework: 'solid',
			workspaceRoot,
			item: { name: 'create-copy', type: 'registry:hook', title: 'createCopy', description: 'Copy', files: [] },
			file: {
				source: 'events.ts',
				type: 'registry:hook',
				transform: 'solid-primitive',
				target: 'primitives/create-copy.ts',
				exports: ['CopyResult', 'createCopy'],
			},
			content:
				"import { createEffect, createSignal, type Accessor } from 'solid-js';\nexport interface CopyResult { copied: Accessor<boolean>; }\nfunction normalize() { return false; }\nexport function createCopy(): CopyResult { const [copied] = createSignal(normalize()); return { copied }; }\nexport function createOther() { createEffect(() => undefined); }\n",
		});

		expect(output.target).toBe('primitives/create-copy.ts');
		expect(output.content).toContain('export interface CopyResult');
		expect(output.content).toContain('function normalize()');
		expect(output.content).toContain('export function createCopy()');
		expect(output.content).toContain("import { createSignal, type Accessor } from 'solid-js';");
		expect(output.content).not.toContain('createEffect');
		expect(output.content).not.toContain('createOther');
	});

	it('rewrites core and style imports for button', async () => {
		const output = await transformSolidFile({
			framework: 'solid',
			workspaceRoot: '/workspace',
			item: {
				name: 'button',
				type: 'registry:ui',
				title: 'Button',
				description: 'Button',
				files: [],
			},
			file: {
				source: 'button.tsx',
				type: 'registry:ui',
				transform: 'solid-component',
			},
			content:
				"import { getButtonStyleKeys, isButtonDisabled } from '@tile-ui/core';\nimport type { ButtonBaseProps } from '@tile-ui/core';\nimport styles from '@tile-ui/styles/scss/components/button.module.scss';\n",
		});

		expect(output.content).toContain("from '../lib/core'");
		expect(output.content).toContain("from './button.module.scss'");
		expect(output.content).not.toContain('@tile-ui/core');
	});

	it('rewrites shared Solid utility imports', async () => {
		const output = await transformSolidFile({
			framework: 'solid',
			workspaceRoot: '/workspace',
			item: {
				name: 'toggle',
				type: 'registry:ui',
				title: 'Toggle',
				description: 'Toggle',
				files: [],
			},
			file: {
				source: 'toggle.tsx',
				type: 'registry:ui',
				transform: 'solid-component',
			},
			content: "import { invokeEventHandler } from '../../utils/events';\nimport { createControllableSignal } from '../../utils/controllable';\n",
		});

		expect(output.content).toContain("from '../lib/utils'");
		expect(output.content).not.toContain('../../utils/events');
		expect(output.content).not.toContain('../../utils/controllable');
	});

	it('rewrites utility barrels, extensions, and double quotes', async () => {
		const output = await transformSolidFile({
			framework: 'solid',
			workspaceRoot: '/workspace',
			item: { name: 'form', type: 'registry:ui', title: 'Form', description: 'Form', files: [] },
			file: { source: 'form.tsx', type: 'registry:ui', transform: 'solid-component' },
			content: 'import { createFormStoreSnapshot } from "../../utils";\nimport { listenToFormReset } from "../../utils/form-control.ts";\n',
		});

		expect(output.content.match(/from '..\/lib\/utils'/g)).toHaveLength(2);
		expect(output.content).not.toContain('../../utils');
	});

	it('rewrites core subpath imports', async () => {
		const output = await transformSolidFile({
			framework: 'solid',
			workspaceRoot: '/workspace',
			item: { name: 'form', type: 'registry:ui', title: 'Form', description: 'Form', files: [] },
			file: { source: 'form.tsx', type: 'registry:ui', transform: 'solid-component' },
			content: "import type { FormSnapshot } from '@tile-ui/core/components/form';\n",
		});

		expect(output.content).toContain("from '../lib/core'");
		expect(output.content).not.toContain('@tile-ui/core');
	});

	it('rewrites component dependencies for composed families', async () => {
		const output = await transformSolidFile({
			framework: 'solid',
			workspaceRoot: '/workspace',
			item: { name: 'attachment', type: 'registry:ui', title: 'Attachment', description: 'Attachment', files: [] },
			file: { source: 'attachment.tsx', type: 'registry:ui', transform: 'solid-component' },
			content: "import { invokeEventHandler } from '../../utils/events';\nimport { Button } from '../button';\n",
		});

		expect(output.content).toContain("from '../lib/utils'");
		expect(output.content).toContain("from '../button'");
	});

	it('places component barrels beside their implementation', async () => {
		const output = await transformSolidFile({
			framework: 'solid',
			workspaceRoot: '/workspace',
			item: {
				name: 'button',
				type: 'registry:ui',
				title: 'Button',
				description: 'Button',
				files: [],
			},
			file: {
				source: 'index.ts',
				type: 'registry:ui',
				transform: 'solid-barrel',
			},
			content: "export { Button } from './button';\n",
		});

		expect(output.target).toBe('components/ui/button/index.ts');
	});

	it('rewrites core type exports in component barrels', async () => {
		const output = await transformSolidFile({
			framework: 'solid',
			workspaceRoot: '/workspace',
			item: { name: 'sonner', type: 'registry:ui', title: 'Sonner', description: 'Sonner', files: [] },
			file: { source: 'index.ts', type: 'registry:ui', transform: 'solid-barrel' },
			content: "export type { SonnerToast } from '@tile-ui/core';\n",
		});

		expect(output.content).toBe("export type { SonnerToast } from '../lib/core';\n");
	});

	it('rewrites style @use paths relative to the output target', async () => {
		const output = await transformSolidFile({
			framework: 'solid',
			workspaceRoot: '/workspace',
			item: {
				name: 'button',
				type: 'registry:ui',
				title: 'Button',
				description: 'Button',
				files: [],
			},
			file: {
				source: 'button.module.scss',
				type: 'registry:file',
				transform: 'style',
				target: 'components/ui/button/button.module.scss',
			},
			content: "@use 'variables/colors' as *;\n@use 'mixins/utils' as *;\n",
		});

		expect(output.content).toContain("@use '../../../styles/variables/colors' as *;");
		expect(output.content).toContain("@use '../../../styles/mixins/utils' as *;");
	});
});
