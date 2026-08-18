import { describe, expect, it, vi } from 'vitest';

import {
	accordionStyleKeys,
	breadcrumbStyleKeys,
	collapsibleStyleKeys,
	emptyStyleKeys,
	getItemMediaVariantKey,
	getItemSizeKey,
	getItemVariantKey,
	getTabsListVariantKey,
	kbdStyleKeys,
	menubarStyleKeys,
	MENUBAR_VIEWPORT_MARGIN,
	navigationMenuStyleKeys,
	SIDEBAR_COOKIE_MAX_AGE,
	SIDEBAR_COOKIE_NAME,
	SIDEBAR_KEYBOARD_SHORTCUT,
	SIDEBAR_MEDIA_QUERY,
	SIDEBAR_MOBILE_BREAKPOINT,
	SIDEBAR_WIDTH,
	SIDEBAR_WIDTH_ICON,
	SIDEBAR_WIDTH_MOBILE,
	sonnerStyleKeys,
	SONNER_DEFAULT_DURATION,
	SONNER_DISMISS_DURATION,
	spinnerStyleKeys,
	tabsStyleKeys,
	createMediaQueryWatcher,
} from '../src';

describe('Tabs', () => {
	it('getTabsListVariantKey', () => {
		expect(getTabsListVariantKey()).toBe('variantDefault');
		expect(getTabsListVariantKey('line')).toBe('variantLine');
		expect(getTabsListVariantKey('default')).toBe('variantDefault');
	});

	it('tabsStyleKeys 常量', () => {
		expect(tabsStyleKeys).toEqual({ root: 'root', list: 'list', trigger: 'trigger', content: 'content' });
	});
});

describe('Breadcrumb', () => {
	it('breadcrumbStyleKeys 常量', () => {
		expect(breadcrumbStyleKeys).toEqual({
			root: 'root',
			list: 'list',
			item: 'item',
			link: 'link',
			page: 'page',
			separator: 'separator',
			ellipsis: 'ellipsis',
			ellipsisIcon: 'ellipsisIcon',
			srOnly: 'srOnly',
		});
	});
});

describe('Item', () => {
	it('getItemVariantKey', () => {
		expect(getItemVariantKey()).toBe('variantDefault');
		expect(getItemVariantKey('outline')).toBe('variantOutline');
		expect(getItemVariantKey('muted')).toBe('variantMuted');
	});

	it('getItemSizeKey', () => {
		expect(getItemSizeKey()).toBe('sizeDefault');
		expect(getItemSizeKey('sm')).toBe('sizeSm');
	});

	it('getItemMediaVariantKey', () => {
		expect(getItemMediaVariantKey()).toBe('variantDefault');
		expect(getItemMediaVariantKey('icon')).toBe('variantIcon');
		expect(getItemMediaVariantKey('image')).toBe('variantImage');
	});
});

describe('Kbd', () => {
	it('kbdStyleKeys 常量', () => {
		expect(kbdStyleKeys).toEqual({ base: 'kbd', group: 'kbdGroup' });
	});
});

describe('Spinner', () => {
	it('spinnerStyleKeys 常量', () => {
		expect(spinnerStyleKeys).toEqual({ root: 'root' });
	});
});

describe('Accordion', () => {
	it('accordionStyleKeys 常量', () => {
		expect(accordionStyleKeys).toEqual({
			root: 'root',
			item: 'item',
			header: 'header',
			trigger: 'trigger',
			chevron: 'chevron',
			content: 'content',
			contentInner: 'contentInner',
		});
	});
});

describe('Collapsible', () => {
	it('collapsibleStyleKeys 常量', () => {
		expect(collapsibleStyleKeys).toEqual({ root: 'root', trigger: 'trigger', content: 'content', contentInner: 'contentInner' });
	});
});

describe('NavigationMenu', () => {
	it('navigationMenuStyleKeys 常量', () => {
		expect(navigationMenuStyleKeys).toEqual({
			root: 'root',
			list: 'list',
			item: 'item',
			trigger: 'trigger',
			content: 'content',
			link: 'link',
			viewport: 'viewport',
			viewportInner: 'viewportInner',
			indicator: 'indicator',
			indicatorArrow: 'indicatorArrow',
			chevron: 'chevron',
		});
	});
});

describe('Empty', () => {
	it('emptyStyleKeys 常量', () => {
		expect(emptyStyleKeys).toEqual({ root: 'root', header: 'header', media: 'media', title: 'title', description: 'description', content: 'content' });
	});
});

describe('Menubar', () => {
	it('menubarStyleKeys 常量', () => {
		expect(menubarStyleKeys).toEqual({
			root: 'root',
			menu: 'menu',
			trigger: 'trigger',
			content: 'content',
			group: 'group',
			item: 'item',
			checkboxItem: 'checkboxItem',
			radioGroup: 'radioGroup',
			radioItem: 'radioItem',
			indicator: 'indicator',
			label: 'label',
			separator: 'separator',
			shortcut: 'shortcut',
			subTrigger: 'subTrigger',
			subContent: 'subContent',
			chevron: 'chevron',
			checkIcon: 'checkIcon',
			radioIcon: 'radioIcon',
		});
	});

	it('MENUBAR_VIEWPORT_MARGIN 常量', () => {
		expect(MENUBAR_VIEWPORT_MARGIN).toBe(8);
	});
});

describe('Sonner', () => {
	it('sonnerStyleKeys 常量', () => {
		expect(sonnerStyleKeys).toEqual({
			root: 'root',
			toast: 'toast',
			icon: 'icon',
			content: 'content',
			title: 'title',
			description: 'description',
			close: 'close',
			actions: 'actions',
			action: 'action',
		});
	});

	it('SONNER_DEFAULT_DURATION / SONNER_DISMISS_DURATION 常量', () => {
		expect(SONNER_DEFAULT_DURATION).toBe(4000);
		expect(SONNER_DISMISS_DURATION).toBe(200);
	});
});

describe('Sidebar 常量', () => {
	it('SIDEBAR_COOKIE_NAME', () => {
		expect(SIDEBAR_COOKIE_NAME).toBe('sidebar_state');
	});

	it('SIDEBAR_COOKIE_MAX_AGE', () => {
		expect(SIDEBAR_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 7);
	});

	it('SIDEBAR_WIDTH', () => {
		expect(SIDEBAR_WIDTH).toBe('16rem');
	});

	it('SIDEBAR_WIDTH_MOBILE', () => {
		expect(SIDEBAR_WIDTH_MOBILE).toBe('18rem');
	});

	it('SIDEBAR_WIDTH_ICON', () => {
		expect(SIDEBAR_WIDTH_ICON).toBe('3rem');
	});

	it('SIDEBAR_KEYBOARD_SHORTCUT', () => {
		expect(SIDEBAR_KEYBOARD_SHORTCUT).toBe('b');
	});

	it('SIDEBAR_MOBILE_BREAKPOINT', () => {
		expect(SIDEBAR_MOBILE_BREAKPOINT).toBe(768);
	});

	it('SIDEBAR_MEDIA_QUERY', () => {
		expect(SIDEBAR_MEDIA_QUERY).toBe('(max-width: 767px)');
	});
});

describe('Sidebar createMediaQueryWatcher', () => {
	it('window 未定义时调用 onChange(false) 并返回空函数', () => {
		const original = globalThis.window;
		// @ts-expect-error 测试环境模拟
		delete globalThis.window;
		const onChange = vi.fn();
		const unsub = createMediaQueryWatcher('(max-width: 768px)', onChange);
		expect(onChange).toHaveBeenCalledWith(false);
		expect(typeof unsub).toBe('function');
		unsub();
		globalThis.window = original;
	});

	it('matchMedia 不可用时调用 onChange(false)', () => {
		const original = globalThis.window;
		// @ts-expect-error 测试环境模拟
		globalThis.window = { matchMedia: undefined };
		const onChange = vi.fn();
		const unsub = createMediaQueryWatcher('(max-width: 768px)', onChange);
		expect(onChange).toHaveBeenCalledWith(false);
		unsub();
		globalThis.window = original;
	});

	it('正常环境调用 matchMedia 并注册 change 监听', () => {
		const mockMedia = {
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};
		const original = globalThis.window;
		// @ts-expect-error 测试环境模拟
		globalThis.window = { matchMedia: vi.fn(() => mockMedia) };

		const onChange = vi.fn();
		const unsub = createMediaQueryWatcher('(max-width: 768px)', onChange);

		expect(globalThis.window.matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
		expect(mockMedia.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
		expect(onChange).toHaveBeenCalledWith(false);

		// 模拟 change 事件
		const changeHandler = mockMedia.addEventListener.mock.calls.find((c: unknown[]) => c[0] === 'change')?.[1] as (e: { matches: boolean }) => void;
		changeHandler({ matches: true });
		expect(onChange).toHaveBeenCalledWith(true);

		unsub();
		expect(mockMedia.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
		globalThis.window = original;
	});
});
