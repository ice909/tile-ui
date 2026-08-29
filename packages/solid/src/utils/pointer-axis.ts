export type PointerAxis = 'horizontal' | 'vertical';

/** 将指针位置映射到 0..1；垂直轴默认从底部开始，零尺寸返回 0。 */
export function getPointerAxisRatio(
	clientX: number,
	clientY: number,
	rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
	axis: PointerAxis,
	inverted: boolean = false,
): number {
	const size = axis === 'horizontal' ? rect.width : rect.height;
	if (size <= 0) {
		return 0;
	}
	const start = axis === 'horizontal' ? rect.left : rect.top;
	const point = axis === 'horizontal' ? clientX : clientY;
	let ratio = Math.min(1, Math.max(0, (point - start) / size));
	if ((axis === 'vertical') !== inverted) {
		ratio = 1 - ratio;
	}
	return ratio;
}
