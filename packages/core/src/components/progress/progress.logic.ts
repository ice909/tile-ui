/**
 * 将进度值限制在 [min, max] 区间内
 */
export function clampProgressValue(value: number | undefined, min: number = 0, max: number = 100): number {
	if (value === undefined || Number.isNaN(value)) {
		return min;
	}
	return Math.min(max, Math.max(min, value));
}

/**
 * 计算 Progress 指示器需要平移的百分比偏移
 */
export function getProgressOffset(value: number | undefined, min: number = 0, max: number = 100): number {
	const clamped = clampProgressValue(value, min, max);
	const range = max - min;
	if (range <= 0) {
		return 0;
	}
	return ((clamped - min) / range) * 100;
}

/**
 * Progress 组件样式类名键
 */
export const progressStyleKeys = {
	root: 'root',
	indicator: 'indicator',
} as const;
