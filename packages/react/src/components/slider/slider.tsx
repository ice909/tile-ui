import React, { createContext, useContext, useState } from 'react';
import { clampSliderValue, getSliderOffsetStyle, getSliderPercent, sliderStyleKeys } from '@tile-ui/core';
import type { SliderBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/slider.module.scss';

interface SliderContextValue {
	value: number;
	min: number;
	max: number;
	step: number;
	orientation: 'horizontal' | 'vertical';
	disabled: boolean;
	setValue: (value: number) => void;
}

const SliderContext = createContext<SliderContextValue | null>(null);

function useSliderContext(): SliderContextValue {
	const context = useContext(SliderContext);
	if (!context) {
		throw new Error('Slider sub-components must be used within <Slider>.');
	}
	return context;
}

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'value' | 'defaultValue'>, SliderBaseProps {}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
	({ className = '', value, defaultValue = 0, min = 0, max = 100, step = 1, orientation = 'horizontal', disabled = false, onValueChange, children, ...props }, ref) => {
		const [internalValue, setInternalValue] = useState(defaultValue);
		const currentValue = value !== undefined ? value : internalValue;
		const clampedValue = clampSliderValue(currentValue, min, max);

		function setValue(next: number) {
			if (disabled) {
				return;
			}
			const clamped = clampSliderValue(next, min, max);
			const stepped = clampSliderValue(min + Math.round((clamped - min) / step) * step, min, max);
			if (value === undefined) {
				setInternalValue(stepped);
			}
			onValueChange?.(stepped);
		}

		function updateFromEvent(event: React.PointerEvent<HTMLDivElement>, element: HTMLElement) {
			const rect = element.getBoundingClientRect();
			let next: number;
			if (orientation === 'vertical') {
				next = min + ((event.clientY - rect.top) / rect.height) * (max - min);
			} else {
				next = min + ((event.clientX - rect.left) / rect.width) * (max - min);
			}
			setValue(next);
		}

		function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
			if (disabled) {
				return;
			}
			event.currentTarget.setPointerCapture(event.pointerId);
			updateFromEvent(event, event.currentTarget);
		}

		function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
			if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId)) {
				return;
			}
			updateFromEvent(event, event.currentTarget);
		}

		return (
			<SliderContext.Provider value={{ value: clampedValue, min, max, step, orientation, disabled, setValue }}>
				<div
					{...props}
					ref={ref}
					data-orientation={orientation}
					data-disabled={disabled}
					className={`${styles[sliderStyleKeys.root]} ${className}`}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}>
					{children}
				</div>
			</SliderContext.Provider>
		);
	},
);
Slider.displayName = 'Slider';

export interface SliderTrackProps extends React.HTMLAttributes<HTMLDivElement> {}

const SliderTrack = React.forwardRef<HTMLDivElement, SliderTrackProps>(({ className = '', ...props }, ref) => {
	const context = useSliderContext();

	return <div ref={ref} data-orientation={context.orientation} className={`${styles[sliderStyleKeys.track]} ${className}`} {...props} />;
});
SliderTrack.displayName = 'SliderTrack';

export interface SliderRangeProps extends React.HTMLAttributes<HTMLDivElement> {}

const SliderRange = React.forwardRef<HTMLDivElement, SliderRangeProps>(({ className = '', ...props }, ref) => {
	const context = useSliderContext();
	const percent = getSliderPercent(context.value, context.min, context.max);
	const style = context.orientation === 'vertical' ? { height: `${percent}%` } : { width: `${percent}%` };

	return <div ref={ref} data-orientation={context.orientation} className={`${styles[sliderStyleKeys.range]} ${className}`} style={style} {...props} />;
});
SliderRange.displayName = 'SliderRange';

export interface SliderThumbProps extends React.HTMLAttributes<HTMLSpanElement> {}

const SliderThumb = React.forwardRef<HTMLSpanElement, SliderThumbProps>(({ className = '', onKeyDown, ...props }, ref) => {
	const context = useSliderContext();
	const offsetStyle = getSliderOffsetStyle(context.value, context.min, context.max, context.orientation);

	function handleKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
		onKeyDown?.(event);

		if (event.key === 'Home') {
			context.setValue(context.min);
			event.preventDefault();
			return;
		}

		if (event.key === 'End') {
			context.setValue(context.max);
			event.preventDefault();
			return;
		}

		const delta =
			context.orientation === 'horizontal'
				? event.key === 'ArrowRight'
					? 1
					: event.key === 'ArrowLeft'
						? -1
						: 0
				: event.key === 'ArrowDown'
					? 1
					: event.key === 'ArrowUp'
						? -1
						: 0;

		if (delta !== 0) {
			context.setValue(context.value + delta * context.step);
			event.preventDefault();
		}
	}

	return (
		<span
			{...props}
			ref={ref}
			role="slider"
			tabIndex={context.disabled ? -1 : 0}
			aria-disabled={context.disabled}
			aria-valuemin={context.min}
			aria-valuemax={context.max}
			aria-valuenow={context.value}
			aria-orientation={context.orientation}
			data-orientation={context.orientation}
			className={`${styles[sliderStyleKeys.thumb]} ${className}`}
			style={offsetStyle}
			onKeyDown={handleKeyDown}
		/>
	);
});
SliderThumb.displayName = 'SliderThumb';

export { Slider, SliderTrack, SliderRange, SliderThumb };
export default Slider;
