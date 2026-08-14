import type { SliderOrientation } from './slider.types';

/**
 * 将 Slider 值限制在 [min, max] 区间内
 */
export function clampSliderValue(value: number, min: number = 0, max: number = 100): number {
	if (Number.isNaN(value)) {
		return min;
	}
	return Math.min(max, Math.max(min, value));
}

/**
 * 计算 Slider 值在 [min, max] 区间内对应的百分比（0-100）
 */
export function getSliderPercent(value: number, min: number = 0, max: number = 100): number {
	const clamped = clampSliderValue(value, min, max);
	const range = max - min;
	if (range <= 0) {
		return 0;
	}
	return ((clamped - min) / range) * 100;
}

/**
 * 计算 Slider 拇指的定位样式（水平: left / 垂直: top 百分比）
 */
export function getSliderOffsetStyle(value: number, min: number = 0, max: number = 100, orientation: SliderOrientation = 'horizontal') {
	const percent = getSliderPercent(value, min, max);
	if (orientation === 'vertical') {
		return { top: `${percent}%` };
	}
	return { left: `${percent}%` };
}

/**
 * Slider 组件样式类名键
 */
export const sliderStyleKeys = {
	root: 'root',
	track: 'track',
	range: 'range',
	thumb: 'thumb',
} as const;
