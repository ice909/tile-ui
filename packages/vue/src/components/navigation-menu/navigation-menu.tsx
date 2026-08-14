import { computed, defineComponent, h, inject, nextTick, onMounted, provide, ref, watch, Teleport, type ComputedRef, type InjectionKey, type Ref } from 'vue';
import { getNavigationMenuActiveState, getNavigationMenuState, navigationMenuStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/navigation-menu.module.scss';

interface NavigationMenuContextValue {
	activeValue: string | undefined;
	setActiveValue: (value: string | undefined) => void;
	viewportEnabled: boolean;
	viewportRef: Ref<HTMLDivElement | null>;
	setIndicatorRect: (rect: { left: number; width: number } | null) => void;
	indicatorRect: { left: number; width: number } | null;
}

type NavigationMenuContext = ComputedRef<NavigationMenuContextValue>;

const NavigationMenuContextKey: InjectionKey<NavigationMenuContext> = Symbol('tile-navigation-menu');

interface NavigationMenuItemContextValue {
	value: string;
	isActive: boolean;
	triggerRef: Ref<HTMLButtonElement | null>;
}

type NavigationMenuItemContext = ComputedRef<NavigationMenuItemContextValue>;

const NavigationMenuItemContextKey: InjectionKey<NavigationMenuItemContext> = Symbol('tile-navigation-menu-item');

function useNavigationMenuContext(): NavigationMenuContext {
	const context = inject(NavigationMenuContextKey);
	if (!context) {
		throw new Error('TNavigationMenu 子组件必须位于 <TNavigationMenu> 内部。');
	}
	return context;
}

function useNavigationMenuItemContext(): NavigationMenuItemContext {
	const context = inject(NavigationMenuItemContextKey);
	if (!context) {
		throw new Error('TNavigationMenu 触发器/内容必须位于 <TNavigationMenuItem> 内部。');
	}
	return context;
}

function navigationMenuChevronIcon() {
	return h(
		'svg',
		{
			class: styles[navigationMenuStyleKeys.chevron],
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
		[h('path', { d: 'm6 9 6 6 6-6' })],
	);
}

export const TNavigationMenu = defineComponent({
	name: 'TNavigationMenu',
	props: {
		viewport: { type: Boolean, default: true },
		value: { type: String, default: undefined },
		defaultValue: { type: String, default: undefined },
	},
	emits: ['update:value'],
	setup(props, { emit, slots, attrs }) {
		const internalValue = ref(props.defaultValue);
		const activeValue = computed(() => (props.value !== undefined ? props.value : internalValue.value));
		const viewportRef = ref<HTMLDivElement | null>(null);
		const indicatorRect = ref<{ left: number; width: number } | null>(null);

		function setActiveValue(next: string | undefined) {
			if (props.value === undefined) {
				internalValue.value = next;
			}
			emit('update:value', next);
		}

		function setIndicatorRect(next: { left: number; width: number } | null) {
			indicatorRect.value = next;
		}

		const context = computed<NavigationMenuContextValue>(() => ({
			activeValue: activeValue.value,
			setActiveValue,
			viewportEnabled: props.viewport,
			viewportRef,
			setIndicatorRect,
			indicatorRect: indicatorRect.value,
		}));

		provide(NavigationMenuContextKey, context);

		return () => h('nav', { ...attrs, class: [styles[navigationMenuStyleKeys.root], attrs.class] }, slots.default?.());
	},
});

export const TNavigationMenuList = defineComponent({
	name: 'TNavigationMenuList',
	setup(_props, { slots, attrs }) {
		return () => h('ul', { ...attrs, class: [styles[navigationMenuStyleKeys.list], attrs.class] }, slots.default?.());
	},
});

export const TNavigationMenuItem = defineComponent({
	name: 'TNavigationMenuItem',
	props: {
		value: { type: String, required: true },
	},
	setup(props, { slots, attrs }) {
		const context = useNavigationMenuContext();
		const triggerRef = ref<HTMLButtonElement | null>(null);
		const isActive = computed(() => context.value.activeValue === props.value);

		const itemContext = computed<NavigationMenuItemContextValue>(() => ({ value: props.value, isActive: isActive.value, triggerRef }));

		provide(NavigationMenuItemContextKey, itemContext);

		return () => h('li', { ...attrs, class: [styles[navigationMenuStyleKeys.item], attrs.class] }, slots.default?.());
	},
});

export const TNavigationMenuTrigger = defineComponent({
	name: 'TNavigationMenuTrigger',
	inheritAttrs: false,
	setup(_props, { slots, attrs }) {
		const context = useNavigationMenuContext();
		const item = useNavigationMenuItemContext();

		function handleClick() {
			context.value.setActiveValue(item.value.isActive ? undefined : item.value.value);
		}

		function handleMouseEnter() {
			context.value.setActiveValue(item.value.value);
		}

		onMounted(() => {
			if (item.value.isActive) {
				nextTick(() => {
					const trigger = item.value.triggerRef.value;
					if (!trigger) {
						return;
					}
					const root = trigger.closest('nav');
					const rootRect = root?.getBoundingClientRect();
					const triggerRect = trigger.getBoundingClientRect();
					if (!rootRect) {
						return;
					}
					context.value.setIndicatorRect({ left: triggerRect.left - rootRect.left, width: triggerRect.width });
				});
			}
		});

		watch(
			() => item.value.isActive,
			(isActive) => {
				if (isActive) {
					nextTick(() => {
						const trigger = item.value.triggerRef.value;
						if (!trigger) {
							return;
						}
						const root = trigger.closest('nav');
						const rootRect = root?.getBoundingClientRect();
						const triggerRect = trigger.getBoundingClientRect();
						if (!rootRect) {
							return;
						}
						context.value.setIndicatorRect({ left: triggerRect.left - rootRect.left, width: triggerRect.width });
					});
				}
			},
		);

		return () =>
			h(
				'button',
				{
					...attrs,
					ref: item.value.triggerRef,
					type: 'button',
					'aria-expanded': item.value.isActive,
					'data-state': getNavigationMenuState(item.value.isActive),
					class: [styles[navigationMenuStyleKeys.trigger], attrs.class],
					onClick: handleClick,
					onMouseenter: handleMouseEnter,
				},
				[...(slots.default?.() ?? []), navigationMenuChevronIcon()],
			);
	},
});

export const TNavigationMenuContent = defineComponent({
	name: 'TNavigationMenuContent',
	inheritAttrs: false,
	setup(_props, { slots, attrs }) {
		const context = useNavigationMenuContext();
		const item = useNavigationMenuItemContext();

		return () => {
			const isActive = item.value.isActive;
			const content = h(
				'div',
				{
					...attrs,
					'data-state': getNavigationMenuState(isActive),
					'data-viewport': context.value.viewportEnabled,
					class: [styles[navigationMenuStyleKeys.content], attrs.class],
				},
				slots.default?.(),
			);

			if (!context.value.viewportEnabled) {
				return isActive ? content : null;
			}

			if (!context.value.viewportRef.value) {
				return null;
			}

			return isActive ? h(Teleport, { to: context.value.viewportRef.value }, [content]) : null;
		};
	},
});

export const TNavigationMenuViewport = defineComponent({
	name: 'TNavigationMenuViewport',
	inheritAttrs: false,
	setup(_props, { slots, attrs }) {
		const context = useNavigationMenuContext();

		return () =>
			h('div', { ...attrs, 'data-state': getNavigationMenuState(context.value.activeValue !== undefined), class: [styles[navigationMenuStyleKeys.viewport], attrs.class] }, [
				h('div', { ref: context.value.viewportRef, class: styles[navigationMenuStyleKeys.viewportInner] }, slots.default?.()),
			]);
	},
});

export const TNavigationMenuIndicator = defineComponent({
	name: 'TNavigationMenuIndicator',
	inheritAttrs: false,
	setup(_props, { attrs }) {
		const context = useNavigationMenuContext();

		return () => {
			const visible = context.value.indicatorRect !== null;
			const indicatorStyle = context.value.indicatorRect ? { left: `${context.value.indicatorRect.left}px`, width: `${context.value.indicatorRect.width}px` } : undefined;

			return h(
				'div',
				{
					...attrs,
					'data-state': visible ? 'visible' : 'hidden',
					class: [styles[navigationMenuStyleKeys.indicator], attrs.class],
					style: indicatorStyle,
				},
				[h('div', { class: styles[navigationMenuStyleKeys.indicatorArrow] })],
			);
		};
	},
});

export const TNavigationMenuLink = defineComponent({
	name: 'TNavigationMenuLink',
	inheritAttrs: false,
	props: {
		active: { type: Boolean, default: false },
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		return () => {
			if (props.asChild) {
				const child = slots.default?.()[0];
				if (child) {
					const childProps = (child.props ?? {}) as Record<string, unknown>;
					return h(child, { ...childProps, 'data-active': getNavigationMenuActiveState(props.active) });
				}
			}

			return h('a', { ...attrs, 'data-active': getNavigationMenuActiveState(props.active), class: [styles[navigationMenuStyleKeys.link], attrs.class] }, slots.default?.());
		};
	},
});

export default TNavigationMenu;
