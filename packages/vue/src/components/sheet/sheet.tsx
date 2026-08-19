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
import { getSheetState, getSheetTranslateStyle, sheetStyleKeys } from '@tile-ui/core';
import type { SheetSide } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/sheet.module.scss';

interface SheetContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	close: () => void;
	titleId: string;
	descriptionId: string;
}

type SheetContext = ComputedRef<SheetContextValue>;

const SheetContextKey: InjectionKey<SheetContext> = Symbol('tile-sheet');

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

export const Sheet = defineComponent({
	name: 'Sheet',
	props: {
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

		const context = computed<SheetContextValue>(() => ({
			open: isOpen.value,
			setOpen,
			close,
			titleId,
			descriptionId,
		}));

		provide(SheetContextKey, context);

		return () => slots.default?.();
	},
});

export const SheetTrigger = defineComponent({
	name: 'SheetTrigger',
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(SheetContextKey);
		if (!contextValue) {
			throw new Error('SheetTrigger must be used within <Sheet>.');
		}
		const context: SheetContext = contextValue;

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

export const SheetClose = defineComponent({
	name: 'SheetClose',
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(SheetContextKey);
		if (!contextValue) {
			throw new Error('SheetClose must be used within <Sheet>.');
		}
		const context: SheetContext = contextValue;

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

export const SheetOverlay = defineComponent({
	name: 'SheetOverlay',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(SheetContextKey);
		if (!contextValue) {
			throw new Error('SheetOverlay must be used within <Sheet>.');
		}
		const context: SheetContext = contextValue;

		return () => {
			if (!context.value.open) {
				return null;
			}

			return h(
				'div',
				{
					...attrs,
					'data-state': getSheetState(context.value.open),
					class: [styles[sheetStyleKeys.overlay], attrs.class],
					onClick: composeEventHandlers((attrs as Record<string, unknown>).onClick, () => context.value.close()),
				},
				slots.default?.(),
			);
		};
	},
});

export const SheetContent = defineComponent({
	name: 'SheetContent',
	props: {
		side: {
			type: String as PropType<SheetSide>,
			default: 'right',
		},
		showCloseButton: { type: Boolean, default: true },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(SheetContextKey);
		if (!contextValue) {
			throw new Error('SheetContent must be used within <Sheet>.');
		}
		const context: SheetContext = contextValue;
		const contentRef = ref<HTMLElement | null>(null);
		const previousOverflow = ref('');
		const isVisible = ref(false);
		let animationFrame = 0;
		let previouslyFocused: HTMLElement | null = null;

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				context.value.close();
				return;
			}

			if (event.key === 'Tab') {
				const container = contentRef.value;
				if (!container) {
					return;
				}
				const focusables = Array.from(
					container.querySelectorAll<HTMLElement>(
						'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
					),
				).filter((el) => el.getClientRects().length > 0);
				if (focusables.length === 0) {
					event.preventDefault();
					return;
				}
				const first = focusables[0];
				const last = focusables[focusables.length - 1];
				const active = document.activeElement;

				if (event.shiftKey) {
					if (active === first || active === container || !container.contains(active)) {
						event.preventDefault();
						last.focus();
					}
				} else if (active === last || !container.contains(active)) {
					event.preventDefault();
					first.focus();
				}
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
					document.body.style.overflow = 'hidden';
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

			const contentChildren: any[] = slots.default?.() ?? [];

			if (props.showCloseButton) {
				contentChildren.push(
					h(
						'button',
						{
							type: 'button',
							'aria-label': '关闭',
							class: styles[sheetStyleKeys.close],
							onClick: () => context.value.close(),
						},
						[
							h(
								'svg',
								{
									class: styles[sheetStyleKeys.xIcon],
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
				h('div', {
					'data-state': getSheetState(context.value.open),
					class: styles[sheetStyleKeys.overlay],
					onClick: () => context.value.close(),
				}),
				h(
					'div',
					{
						...contentAttrs,
						ref: contentRef,
						role: 'dialog',
						'aria-modal': 'true',
						'aria-labelledby': context.value.titleId,
						'aria-describedby': context.value.descriptionId,
						tabindex: -1,
						'data-state': getSheetState(context.value.open),
						'data-side': props.side,
						style: {
							transform: isVisible.value ? undefined : getSheetTranslateStyle(props.side),
							opacity: isVisible.value ? undefined : 0,
						},
						class: [styles[sheetStyleKeys.content], userClass],
					},
					contentChildren,
				),
			]);
		};
	},
});

export const SheetHeader = defineComponent({
	name: 'SheetHeader',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[sheetStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const SheetFooter = defineComponent({
	name: 'SheetFooter',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[sheetStyleKeys.footer], attrs.class] }, slots.default?.());
	},
});

export const SheetTitle = defineComponent({
	name: 'SheetTitle',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(SheetContextKey);
		if (!contextValue) {
			throw new Error('SheetTitle must be used within <Sheet>.');
		}
		const context: SheetContext = contextValue;

		return () => h('h2', { ...attrs, id: context.value.titleId, class: [styles[sheetStyleKeys.title], attrs.class] }, slots.default?.());
	},
});

export const SheetDescription = defineComponent({
	name: 'SheetDescription',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(SheetContextKey);
		if (!contextValue) {
			throw new Error('SheetDescription must be used within <Sheet>.');
		}
		const context: SheetContext = contextValue;

		return () => h('p', { ...attrs, id: context.value.descriptionId, class: [styles[sheetStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export default Sheet;
