import { createContext, createEffect, createRenderEffect, createSignal, onCleanup, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { clampSliderValue, getSliderOffsetStyle, getSliderPercent, sliderStyleKeys } from '@tile-ui/core';
import type { SliderBaseProps, SliderOrientation } from '@tile-ui/core';
import { createFormResetBinding, getPointerAxisRatio, HIDDEN_FORM_CONTROL_PROPS, invokeEventHandler, setInitialNativeValue, setNativeValue } from '../../utils';
import styles from '@tile-ui/styles/scss/components/slider.module.scss';

interface SliderContextValue {
	value: Accessor<number>;
	min: Accessor<number>;
	max: Accessor<number>;
	step: Accessor<number>;
	orientation: Accessor<SliderOrientation>;
	disabled: Accessor<boolean>;
	setValue: (value: number) => number;
}

const SliderContext = createContext<SliderContextValue>();

function useSlider() {
	const context = useContext(SliderContext);
	if (!context) throw new Error('Slider 子组件必须位于 <Slider> 内部。');
	return context;
}

function getPrecision(value: number) {
	const exponent = value.toString().match(/e-(\d+)$/)?.[1];
	if (exponent) return Number(exponent);
	return value.toString().split('.')[1]?.length ?? 0;
}

function snapSliderValue(value: number, min: number, max: number, step: number) {
	const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
	const clamped = clampSliderValue(value, min, max);
	if (clamped === min || clamped === max) return clamped;
	const precision = Math.max(getPrecision(min), getPrecision(max), getPrecision(safeStep));
	const snapped = min + Math.round((clamped - min) / safeStep) * safeStep;
	return clampSliderValue(Number(snapped.toFixed(precision)), min, max);
}

export interface SliderProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'value' | 'defaultValue'>, SliderBaseProps {
	/** 提交到原生表单的字段名。 */
	name?: string;
	/** 关联的原生表单 ID。 */
	form?: string;
}

/** SolidJS Slider：标量受控/非受控滑块，支持指针、键盘和原生表单。 */
export function Slider(props: ParentProps<SliderProps>) {
	const [local, rest] = splitProps(props, [
		'class',
		'children',
		'value',
		'defaultValue',
		'min',
		'max',
		'step',
		'orientation',
		'disabled',
		'onValueChange',
		'onPointerDown',
		'onPointerMove',
		'onPointerUp',
		'onPointerCancel',
		'name',
		'form',
	]);
	const min = () => local.min ?? 0;
	const max = () => Math.max(min(), local.max ?? 100);
	const step = () => (Number.isFinite(local.step) && (local.step ?? 0) > 0 ? local.step! : 1);
	const orientation = () => local.orientation ?? 'horizontal';
	const disabled = () => local.disabled ?? false;
	const capturedDefaultValue = local.defaultValue ?? min();
	const resetValue = () => snapSliderValue(capturedDefaultValue, min(), max(), step());
	const [uncontrolledValue, setUncontrolledValue] = createSignal(resetValue());
	const controlled = () => local.value !== undefined;
	const value = () => snapSliderValue(controlled() ? local.value! : uncontrolledValue(), min(), max(), step());
	let root: HTMLDivElement | undefined;
	const [formControl, setFormControl] = createSignal<HTMLInputElement>();

	function setValue(next: number) {
		if (disabled()) return value();
		const resolved = snapSliderValue(next, min(), max(), step());
		const previous = value();
		if (!controlled()) setUncontrolledValue(resolved);
		if (!Object.is(previous, resolved)) local.onValueChange?.(resolved);
		return resolved;
	}

	function updateFromPointer(event: PointerEvent) {
		if (!root) return;
		const ratio = getPointerAxisRatio(event.clientX, event.clientY, root.getBoundingClientRect(), orientation());
		setValue(min() + ratio * (max() - min()));
	}

	function hasCapture(event: PointerEvent) {
		if (!root?.hasPointerCapture) return false;
		try {
			return root.hasPointerCapture(event.pointerId);
		} catch {
			return false;
		}
	}

	function releaseCapture(event: PointerEvent) {
		if (!root?.releasePointerCapture || !hasCapture(event)) return;
		try {
			root.releasePointerCapture(event.pointerId);
		} catch {
			// Pointer capture may already be released by the browser.
		}
	}

	const resetBinding = createFormResetBinding(() => {
		const control = formControl();
		if (controlled()) {
			const current = String(value());
			setInitialNativeValue(control, current);
			if (control && control.value !== current) setNativeValue(control, current);
			return;
		}
		const initial = String(resetValue());
		setUncontrolledValue(resetValue());
		setInitialNativeValue(control, initial);
		if (control && control.value !== initial) setNativeValue(control, initial);
	});
	createEffect(() => {
		const [, , control] = [local.name, local.form, formControl()] as const;
		resetBinding.bind(control);
	});
	createRenderEffect(() => {
		const control = formControl();
		if (!control) return;
		const current = String(value());
		setInitialNativeValue(control, controlled() ? current : String(resetValue()));
		if (control.value !== current) setNativeValue(control, current);
	});
	onCleanup(() => resetBinding.cleanup());

	const context: SliderContextValue = { value, min, max, step, orientation, disabled, setValue };

	return (
		<SliderContext.Provider value={context}>
			<div
				{...rest}
				ref={(element) => {
					root = element;
				}}
				data-slot="slider"
				data-orientation={orientation()}
				data-disabled={disabled()}
				class={`${styles[sliderStyleKeys.root]} ${local.class ?? ''}`}
				onPointerDown={(event) => {
					invokeEventHandler(local.onPointerDown, event);
					if (event.defaultPrevented || disabled() || event.button !== 0 || !event.isPrimary) return;
					try {
						root?.setPointerCapture?.(event.pointerId);
					} catch {
						// Unsupported or detached targets still receive the initial update.
					}
					updateFromPointer(event);
				}}
				onPointerMove={(event) => {
					invokeEventHandler(local.onPointerMove, event);
					if (!event.defaultPrevented && !disabled() && hasCapture(event)) updateFromPointer(event);
				}}
				onPointerUp={(event) => {
					invokeEventHandler(local.onPointerUp, event);
					releaseCapture(event);
				}}
				onPointerCancel={(event) => {
					invokeEventHandler(local.onPointerCancel, event);
					releaseCapture(event);
				}}>
				{local.children}
				<input {...HIDDEN_FORM_CONTROL_PROPS} ref={setFormControl} type="hidden" name={local.name} form={local.form} disabled={disabled()} value={String(value())} />
			</div>
		</SliderContext.Provider>
	);
}

export interface SliderTrackProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function SliderTrack(props: ParentProps<SliderTrackProps>) {
	const context = useSlider();
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} data-slot="slider-track" data-orientation={context.orientation()} class={`${styles[sliderStyleKeys.track]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface SliderRangeProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function SliderRange(props: SliderRangeProps) {
	const context = useSlider();
	const [local, rest] = splitProps(props, ['class', 'style']);
	const internalStyle = () => {
		const percent = `${getSliderPercent(context.value(), context.min(), context.max())}%`;
		return context.orientation() === 'vertical' ? { top: 'auto', bottom: '0', height: percent } : { width: percent };
	};
	return (
		<div
			{...rest}
			data-slot="slider-range"
			data-orientation={context.orientation()}
			class={`${styles[sliderStyleKeys.range]} ${local.class ?? ''}`}
			style={
				typeof local.style === 'string'
					? context.orientation() === 'vertical'
						? `${local.style};top:auto;bottom:0;height:${getSliderPercent(context.value(), context.min(), context.max())}%`
						: `${local.style};width:${getSliderPercent(context.value(), context.min(), context.max())}%`
					: { ...local.style, ...internalStyle() }
			}
		/>
	);
}

export interface SliderThumbProps extends JSX.HTMLAttributes<HTMLSpanElement> {}

export function SliderThumb(props: ParentProps<SliderThumbProps>) {
	const context = useSlider();
	const [local, rest] = splitProps(props, ['class', 'children', 'style', 'onKeyDown', 'tabIndex']);
	const offset = () => {
		if (context.orientation() === 'vertical') return { top: `${100 - getSliderPercent(context.value(), context.min(), context.max())}%` };
		return getSliderOffsetStyle(context.value(), context.min(), context.max(), context.orientation());
	};

	return (
		<span
			{...rest}
			role="slider"
			tabIndex={context.disabled() ? -1 : (local.tabIndex ?? 0)}
			aria-disabled={context.disabled()}
			aria-valuemin={context.min()}
			aria-valuemax={context.max()}
			aria-valuenow={context.value()}
			aria-orientation={context.orientation()}
			data-slot="slider-thumb"
			data-orientation={context.orientation()}
			class={`${styles[sliderStyleKeys.thumb]} ${local.class ?? ''}`}
			style={
				typeof local.style === 'string'
					? `${local.style};${context.orientation() === 'vertical' ? 'top' : 'left'}:${Object.values(offset())[0]}`
					: { ...local.style, ...offset() }
			}
			onKeyDown={(event) => {
				invokeEventHandler(local.onKeyDown, event);
				if (event.defaultPrevented || context.disabled()) return;
				const pageStep = context.step() * 10;
				let next: number | undefined;
				switch (event.key) {
					case 'Home':
						next = context.min();
						break;
					case 'End':
						next = context.max();
						break;
					case 'ArrowRight':
					case 'ArrowUp':
						next = context.value() + context.step();
						break;
					case 'ArrowLeft':
					case 'ArrowDown':
						next = context.value() - context.step();
						break;
					case 'PageUp':
						next = context.value() + pageStep;
						break;
					case 'PageDown':
						next = context.value() - pageStep;
						break;
				}
				if (next !== undefined) {
					event.preventDefault();
					context.setValue(next);
				}
			}}>
			{local.children}
		</span>
	);
}

export default Slider;
