import { describe, expect, it } from 'vitest';

import {
	aspectRatioStyleKeys,
	carouselStyleKeys,
	clampCarouselScroll,
	clampProgressValue,
	computeResizableSizes,
	getAspectRatioPadding,
	getCarouselCanScrollNext,
	getCarouselCanScrollPrev,
	getCarouselMaxScroll,
	getCarouselScrollPosition,
	getCarouselScrollSize,
	getCarouselSelectedIndex,
	getPaginationSizeKey,
	getProgressOffset,
	getResizableDirectionCursor,
	getResizableStorageKey,
	getScrollBarSizeKey,
	getSeparatorStyleKeys,
	progressStyleKeys,
	resizableStyleKeys,
	scrollAreaStyleKeys,
} from '../src';

describe('Carousel 逻辑', () => {
	it('carouselStyleKeys 常量', () => {
		expect(carouselStyleKeys).toEqual({
			root: 'root',
			viewport: 'viewport',
			container: 'container',
			item: 'item',
			previous: 'previous',
			next: 'next',
		});
	});

	it('getCarouselCanScrollPrev', () => {
		expect(getCarouselCanScrollPrev(0)).toBe(false);
		expect(getCarouselCanScrollPrev(10)).toBe(true);
	});

	it('getCarouselCanScrollNext', () => {
		expect(getCarouselCanScrollNext(0, 100)).toBe(true);
		expect(getCarouselCanScrollNext(100, 100)).toBe(false);
		expect(getCarouselCanScrollNext(50, 100)).toBe(true);
	});

	it('getCarouselSelectedIndex', () => {
		expect(getCarouselSelectedIndex(0, 100)).toBe(0);
		expect(getCarouselSelectedIndex(95, 100)).toBe(1);
		expect(getCarouselSelectedIndex(200, 100)).toBe(2);
		expect(getCarouselSelectedIndex(50, 0)).toBe(0);
		expect(getCarouselSelectedIndex(50, -10)).toBe(0);
	});

	it('clampCarouselScroll', () => {
		expect(clampCarouselScroll(50, 100)).toBe(50);
		expect(clampCarouselScroll(-10, 100)).toBe(0);
		expect(clampCarouselScroll(150, 100)).toBe(100);
		expect(clampCarouselScroll(0, 0)).toBe(0);
	});

	it('getCarouselScrollPosition 使用 scrollLeft/scrollTop', () => {
		const element = { scrollLeft: 10, scrollTop: 20 } as unknown as HTMLElement;
		expect(getCarouselScrollPosition(element, 'horizontal')).toBe(10);
		expect(getCarouselScrollPosition(element, 'vertical')).toBe(20);
	});

	it('getCarouselScrollSize 使用 clientWidth/clientHeight', () => {
		const element = { clientWidth: 300, clientHeight: 400 } as unknown as HTMLElement;
		expect(getCarouselScrollSize(element, 'horizontal')).toBe(300);
		expect(getCarouselScrollSize(element, 'vertical')).toBe(400);
	});

	it('getCarouselMaxScroll 计算最大滚动距离', () => {
		const element = { scrollWidth: 1000, clientWidth: 300, scrollHeight: 800, clientHeight: 400 } as unknown as HTMLElement;
		expect(getCarouselMaxScroll(element, 'horizontal')).toBe(700);
		expect(getCarouselMaxScroll(element, 'vertical')).toBe(400);
	});
});

describe('Progress 逻辑', () => {
	it('progressStyleKeys 常量', () => {
		expect(progressStyleKeys).toEqual({ root: 'root', indicator: 'indicator' });
	});

	it('clampProgressValue 正常值', () => {
		expect(clampProgressValue(50)).toBe(50);
		expect(clampProgressValue(0)).toBe(0);
		expect(clampProgressValue(100)).toBe(100);
	});

	it('clampProgressValue 超出范围', () => {
		expect(clampProgressValue(-10)).toBe(0);
		expect(clampProgressValue(150)).toBe(100);
	});

	it('clampProgressValue undefined 和 NaN', () => {
		expect(clampProgressValue(undefined)).toBe(0);
		expect(clampProgressValue(NaN)).toBe(0);
	});

	it('clampProgressValue 自定义范围', () => {
		expect(clampProgressValue(5, 10, 20)).toBe(10);
		expect(clampProgressValue(15, 10, 20)).toBe(15);
		expect(clampProgressValue(25, 10, 20)).toBe(20);
	});

	it('getProgressOffset 正常百分比计算', () => {
		expect(getProgressOffset(50, 0, 100)).toBe(50);
		expect(getProgressOffset(0, 0, 100)).toBe(0);
		expect(getProgressOffset(100, 0, 100)).toBe(100);
	});

	it('getProgressOffset 自定义范围', () => {
		expect(getProgressOffset(15, 10, 20)).toBe(50);
		expect(getProgressOffset(10, 10, 20)).toBe(0);
		expect(getProgressOffset(20, 10, 20)).toBe(100);
	});

	it('getProgressOffset 范围为 0 时返回 0', () => {
		expect(getProgressOffset(50, 50, 50)).toBe(0);
	});

	it('getProgressOffset undefined 值', () => {
		expect(getProgressOffset(undefined)).toBe(0);
	});
});

describe('Resizable 逻辑', () => {
	it('resizableStyleKeys 常量', () => {
		expect(resizableStyleKeys).toEqual({
			group: 'group',
			panel: 'panel',
			handle: 'handle',
			handleBar: 'handleBar',
		});
	});

	it('getResizableStorageKey', () => {
		expect(getResizableStorageKey('panel-1')).toBe('tile-resizable:panel-1');
	});

	it('getResizableDirectionCursor', () => {
		expect(getResizableDirectionCursor('horizontal')).toBe('col-resize');
		expect(getResizableDirectionCursor('vertical')).toBe('row-resize');
	});

	it('computeResizableSizes 均等分配', () => {
		const result = computeResizableSizes([50, 50], 0, 10);
		expect(result[0]).toBe(60);
		expect(result[1]).toBe(40);
	});

	it('computeResizableSizes 限制最小尺寸', () => {
		const result = computeResizableSizes([15, 85], 0, -10);
		expect(result[0]).toBeGreaterThanOrEqual(10);
		expect(result[1]).toBeGreaterThanOrEqual(10);
	});

	it('computeResizableSizes 不修改原始数组', () => {
		const original = [50, 50];
		computeResizableSizes(original, 0, 10);
		expect(original).toEqual([50, 50]);
	});

	it('computeResizableSizes 处理缺失面板', () => {
		const result = computeResizableSizes([50], 0, 10);
		expect(result).toHaveLength(2);
		expect(result[0]).toBe(40);
		expect(result[1]).toBe(10);
	});
});

describe('Separator 样式', () => {
	it('getSeparatorStyleKeys', () => {
		expect(getSeparatorStyleKeys('horizontal')).toEqual({
			base: 'separator',
			orientation: 'orientationHorizontal',
		});
		expect(getSeparatorStyleKeys('vertical')).toEqual({
			base: 'separator',
			orientation: 'orientationVertical',
		});
	});
});

describe('ScrollArea 样式', () => {
	it('scrollAreaStyleKeys 常量', () => {
		expect(scrollAreaStyleKeys).toEqual({
			root: 'root',
			viewport: 'viewport',
			scrollbar: 'scrollbar',
			thumb: 'thumb',
			vertical: 'vertical',
			horizontal: 'horizontal',
		});
	});

	it('getScrollBarSizeKey', () => {
		expect(getScrollBarSizeKey('vertical')).toBe('vertical');
		expect(getScrollBarSizeKey('horizontal')).toBe('horizontal');
	});
});

describe('AspectRatio 逻辑', () => {
	it('aspectRatioStyleKeys 常量', () => {
		expect(aspectRatioStyleKeys).toEqual({ root: 'root', content: 'content' });
	});

	it('getAspectRatioPadding 正常比例', () => {
		expect(getAspectRatioPadding(16 / 9)).toBeCloseTo(56.25);
		expect(getAspectRatioPadding(1)).toBe(100);
		expect(getAspectRatioPadding(4 / 3)).toBeCloseTo(75);
	});

	it('getAspectRatioPadding 无效值回退 100', () => {
		expect(getAspectRatioPadding(0)).toBe(100);
		expect(getAspectRatioPadding(-1)).toBe(100);
		expect(getAspectRatioPadding(Infinity)).toBe(100);
		expect(getAspectRatioPadding(NaN)).toBe(100);
	});
});

describe('Pagination 样式', () => {
	it('getPaginationSizeKey', () => {
		expect(getPaginationSizeKey('default')).toBe('sizeDefault');
		expect(getPaginationSizeKey('sm')).toBe('sizeSm');
		expect(getPaginationSizeKey('lg')).toBe('sizeLg');
		expect(getPaginationSizeKey('icon')).toBe('sizeIcon');
	});
});
