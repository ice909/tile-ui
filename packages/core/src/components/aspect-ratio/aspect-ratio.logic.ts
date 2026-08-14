/**
 * AspectRatio 组件样式类名键
 */
export const aspectRatioStyleKeys = {
	root: 'root',
	content: 'content',
} as const;

/**
 * 根据宽高比计算 padding-top 百分比（1 / ratio * 100）
 */
export function getAspectRatioPadding(ratio: number = 1): number {
	if (!Number.isFinite(ratio) || ratio <= 0) {
		return 100;
	}

	return (1 / ratio) * 100;
}
