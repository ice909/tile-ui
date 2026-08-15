import {
	cloneVNode,
	computed,
	defineComponent,
	h,
	inject,
	nextTick,
	onBeforeUnmount,
	provide,
	ref,
	useId,
	watch,
	Teleport,
	type ComputedRef,
	type InjectionKey,
	type PropType,
} from 'vue';
import { drawerStyleKeys, getDrawerState, getDrawerTranslateStyle } from '@tile-ui/core';
import type { DrawerDirection } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/drawer.module.scss';

interface DrawerContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	close: () => void;
	direction: DrawerDirection;
	modal: boolean;
	titleId: string;
	descriptionId: string;
}

type DrawerContext = ComputedRef<DrawerContextValue>;

const DrawerContextKey: InjectionKey<DrawerContext> = Symbol('tile-drawer');

function composeEventHandlers(...handlers: Array<unknown>): (event: Event) => void {
	return (event: Event) => {
		for (const handler of handlers) {
			if (!handler) {
				continue;
			}

			const list = Array.isArray(handler) ? handler : [handler];

			for (const item of list) {
				if (typeof item === 'function') {
					item(event);
				}
			}
		}
	};
}

export const TDrawer = defineComponent({
	name: 'TDrawer',
	props: {
		direction: { type: String as PropType<DrawerDirection>, default: 'right' },
		modal: { type: Boolean, default: true },
		open: { type: Boolean, default: undefined },
		defaultOpen: { type: Boolean, default: false },
	},
	emits: ['update:open'],
	setup(props, { emit, slots }) {
		const internalOpen = ref(props.defaultOpen);
		const isOpen = computed(() => (props.open !== undefined ? props.open : internalOpen.value));
		const baseId = useId();
		const titleId = `${baseId}-title`;
		const descriptionId = `${baseId}-description`;

		function setOpen(next: boolean) {
			if (props.open === undefined) {
				internalOpen.value = next;
			}

			emit('update:open', next);
		}

		function close() {
			setOpen(false);
		}

		const context = computed<DrawerContextValue>(() => ({
			open: isOpen.value,
			setOpen,
			close,
			direction: props.direction,
			modal: props.modal,
			titleId,
			descriptionId,
		}));

		provide(DrawerContextKey, context);

		return () => slots.default?.();
	},
});

export const TDrawerTrigger = defineComponent({
	name: 'TDrawerTrigger',
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(DrawerContextKey);
		if (!contextValue) {
			throw new Error('TDrawerTrigger must be used within <TDrawer>.');
		}
		const context: DrawerContext = contextValue;

		function handleOpen() {
			context.value.setOpen(true);
		}

		return () => {
			const children = slots.default?.();
			const attrOnClick = (attrs as Record<string, unknown>).onClick;

			if (props.asChild) {
				const firstChild = Array.isArray(children) ? children[0] : children;

				if (firstChild) {
					const childProps = (firstChild.props ?? {}) as Record<string, unknown>;
					return cloneVNode(firstChild, {
						...attrs,
						onClick: composeEventHandlers(attrOnClick, childProps.onClick, handleOpen),
					});
				}
			}

			return h('button', { type: 'button', ...attrs, onClick: composeEventHandlers(attrOnClick, handleOpen) }, children);
		};
	},
});

export const TDrawerClose = defineComponent({
	name: 'TDrawerClose',
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(DrawerContextKey);
		if (!contextValue) {
			throw new Error('TDrawerClose must be used within <TDrawer>.');
		}
		const context: DrawerContext = contextValue;

		function handleClose() {
			context.value.close();
		}

		return () => {
			const children = slots.default?.();
			const attrOnClick = (attrs as Record<string, unknown>).onClick;

			if (props.asChild) {
				const firstChild = Array.isArray(children) ? children[0] : children;

				if (firstChild) {
					const childProps = (firstChild.props ?? {}) as Record<string, unknown>;
					return cloneVNode(firstChild, {
						...attrs,
						onClick: composeEventHandlers(attrOnClick, childProps.onClick, handleClose),
					});
				}
			}

			return h('button', { type: 'button', ...attrs, onClick: composeEventHandlers(attrOnClick, handleClose) }, children);
		};
	},
});

export const TDrawerOverlay = defineComponent({
	name: 'TDrawerOverlay',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(DrawerContextKey);
		if (!contextValue) {
			throw new Error('TDrawerOverlay must be used within <TDrawer>.');
		}
		const context: DrawerContext = contextValue;

		return () => {
			if (!context.value.open || !context.value.modal) {
				return null;
			}

			return h(
				'div',
				{
					...attrs,
					'data-state': getDrawerState(context.value.open),
					class: [styles[drawerStyleKeys.overlay], attrs.class],
					onClick: composeEventHandlers((attrs as Record<string, unknown>).onClick, () => context.value.close()),
				},
				slots.default?.(),
			);
		};
	},
});

export const TDrawerContent = defineComponent({
	name: 'TDrawerContent',
	props: {
		showCloseButton: { type: Boolean, default: true },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(DrawerContextKey);
		if (!contextValue) {
			throw new Error('TDrawerContent must be used within <TDrawer>.');
		}
		const context: DrawerContext = contextValue;
		const contentRef = ref<HTMLElement | null>(null);
		const previousOverflow = ref('');
		const isVisible = ref(false);
		let animationFrame = 0;
		let previouslyFocused: HTMLElement | null = null;

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape' && context.value.modal) {
				context.value.close();
			}
		}

		watch(
			() => context.value.open,
			(open) => {
				if (typeof document === 'undefined') {
					return;
				}

				if (open) {
					isVisible.value = false;
					previouslyFocused = document.activeElement as HTMLElement | null;
					previousOverflow.value = document.body.style.overflow;
					if (context.value.modal) {
						document.body.style.overflow = 'hidden';
					}
					document.addEventListener('keydown', handleKeyDown);
					animationFrame = requestAnimationFrame(() => {
						isVisible.value = true;
					});
					nextTick(() => {
						contentRef.value?.focus();
					});
				} else {
					cancelAnimationFrame(animationFrame);
					document.removeEventListener('keydown', handleKeyDown);
					document.body.style.overflow = previousOverflow.value;
					previouslyFocused?.focus();
				}
			},
			{ immediate: true },
		);

		onBeforeUnmount(() => {
			cancelAnimationFrame(animationFrame);
			document.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = previousOverflow.value;
			previouslyFocused?.focus();
		});

		return () => {
			if (!context.value.open) {
				return null;
			}

			const contentChildren: any[] = [h('div', { class: styles[drawerStyleKeys.handle] })];
			const slotChildren = slots.default?.() ?? [];
			for (const child of slotChildren) {
				contentChildren.push(child);
			}

			if (props.showCloseButton) {
				contentChildren.push(
					h(
						'button',
						{
							type: 'button',
							'aria-label': '关闭',
							class: styles[drawerStyleKeys.close],
							onClick: () => context.value.close(),
						},
						[
							h(
								'svg',
								{
									class: styles[drawerStyleKeys.xIcon],
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
								[h('path', { d: 'M18 6 6 18' }), h('path', { d: 'm6 6 12 12' })],
							),
						],
					),
				);
			}

			const userClass = attrs.class;
			const contentAttrs = { ...attrs };
			delete contentAttrs.class;

			return h(Teleport, { to: 'body' }, [
				context.value.modal
					? h('div', {
							'data-state': getDrawerState(context.value.open),
							class: styles[drawerStyleKeys.overlay],
							onClick: () => context.value.close(),
						})
					: null,
				h(
					'div',
					{
						...contentAttrs,
						ref: contentRef,
						role: 'dialog',
						'aria-modal': context.value.modal ? 'true' : 'false',
						'aria-labelledby': context.value.titleId,
						'aria-describedby': context.value.descriptionId,
						tabindex: -1,
						'data-state': getDrawerState(context.value.open),
						'data-direction': context.value.direction,
						style: {
							transform: isVisible.value ? undefined : getDrawerTranslateStyle(context.value.direction),
							opacity: isVisible.value ? undefined : 0,
						},
						class: [styles[drawerStyleKeys.content], userClass],
					},
					contentChildren,
				),
			]);
		};
	},
});

export const TDrawerHeader = defineComponent({
	name: 'TDrawerHeader',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[drawerStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const TDrawerFooter = defineComponent({
	name: 'TDrawerFooter',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[drawerStyleKeys.footer], attrs.class] }, slots.default?.());
	},
});

export const TDrawerTitle = defineComponent({
	name: 'TDrawerTitle',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(DrawerContextKey);
		if (!contextValue) {
			throw new Error('TDrawerTitle must be used within <TDrawer>.');
		}
		const context: DrawerContext = contextValue;

		return () => h('h2', { ...attrs, id: context.value.titleId, class: [styles[drawerStyleKeys.title], attrs.class] }, slots.default?.());
	},
});

export const TDrawerDescription = defineComponent({
	name: 'TDrawerDescription',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(DrawerContextKey);
		if (!contextValue) {
			throw new Error('TDrawerDescription must be used within <TDrawer>.');
		}
		const context: DrawerContext = contextValue;

		return () => h('p', { ...attrs, id: context.value.descriptionId, class: [styles[drawerStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export default TDrawer;
