import { cloneVNode, computed, defineComponent, h, inject, nextTick, onBeforeUnmount, provide, ref, useId, watch, Teleport, type ComputedRef, type InjectionKey } from 'vue';
import { dialogStyleKeys, getDialogState } from '@tile-ui/core';
import { Button } from '../button';
import styles from '@tile-ui/styles/scss/components/dialog.module.scss';

interface DialogContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	close: () => void;
	titleId: string;
	descriptionId: string;
}

type DialogContext = ComputedRef<DialogContextValue>;

const DialogContextKey: InjectionKey<DialogContext> = Symbol('tile-dialog');

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

export const Dialog = defineComponent({
	name: 'Dialog',
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

		const context = computed<DialogContextValue>(() => ({
			open: isOpen.value,
			setOpen,
			close,
			titleId,
			descriptionId,
		}));

		provide(DialogContextKey, context);

		return () => slots.default?.();
	},
});

export const DialogTrigger = defineComponent({
	name: 'DialogTrigger',
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(DialogContextKey);
		if (!contextValue) {
			throw new Error('DialogTrigger must be used within <Dialog>.');
		}
		const context: DialogContext = contextValue;

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

export const DialogClose = defineComponent({
	name: 'DialogClose',
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(DialogContextKey);
		if (!contextValue) {
			throw new Error('DialogClose must be used within <Dialog>.');
		}
		const context: DialogContext = contextValue;

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

export const DialogOverlay = defineComponent({
	name: 'DialogOverlay',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(DialogContextKey);
		if (!contextValue) {
			throw new Error('DialogOverlay must be used within <Dialog>.');
		}
		const context: DialogContext = contextValue;

		return () => {
			if (!context.value.open) {
				return null;
			}

			return h(
				'div',
				{
					...attrs,
					'data-state': getDialogState(context.value.open),
					class: [styles[dialogStyleKeys.overlay], attrs.class],
					onClick: composeEventHandlers((attrs as Record<string, unknown>).onClick, () => context.value.close()),
				},
				slots.default?.(),
			);
		};
	},
});

export const DialogContent = defineComponent({
	name: 'DialogContent',
	props: {
		showCloseButton: { type: Boolean, default: true },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(DialogContextKey);
		if (!contextValue) {
			throw new Error('DialogContent must be used within <Dialog>.');
		}
		const context: DialogContext = contextValue;
		const contentRef = ref<HTMLElement | null>(null);
		const previousOverflow = ref('');
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
					previouslyFocused = document.activeElement as HTMLElement | null;
					previousOverflow.value = document.body.style.overflow;
					document.body.style.overflow = 'hidden';
					document.addEventListener('keydown', handleKeyDown);
					nextTick(() => {
						contentRef.value?.focus();
					});
				} else {
					document.removeEventListener('keydown', handleKeyDown);
					document.body.style.overflow = previousOverflow.value;
					previouslyFocused?.focus();
				}
			},
			{ immediate: true },
		);

		onBeforeUnmount(() => {
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
							class: styles[dialogStyleKeys.close],
							onClick: () => context.value.close(),
						},
						[
							h(
								'svg',
								{
									class: styles[dialogStyleKeys.xIcon],
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
					'data-state': getDialogState(context.value.open),
					class: styles[dialogStyleKeys.overlay],
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
						'data-state': getDialogState(context.value.open),
						class: [styles[dialogStyleKeys.content], userClass],
					},
					contentChildren,
				),
			]);
		};
	},
});

export const DialogHeader = defineComponent({
	name: 'DialogHeader',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[dialogStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const DialogFooter = defineComponent({
	name: 'DialogFooter',
	props: {
		showCloseButton: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(DialogContextKey);
		if (!contextValue) {
			throw new Error('DialogFooter must be used within <Dialog>.');
		}
		const context: DialogContext = contextValue;

		return () => {
			const footerChildren = [...(slots.default?.() ?? [])];

			if (props.showCloseButton) {
				footerChildren.push(h(Button, { type: 'button', variant: 'outline', onClick: () => context.value.close() }, { default: () => 'Close' }));
			}

			return h('div', { ...attrs, class: [styles[dialogStyleKeys.footer], attrs.class] }, footerChildren);
		};
	},
});

export const DialogTitle = defineComponent({
	name: 'DialogTitle',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(DialogContextKey);
		if (!contextValue) {
			throw new Error('DialogTitle must be used within <Dialog>.');
		}
		const context: DialogContext = contextValue;

		return () => h('h2', { ...attrs, id: context.value.titleId, class: [styles[dialogStyleKeys.title], attrs.class] }, slots.default?.());
	},
});

export const DialogDescription = defineComponent({
	name: 'DialogDescription',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(DialogContextKey);
		if (!contextValue) {
			throw new Error('DialogDescription must be used within <Dialog>.');
		}
		const context: DialogContext = contextValue;

		return () => h('p', { ...attrs, id: context.value.descriptionId, class: [styles[dialogStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export default Dialog;
