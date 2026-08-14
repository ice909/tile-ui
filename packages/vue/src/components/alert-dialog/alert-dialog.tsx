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
	watch,
	Teleport,
	type ComputedRef,
	type InjectionKey,
	type PropType,
} from 'vue';
import type { ButtonSize, ButtonVariant } from '@tile-ui/core';
import { alertDialogStyleKeys, getAlertDialogState } from '@tile-ui/core';
import type { AlertDialogSize } from '@tile-ui/core';
import { TButton } from '../button';
import styles from '@tile-ui/styles/scss/components/alert-dialog.module.scss';

interface AlertDialogContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	close: () => void;
	titleId: string;
	descriptionId: string;
}

type AlertDialogContext = ComputedRef<AlertDialogContextValue>;

const AlertDialogContextKey: InjectionKey<AlertDialogContext> = Symbol('tile-alert-dialog');

let alertDialogCounter = 0;

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

export const TAlertDialog = defineComponent({
	name: 'TAlertDialog',
	props: {
		open: Boolean,
		defaultOpen: { type: Boolean, default: false },
	},
	emits: ['update:open'],
	setup(props, { emit, slots }) {
		const internalOpen = ref(props.defaultOpen);
		const isOpen = computed(() => (props.open !== undefined ? props.open : internalOpen.value));
		const titleId = `tile-alert-dialog-title-${++alertDialogCounter}`;
		const descriptionId = `tile-alert-dialog-description-${++alertDialogCounter}`;

		function setOpen(next: boolean) {
			if (props.open === undefined) {
				internalOpen.value = next;
			}

			emit('update:open', next);
		}

		function close() {
			setOpen(false);
		}

		const context = computed<AlertDialogContextValue>(() => ({
			open: isOpen.value,
			setOpen,
			close,
			titleId,
			descriptionId,
		}));

		provide(AlertDialogContextKey, context);

		return () => slots.default?.();
	},
});

export const TAlertDialogTrigger = defineComponent({
	name: 'TAlertDialogTrigger',
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(AlertDialogContextKey);
		if (!contextValue) {
			throw new Error('TAlertDialogTrigger must be used within <TAlertDialog>.');
		}
		const context: AlertDialogContext = contextValue;

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

export const TAlertDialogOverlay = defineComponent({
	name: 'TAlertDialogOverlay',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(AlertDialogContextKey);
		if (!contextValue) {
			throw new Error('TAlertDialogOverlay must be used within <TAlertDialog>.');
		}
		const context: AlertDialogContext = contextValue;

		return () => {
			if (!context.value.open) {
				return null;
			}

			return h(
				'div',
				{
					...attrs,
					'data-state': getAlertDialogState(context.value.open),
					class: [styles[alertDialogStyleKeys.overlay], attrs.class],
					onClick: composeEventHandlers((attrs as Record<string, unknown>).onClick, () => context.value.close()),
				},
				slots.default?.(),
			);
		};
	},
});

export const TAlertDialogContent = defineComponent({
	name: 'TAlertDialogContent',
	props: {
		size: {
			type: String as PropType<AlertDialogSize>,
			default: 'default',
		},
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(AlertDialogContextKey);
		if (!contextValue) {
			throw new Error('TAlertDialogContent must be used within <TAlertDialog>.');
		}
		const context: AlertDialogContext = contextValue;
		const contentRef = ref<HTMLElement | null>(null);
		const previousOverflow = ref('');
		let previouslyFocused: HTMLElement | null = null;

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
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

			const userClass = attrs.class;
			const contentAttrs = { ...attrs };
			delete contentAttrs.class;

			return h(Teleport, { to: 'body' }, [
				h('div', {
					'data-state': getAlertDialogState(context.value.open),
					class: styles[alertDialogStyleKeys.overlay],
					onClick: () => context.value.close(),
				}),
				h(
					'div',
					{
						...contentAttrs,
						ref: contentRef,
						role: 'alertdialog',
						'aria-modal': 'true',
						'aria-labelledby': context.value.titleId,
						'aria-describedby': context.value.descriptionId,
						tabindex: -1,
						'data-state': getAlertDialogState(context.value.open),
						'data-size': props.size,
						class: [styles[alertDialogStyleKeys.content], userClass],
					},
					slots.default?.(),
				),
			]);
		};
	},
});

export const TAlertDialogHeader = defineComponent({
	name: 'TAlertDialogHeader',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[alertDialogStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const TAlertDialogFooter = defineComponent({
	name: 'TAlertDialogFooter',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[alertDialogStyleKeys.footer], attrs.class] }, slots.default?.());
	},
});

export const TAlertDialogTitle = defineComponent({
	name: 'TAlertDialogTitle',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(AlertDialogContextKey);
		if (!contextValue) {
			throw new Error('TAlertDialogTitle must be used within <TAlertDialog>.');
		}
		const context: AlertDialogContext = contextValue;

		return () => h('h2', { ...attrs, id: context.value.titleId, class: [styles[alertDialogStyleKeys.title], attrs.class] }, slots.default?.());
	},
});

export const TAlertDialogDescription = defineComponent({
	name: 'TAlertDialogDescription',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(AlertDialogContextKey);
		if (!contextValue) {
			throw new Error('TAlertDialogDescription must be used within <TAlertDialog>.');
		}
		const context: AlertDialogContext = contextValue;

		return () => h('p', { ...attrs, id: context.value.descriptionId, class: [styles[alertDialogStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export const TAlertDialogAction = defineComponent({
	name: 'TAlertDialogAction',
	props: {
		variant: {
			type: String as PropType<ButtonVariant>,
			default: 'default',
		},
		size: {
			type: String as PropType<ButtonSize>,
			default: 'default',
		},
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(AlertDialogContextKey);
		if (!contextValue) {
			throw new Error('TAlertDialogAction must be used within <TAlertDialog>.');
		}
		const context: AlertDialogContext = contextValue;

		function handleAction() {
			context.value.close();
		}

		return () =>
			h(
				TButton,
				{
					...attrs,
					type: 'button',
					variant: props.variant,
					size: props.size,
					onClick: composeEventHandlers((attrs as Record<string, unknown>).onClick, handleAction),
				},
				{ default: () => slots.default?.() },
			);
	},
});

export const TAlertDialogCancel = defineComponent({
	name: 'TAlertDialogCancel',
	props: {
		variant: {
			type: String as PropType<ButtonVariant>,
			default: 'outline',
		},
		size: {
			type: String as PropType<ButtonSize>,
			default: 'default',
		},
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(AlertDialogContextKey);
		if (!contextValue) {
			throw new Error('TAlertDialogCancel must be used within <TAlertDialog>.');
		}
		const context: AlertDialogContext = contextValue;

		function handleCancel() {
			context.value.close();
		}

		return () =>
			h(
				TButton,
				{
					...attrs,
					type: 'button',
					variant: props.variant,
					size: props.size,
					onClick: composeEventHandlers((attrs as Record<string, unknown>).onClick, handleCancel),
				},
				{ default: () => slots.default?.() },
			);
	},
});

export default TAlertDialog;
