import { computed, defineComponent, h, inject, provide, ref, type ComputedRef, type InjectionKey, type PropType } from 'vue';
import { clampSliderValue, getSliderOffsetStyle, getSliderPercent, sliderStyleKeys } from '@tile-ui/core';
import type { SliderOrientation } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/slider.module.scss';

interface SliderContextValue {
	value: number;
	min: number;
	max: number;
	step: number;
	orientation: SliderOrientation;
	disabled: boolean;
	setValue: (value: number) => void;
}

type SliderContext = ComputedRef<SliderContextValue>;

const SliderContextKey: InjectionKey<SliderContext> = Symbol('tile-slider');

export const TSlider = defineComponent({
	name: 'TSlider',
	props: {
		modelValue: { type: Number, default: undefined },
		defaultValue: { type: Number, default: 0 },
		min: { type: Number, default: 0 },
		max: { type: Number, default: 100 },
		step: { type: Number, default: 1 },
		orientation: {
			type: String as PropType<SliderOrientation>,
			default: 'horizontal',
		},
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, slots }) {
		const internalValue = ref(props.defaultValue);
		const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : internalValue.value));
		const clampedValue = computed(() => clampSliderValue(currentValue.value, props.min, props.max));

		function setValue(next: number) {
			if (props.disabled) {
				return;
			}
			const clamped = clampSliderValue(next, props.min, props.max);
			const stepped = clampSliderValue(props.min + Math.round((clamped - props.min) / props.step) * props.step, props.min, props.max);
			if (props.modelValue === undefined) {
				internalValue.value = stepped;
			}
			emit('update:modelValue', stepped);
			emit('change', stepped);
		}

		function updateFromEvent(event: PointerEvent, element: HTMLElement) {
			const rect = element.getBoundingClientRect();
			let next: number;
			if (props.orientation === 'vertical') {
				next = props.min + ((event.clientY - rect.top) / rect.height) * (props.max - props.min);
			} else {
				next = props.min + ((event.clientX - rect.left) / rect.width) * (props.max - props.min);
			}
			setValue(next);
		}

		function handlePointerdown(event: PointerEvent) {
			if (props.disabled) {
				return;
			}
			const current = event.currentTarget as HTMLElement;
			current.setPointerCapture(event.pointerId);
			updateFromEvent(event, current);
		}

		function handlePointermove(event: PointerEvent) {
			if (props.disabled) {
				return;
			}
			const current = event.currentTarget as HTMLElement;
			if (!current.hasPointerCapture(event.pointerId)) {
				return;
			}
			updateFromEvent(event, current);
		}

		const context = computed<SliderContextValue>(() => ({
			value: clampedValue.value,
			min: props.min,
			max: props.max,
			step: props.step,
			orientation: props.orientation,
			disabled: props.disabled,
			setValue,
		}));

		provide(SliderContextKey, context);

		return () =>
			h(
				'div',
				{
					class: styles[sliderStyleKeys.root],
					'data-orientation': props.orientation,
					'data-disabled': props.disabled,
					onPointerdown: handlePointerdown,
					onPointermove: handlePointermove,
				},
				slots.default?.(),
			);
	},
});

export const TSliderTrack = defineComponent({
	name: 'TSliderTrack',
	setup(_props, { slots }) {
		const context = inject(SliderContextKey);
		if (!context) {
			throw new Error('TSliderTrack must be used within <TSlider>.');
		}

		return () => h('div', { class: styles[sliderStyleKeys.track], 'data-orientation': context.value.orientation }, slots.default?.());
	},
});

export const TSliderRange = defineComponent({
	name: 'TSliderRange',
	setup(_props) {
		const context = inject(SliderContextKey);
		if (!context) {
			throw new Error('TSliderRange must be used within <TSlider>.');
		}

		return () => {
			const percent = getSliderPercent(context.value.value, context.value.min, context.value.max);
			const style = context.value.orientation === 'vertical' ? { height: `${percent}%` } : { width: `${percent}%` };
			return h('div', { class: styles[sliderStyleKeys.range], 'data-orientation': context.value.orientation, style });
		};
	},
});

export const TSliderThumb = defineComponent({
	name: 'TSliderThumb',
	setup(_props) {
		const contextValue = inject(SliderContextKey);
		if (!contextValue) {
			throw new Error('TSliderThumb must be used within <TSlider>.');
		}
		const context: SliderContext = contextValue;

		function handleKeydown(event: KeyboardEvent) {
			const { value, min, max, step, orientation } = context.value;

			if (event.key === 'Home') {
				context.value.setValue(min);
				event.preventDefault();
				return;
			}

			if (event.key === 'End') {
				context.value.setValue(max);
				event.preventDefault();
				return;
			}

			let delta = 0;
			if (orientation === 'horizontal') {
				if (event.key === 'ArrowRight') {
					delta = 1;
				} else if (event.key === 'ArrowLeft') {
					delta = -1;
				}
			} else if (event.key === 'ArrowDown') {
				delta = 1;
			} else if (event.key === 'ArrowUp') {
				delta = -1;
			}

			if (delta !== 0) {
				context.value.setValue(value + delta * step);
				event.preventDefault();
			}
		}

		return () =>
			h('span', {
				role: 'slider',
				tabindex: context.value.disabled ? -1 : 0,
				'aria-disabled': context.value.disabled,
				'aria-valuemin': context.value.min,
				'aria-valuemax': context.value.max,
				'aria-valuenow': context.value.value,
				'aria-orientation': context.value.orientation,
				'data-orientation': context.value.orientation,
				class: styles[sliderStyleKeys.thumb],
				style: getSliderOffsetStyle(context.value.value, context.value.min, context.value.max, context.value.orientation),
				onKeydown: handleKeydown,
			});
	},
});

export default TSlider;
