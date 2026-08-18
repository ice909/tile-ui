import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const reactRoot = resolve(import.meta.dirname, '../../react/src');
const vueRoot = resolve(import.meta.dirname, '../../vue/src');
const reactDemos = resolve(import.meta.dirname, '../../../apps/react/components/demos');
const vueDemos = resolve(import.meta.dirname, '../../../apps/vue/components/demos');

function read(pkgRoot: string, rel: string): string {
	return readFileSync(resolve(pkgRoot, rel), 'utf8');
}

interface ContractCase {
	name: string;
	file: string;
	defaultProp: RegExp;
	internalRef: RegExp;
	uncontrolledCheck: RegExp;
}

const vueCases: ContractCase[] = [
	{ name: 'toggle', file: 'components/toggle/toggle.tsx', defaultProp: /defaultValue\s*:/, internalRef: /internalValue/, uncontrolledCheck: /props\.modelValue === undefined/ },
	{
		name: 'checkbox',
		file: 'components/checkbox/checkbox.tsx',
		defaultProp: /defaultChecked\s*:/,
		internalRef: /internalChecked/,
		uncontrolledCheck: /props\.modelValue === undefined/,
	},
	{
		name: 'switch',
		file: 'components/switch/switch.tsx',
		defaultProp: /defaultChecked\s*:/,
		internalRef: /internalChecked/,
		uncontrolledCheck: /props\.modelValue === undefined/,
	},
	{
		name: 'toggle-group',
		file: 'components/toggle-group/toggle-group.tsx',
		defaultProp: /defaultValue\s*:/,
		internalRef: /internalValue/,
		uncontrolledCheck: /props\.modelValue === undefined/,
	},
	{ name: 'combobox', file: 'components/combobox/combobox.tsx', defaultProp: /defaultValue\s*:/, internalRef: /internalValue/, uncontrolledCheck: /props\.value === undefined/ },
	{
		name: 'native-select',
		file: 'components/native-select/native-select.tsx',
		defaultProp: /defaultValue\s*:/,
		internalRef: /internalValue/,
		uncontrolledCheck: /props\.modelValue === undefined/,
	},
];

const reactCases: ContractCase[] = [
	{ name: 'toggle', file: 'components/toggle/toggle.tsx', defaultProp: /defaultPressed/, internalRef: /internalPressed/, uncontrolledCheck: /pressed === undefined/ },
	{ name: 'checkbox', file: 'components/checkbox/checkbox.tsx', defaultProp: /defaultChecked/, internalRef: /internalChecked/, uncontrolledCheck: /checked === undefined/ },
	{ name: 'switch', file: 'components/switch/switch.tsx', defaultProp: /defaultChecked/, internalRef: /internalChecked/, uncontrolledCheck: /checked === undefined/ },
	{ name: 'toggle-group', file: 'components/toggle-group/toggle-group.tsx', defaultProp: /defaultValue/, internalRef: /internalValue/, uncontrolledCheck: /value !== undefined/ },
	{ name: 'combobox', file: 'components/combobox/combobox.tsx', defaultProp: /defaultValue/, internalRef: /internalValue/, uncontrolledCheck: /value === undefined/ },
	{
		name: 'native-select',
		file: 'components/native-select/native-select.tsx',
		defaultProp: /defaultValue/,
		internalRef: /internalValue/,
		uncontrolledCheck: /value === undefined/,
	},
];

describe('非受控状态契约（防回归）', () => {
	for (const { name, file, defaultProp, internalRef, uncontrolledCheck } of vueCases) {
		it(`Vue ${name} 支持非受控`, () => {
			const source = read(vueRoot, file);
			expect(source, `${file} 应声明默认值 prop`).toMatch(defaultProp);
			expect(source, `${file} 应持有内部状态`).toMatch(internalRef);
			expect(source, `${file} 应在非受控时更新内部状态`).toMatch(uncontrolledCheck);
		});
	}

	for (const { name, file, defaultProp, internalRef, uncontrolledCheck } of reactCases) {
		it(`React ${name} 支持非受控`, () => {
			const source = read(reactRoot, file);
			expect(source, `${file} 应声明默认值 prop`).toMatch(defaultProp);
			expect(source, `${file} 应持有内部状态`).toMatch(internalRef);
			expect(source, `${file} 应在非受控时更新内部状态`).toMatch(uncontrolledCheck);
		});
	}
});

describe('ContextMenu 循环依赖契约（防崩溃回归）', () => {
	it('useLayoutEffect 依赖不包含 position', () => {
		const source = read(reactRoot, 'components/context-menu/context-menu.tsx');
		expect(source).toMatch(/latestPositionRef/);
		expect(source).not.toMatch(/useLayoutEffect\(\(\) => \{[\s\S]*?\}, \[open, position, setPosition\]\)/);
		expect(source).toMatch(/\}, \[open, setPosition\]\)/);
	});
});

describe('Command 键盘导航契约', () => {
	it('CommandInput 处理方向键与回车', () => {
		const source = read(reactRoot, 'components/command/command.tsx');
		expect(source).toMatch(/CommandInput[\s\S]*?onKeyDown={handleKeyDown}/);
		expect(source).toMatch(/'ArrowDown'/);
		expect(source).toMatch(/'ArrowUp'/);
		expect(source).toMatch(/'Enter'/);
	});
});

describe('尺寸测量契约（防图表/轮播放大回归）', () => {
	it('React ChartContainer 的 ResizeObserver 只更新宽度', () => {
		const source = read(reactRoot, 'components/chart/chart.tsx');
		expect(source).toMatch(/ResizeObserver[\s\S]*?const \{ width \} = entry\.contentRect/);
		expect(source).not.toMatch(/setSize\(\{ width, height \}\)/);
	});

	it('Vue TChartContainer 的 ResizeObserver 只更新宽度', () => {
		const source = read(vueRoot, 'components/chart/chart.tsx');
		expect(source).toMatch(/const \{ width \} = entry\.contentRect/);
		expect(source).not.toMatch(/size\.height = height/);
	});

	it('Vue TCarouselContent 挂载时初始化滚动状态', () => {
		const source = read(vueRoot, 'components/carousel/carousel.tsx');
		expect(source).toMatch(/TCarouselContent[\s\S]*?onMounted\(\(\) => \{[\s\S]*?handleScroll\(\)/);
	});
});

describe('文档预览契约', () => {
	it('Vue 预览不包含未绑定事件的受控 modelValue', () => {
		const demoFiles = readdirSync(vueDemos).filter((file) => file.endsWith('.tsx') && file !== 'index.ts');
		for (const file of demoFiles) {
			const source = read(vueDemos, file);
			expect(source, `${file} 不应使用未绑定事件的受控 modelValue`).not.toMatch(/modelValue="[^"]*"/);
		}
	});

	it('React NavigationMenu 预览包含 Viewport', () => {
		const source = read(reactDemos, 'navigation-menu.tsx');
		expect(source).toContain('NavigationMenuViewport');
	});
});
