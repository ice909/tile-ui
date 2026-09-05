/** Get device pixel ratio, clamped to reasonable range. */
export function getDpr(devicePixelRatio?: number): number {
	return Math.min(devicePixelRatio || 1, 3);
}

/** Apply DPR scaling to canvas context. */
export function applyDpr(ctx: CanvasRenderingContext2D, dpr: number, w: number, h: number) {
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.clearRect(0, 0, w, h);
}
