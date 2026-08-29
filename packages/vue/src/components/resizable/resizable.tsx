import { computed, defineComponent, h, inject, provide, ref, watch, type InjectionKey, type PropType, type Ref } from 'vue';
import { computeResizableSizes, getResizableDirectionCursor, getResizableStorageKey, resizableStyleKeys } from '@tile-ui/core';
import type { ResizableDirection } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/resizable.module.scss';

interface ResizableContextValue {
	direction: Ref<ResizableDirection>;
	containerRef: Ref<HTMLElement | null>;
	getSize: (index: number) => number;
	registerPanel: () => number;
	registerHandle: () => number;
	resize: (index: number, delta: number) => void;
}

const ResizableContextKey: InjectionKey<ResizableContextValue> = Symbol('tile-resizable');

function useResizable(): ResizableContextValue {
	const context = inject(ResizableContextKey);
	if (!context) {
		throw new Error('可调整尺寸子组件必须在 <ResizablePanelGroup> 内使用');
	}
	return context;
}

function readStoredSizes(id?: string): number[] {
	if (!id || typeof window === 'undefined') {
		return [];
	}
	const stored = window.localStorage.getItem(getResizableStorageKey(id));
	if (!stored) {
		return [];
	}
	try {
		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed.map((item: unknown) => Number(item)) : [];
	} catch {
		return [];
	}
}

function renderGripIcon() {
	return h(
		'svg',
		{
			xmlns: 'http://www.w3.org/2000/svg',
			width: '16',
			height: '16',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			'aria-hidden': 'true',
		},
		[
			h('circle', { cx: '9', cy: '12', r: '1' }),
			h('circle', { cx: '15', cy: '12', r: '1' }),
			h('circle', { cx: '9', cy: '5', r: '1' }),
			h('circle', { cx: '15', cy: '5', r: '1' }),
			h('circle', { cx: '9', cy: '19', r: '1' }),
			h('circle', { cx: '15', cy: '19', r: '1' }),
		],
	);
}

export const ResizablePanelGroup = defineComponent({
	name: 'ResizablePanelGroup',
	props: {
		direction: { type: String as PropType<ResizableDirection>, default: 'horizontal' },
		id: String,
	},
	setup(props, { slots, attrs }) {
		const containerRef = ref<HTMLElement | null>(null);
		const sizes = ref<number[]>(readStoredSizes(props.id));
		const panelCount = ref(0);

		watch(
			sizes,
			(value) => {
				if (props.id && value.length > 0) {
					window.localStorage.setItem(getResizableStorageKey(props.id), JSON.stringify(value));
				}
			},
			{ deep: true },
		);

		function registerPanel() {
			const index = panelCount.value;
			panelCount.value += 1;
			return index;
		}

		function registerHandle() {
			return Math.max(0, panelCount.value - 1);
		}

		function getSize(index: number) {
			return sizes.value[index] ?? 100 / Math.max(panelCount.value, 1);
		}

		function resize(index: number, delta: number) {
			const total = Math.max(panelCount.value, 2);
			const current = Array.from({ length: total }, (_item, itemIndex) => sizes.value[itemIndex] ?? 100 / total);
			sizes.value = computeResizableSizes(current, index, delta);
		}

		const direction = computed(() => props.direction);

		provide(ResizableContextKey, { direction, containerRef, getSize, registerPanel, registerHandle, resize });

		return () =>
			h(
				'div',
				{
					...attrs,
					ref: containerRef,
					'data-slot': 'resizable-panel-group',
					'data-direction': props.direction,
					class: [styles[resizableStyleKeys.group], attrs.class],
				},
				slots.default?.(),
			);
	},
});

export const ResizablePanel = defineComponent({
	name: 'ResizablePanel',
	setup(_props, { slots, attrs }) {
		const { getSize, registerPanel } = useResizable();
		const index = registerPanel();
		const size = computed(() => getSize(index));

		return () =>
			h(
				'div',
				{
					...attrs,
					'data-slot': 'resizable-panel',
					class: [styles[resizableStyleKeys.panel], attrs.class],
					style: [{ flex: `0 0 ${size.value}%` }, attrs.style],
				},
				slots.default?.(),
			);
	},
});

export const ResizableHandle = defineComponent({
	name: 'ResizableHandle',
	props: {
		withHandle: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const { direction, containerRef, registerHandle, resize } = useResizable();
		const index = registerHandle();
		const dragging = ref(false);

		function handlePointerDown(event: PointerEvent) {
			if (index < 0) {
				return;
			}
			event.preventDefault();
			const container = containerRef.value;
			if (!container) {
				return;
			}
			const dir = direction.value;
			const rect = container.getBoundingClientRect();
			const total = dir === 'horizontal' ? rect.width : rect.height;
			const startCoord = dir === 'horizontal' ? event.clientX : event.clientY;
			let lastDeltaPercent = 0;

			dragging.value = true;
			document.body.style.cursor = getResizableDirectionCursor(dir);

			function handlePointerMove(moveEvent: PointerEvent) {
				const coord = dir === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
				const deltaPercent = total > 0 ? ((coord - startCoord) / total) * 100 : 0;
				const step = deltaPercent - lastDeltaPercent;
				resize(index, step);
				lastDeltaPercent = deltaPercent;
			}

			function handlePointerUp() {
				dragging.value = false;
				document.body.style.cursor = '';
				window.removeEventListener('pointermove', handlePointerMove);
				window.removeEventListener('pointerup', handlePointerUp);
			}

			window.addEventListener('pointermove', handlePointerMove);
			window.addEventListener('pointerup', handlePointerUp);
		}

		return () =>
			h(
				'div',
				{
					...attrs,
					role: 'separator',
					'aria-orientation': direction.value === 'horizontal' ? 'vertical' : 'horizontal',
					'data-slot': 'resizable-handle',
					'data-active': dragging.value ? 'true' : 'false',
					class: [styles[resizableStyleKeys.handle], attrs.class],
					onPointerdown: handlePointerDown,
				},
				[slots.default?.(), props.withHandle ? h('div', { class: styles[resizableStyleKeys.handleBar] }, [renderGripIcon()]) : null],
			);
	},
});

export default ResizablePanelGroup;
