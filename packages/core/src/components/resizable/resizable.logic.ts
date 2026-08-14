import type { ResizableDirection } from './resizable.types';

/**
 * Resizable 组件样式类名键
 */
export const resizableStyleKeys = {
	group: 'group',
	panel: 'panel',
	handle: 'handle',
	handleBar: 'handleBar',
} as const;

/** 单个面板最小尺寸 (百分比) */
export const RESIZABLE_MIN_SIZE = 10;

/** localStorage 存储键前缀 */
export const RESIZABLE_STORAGE_PREFIX = 'tile-resizable';

/**
 * 生成持久化存储键
 */
export function getResizableStorageKey(id: string): string {
	return `${RESIZABLE_STORAGE_PREFIX}:${id}`;
}

/**
 * 根据拖动增量重新计算相邻两个面板的尺寸 (保持总比例不变，且不小于最小尺寸)
 */
export function computeResizableSizes(sizes: number[], index: number, delta: number, min: number = RESIZABLE_MIN_SIZE): number[] {
	const next = sizes.slice();
	const a = next[index] ?? 0;
	const b = next[index + 1] ?? 0;
	const sum = a + b;
	const nextA = Math.max(min, Math.min(sum - min, a + delta));
	next[index] = nextA;
	next[index + 1] = sum - nextA;
	return next;
}

/**
 * 获取拖拽时的鼠标光标样式
 */
export function getResizableDirectionCursor(direction: ResizableDirection): string {
	return direction === 'horizontal' ? 'col-resize' : 'row-resize';
}
