import { describe, expect, it } from 'vitest';

import {
	RESIZABLE_MIN_SIZE,
	buildSonnerToastApi,
	clampCarouselScroll,
	computeResizableSizes,
	createSonnerStore,
	formatAttachmentSize,
	getAspectRatioPadding,
	getAttachmentActionState,
	getAttachmentFileExtension,
	getAttachmentFileKind,
	getCarouselCanScrollNext,
	getCarouselCanScrollPrev,
	getCarouselMaxScroll,
	getCarouselScrollPosition,
	getCarouselScrollSize,
	getCarouselSelectedIndex,
	getNextOtpIndex,
	getPrevOtpIndex,
	getResizableStorageKey,
	isAttachmentActionable,
	isMobileViewport,
	isOtpCharAllowed,
	isScrollerNearBottom,
	joinOtpValue,
	matchesSidebarToggleShortcut,
	splitOtpValue,
	truncateAttachmentName,
	findSidebarActiveIndex,
} from '../src';

describe('AspectRatio / Resizable', () => {
	it('getAspectRatioPadding', () => {
		expect(getAspectRatioPadding(1)).toBe(100);
		expect(getAspectRatioPadding(16 / 9)).toBeCloseTo(56.25);
		expect(getAspectRatioPadding(0)).toBe(100);
		expect(getAspectRatioPadding(Number.NaN)).toBe(100);
	});

	it('computeResizableSizes', () => {
		expect(computeResizableSizes([20, 80], 0, 10)).toEqual([30, 70]);
		expect(computeResizableSizes([20, 80], 0, -30)).toEqual([RESIZABLE_MIN_SIZE, 90]);
		expect(computeResizableSizes([50, 50], 0, 100)).toEqual([90, 10]);
	});

	it('getResizableStorageKey', () => {
		expect(getResizableStorageKey('layout')).toBe('tile-resizable:layout');
	});
});

describe('Carousel', () => {
	const horizontal = { scrollLeft: 120, scrollTop: 0, clientWidth: 400, clientHeight: 100, scrollWidth: 1200, scrollHeight: 100 } as unknown as HTMLElement;
	const vertical = { scrollLeft: 0, scrollTop: 80, clientWidth: 100, clientHeight: 400, scrollWidth: 100, scrollHeight: 1600 } as unknown as HTMLElement;

	it('getCarouselScrollPosition / getCarouselScrollSize', () => {
		expect(getCarouselScrollPosition(horizontal, 'horizontal')).toBe(120);
		expect(getCarouselScrollPosition(vertical, 'vertical')).toBe(80);
		expect(getCarouselScrollSize(horizontal, 'horizontal')).toBe(400);
	});

	it('getCarouselMaxScroll', () => {
		expect(getCarouselMaxScroll(horizontal, 'horizontal')).toBe(800);
		expect(getCarouselMaxScroll(vertical, 'vertical')).toBe(1200);
	});

	it('getCarouselCanScrollPrev / getCarouselCanScrollNext', () => {
		expect(getCarouselCanScrollPrev(0)).toBe(false);
		expect(getCarouselCanScrollPrev(10)).toBe(true);
		expect(getCarouselCanScrollNext(100, 100)).toBe(false);
		expect(getCarouselCanScrollNext(99, 100)).toBe(true);
	});

	it('getCarouselSelectedIndex / clampCarouselScroll', () => {
		expect(getCarouselSelectedIndex(400, 400)).toBe(1);
		expect(getCarouselSelectedIndex(100, 0)).toBe(0);
		expect(clampCarouselScroll(-5, 100)).toBe(0);
		expect(clampCarouselScroll(150, 100)).toBe(100);
	});
});

describe('Sidebar', () => {
	it('isMobileViewport', () => {
		expect(isMobileViewport(600)).toBe(true);
		expect(isMobileViewport(1024)).toBe(false);
	});

	it('matchesSidebarToggleShortcut', () => {
		expect(matchesSidebarToggleShortcut({ key: 'b', metaKey: true })).toBe(true);
		expect(matchesSidebarToggleShortcut({ key: 'B', ctrlKey: true })).toBe(true);
		expect(matchesSidebarToggleShortcut({ key: 'b' })).toBe(false);
		expect(matchesSidebarToggleShortcut({ key: 'x', metaKey: true })).toBe(false);
	});

	it('findSidebarActiveIndex', () => {
		const items = [{ value: 'a', children: [{ value: 'a1' }, { value: 'a2' }] }, { value: 'b' }];
		expect(findSidebarActiveIndex(items, 'b')).toEqual({ itemIndex: 1, subIndex: -1, activeSub: false });
		expect(findSidebarActiveIndex(items, 'a2')).toEqual({ itemIndex: 0, subIndex: 1, activeSub: true });
		expect(findSidebarActiveIndex(items, 'none')).toEqual({ itemIndex: -1, subIndex: -1, activeSub: false });
	});
});

describe('InputOTP', () => {
	it('splitOtpValue / joinOtpValue', () => {
		expect(splitOtpValue('ab', 4)).toEqual(['a', 'b', '', '']);
		expect(splitOtpValue('abcd', 4)).toEqual(['a', 'b', 'c', 'd']);
		expect(splitOtpValue('abcdef', 4)).toEqual(['a', 'b', 'c', 'd']);
		expect(joinOtpValue(['a', 'b', '', ''], 4)).toBe('ab');
	});

	it('isOtpCharAllowed', () => {
		expect(isOtpCharAllowed('5', 'numeric')).toBe(true);
		expect(isOtpCharAllowed('x', 'numeric')).toBe(false);
		expect(isOtpCharAllowed('A', 'alphanumeric')).toBe(true);
		expect(isOtpCharAllowed('!', 'alphanumeric')).toBe(false);
		expect(isOtpCharAllowed('!', 'text')).toBe(true);
		expect(isOtpCharAllowed('ab', 'text')).toBe(false);
	});

	it('getNextOtpIndex / getPrevOtpIndex', () => {
		expect(getNextOtpIndex(0, 4)).toBe(1);
		expect(getNextOtpIndex(3, 4)).toBeNull();
		expect(getPrevOtpIndex(0)).toBeNull();
		expect(getPrevOtpIndex(2)).toBe(1);
	});
});

describe('Attachment', () => {
	it('getAttachmentFileExtension', () => {
		expect(getAttachmentFileExtension('report.pdf')).toBe('pdf');
		expect(getAttachmentFileExtension('archive.tar.gz')).toBe('gz');
		expect(getAttachmentFileExtension('noext')).toBe('');
	});

	it('getAttachmentFileKind', () => {
		expect(getAttachmentFileKind('a.pdf')).toBe('pdf');
		expect(getAttachmentFileKind('a.png')).toBe('image');
		expect(getAttachmentFileKind('a.txt')).toBe('document');
		expect(getAttachmentFileKind('a.mp4')).toBe('video');
		expect(getAttachmentFileKind('unknown.xyz')).toBe('generic');
	});

	it('formatAttachmentSize', () => {
		expect(formatAttachmentSize(0)).toBe('0 Bytes');
		expect(formatAttachmentSize(1024)).toBe('1 KB');
		expect(formatAttachmentSize(1024 * 1024)).toBe('1 MB');
		expect(formatAttachmentSize(undefined)).toBe('');
	});

	it('truncateAttachmentName', () => {
		expect(truncateAttachmentName('short.pdf', 20)).toBe('short.pdf');
		const truncated = truncateAttachmentName('very-long-filename-example.pdf', 10);
		expect(truncated.endsWith('.pdf')).toBe(true);
		expect(truncated.length).toBeLessThanOrEqual(10);
	});

	it('getAttachmentActionState / isAttachmentActionable', () => {
		expect(getAttachmentActionState(undefined, undefined)).toBe('idle');
		expect(getAttachmentActionState(true)).toBe('downloading');
		expect(getAttachmentActionState(false, true)).toBe('error');
		expect(isAttachmentActionable(undefined)).toBe(true);
		expect(isAttachmentActionable('done')).toBe(true);
		expect(isAttachmentActionable('downloading')).toBe(false);
	});
});

describe('MessageScroller', () => {
	it('isScrollerNearBottom', () => {
		const el = { scrollHeight: 1000, scrollTop: 950, clientHeight: 100 } as unknown as HTMLElement;
		expect(isScrollerNearBottom(el)).toBe(true);
		expect(isScrollerNearBottom({ scrollHeight: 1000, scrollTop: 100, clientHeight: 100 } as unknown as HTMLElement)).toBe(false);
	});
});

describe('Sonner store', () => {
	it('add / getToasts / update / dismiss / remove / dismissAll', () => {
		const store = createSonnerStore();
		const id = store.add({ title: 'hi' });
		expect(store.getToasts()).toHaveLength(1);
		store.update(id, { title: 'updated' });
		expect(store.getToasts()[0].title).toBe('updated');
		store.dismiss(id);
		expect(store.getToasts()[0].dismissing).toBe(true);
		store.remove(id);
		expect(store.getToasts()).toHaveLength(0);
		const id2 = store.add({ title: 'a' });
		store.add({ title: 'b' });
		store.dismissAll();
		expect(store.getToasts().filter((t) => t.dismissing).length).toBeGreaterThanOrEqual(2);
		void id2;
	});

	it('buildSonnerToastApi 类型化调用', () => {
		const store = createSonnerStore();
		const api = buildSonnerToastApi(store);
		api.success('done');
		api.error({ title: 'boom' });
		expect(store.getToasts()).toHaveLength(2);
		expect(store.getToasts()[0].type).toBe('success');
		expect(store.getToasts()[1].type).toBe('error');
		api.dismiss();
		expect(store.getToasts().every((t) => t.dismissing)).toBe(true);
	});
});
