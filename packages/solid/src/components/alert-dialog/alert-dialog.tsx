import { Show, createContext, createEffect, createSignal, createUniqueId, onCleanup, onMount, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import { alertDialogStyleKeys, getAlertDialogState, type AlertDialogBaseProps, type AlertDialogSize, type ButtonSize, type ButtonVariant } from '@tile-ui/core';
import {
	PortalScopeContext,
	activateModalFocusScope,
	composeRefs,
	createCompositeIdRegistry,
	createPortalScope,
	invokeEventHandler,
	isNodeValue,
	registerDismissableLayer,
	resolvePortalContainer,
	type CallbackRef,
	type DismissableLayerEvent,
	type DismissableLayerOutsideEvent,
} from '../../utils';
import { Button } from '../button';
import styles from '@tile-ui/styles/scss/components/alert-dialog.module.scss';

interface AlertDialogContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	contentId: Accessor<string | undefined>;
	titleId: Accessor<string | undefined>;
	descriptionId: Accessor<string | undefined>;
	trigger: Accessor<HTMLButtonElement | undefined>;
	setTrigger: (element: HTMLButtonElement) => void;
	contentMounted: Accessor<boolean>;
	setContentMounted: (mounted: boolean) => void;
	registerContentId: (id?: string) => () => void;
	registerTitleId: (id?: string) => () => void;
	registerDescriptionId: (id?: string) => () => void;
	cancel: Accessor<HTMLButtonElement | undefined>;
	setCancel: (element: HTMLButtonElement) => void;
}

const AlertDialogContext = createContext<AlertDialogContextValue>();

function useAlertDialogContext() {
	const context = useContext(AlertDialogContext);
	if (!context) throw new Error('AlertDialog 子组件必须位于 <AlertDialog> 内部。');
	return context;
}

export interface AlertDialogProps extends AlertDialogBaseProps {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: JSX.Element;
}

export function AlertDialog(props: AlertDialogProps) {
	const [internalOpen, setInternalOpen] = createSignal(props.defaultOpen ?? false);
	const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
	const [cancel, setCancel] = createSignal<HTMLButtonElement>();
	const [contentMounted, setContentMounted] = createSignal(false);
	const ids = createCompositeIdRegistry(`tile-solid-alert-dialog-${createUniqueId()}`);
	const open = () => props.open ?? internalOpen();
	const setOpen = (next: boolean) => {
		if (next === open()) return;
		if (props.open === undefined) setInternalOpen(next);
		props.onOpenChange?.(next);
	};
	const value: AlertDialogContextValue = {
		open,
		setOpen,
		contentId: ids.id('content'),
		titleId: ids.id('title'),
		descriptionId: ids.id('description'),
		trigger,
		setTrigger,
		contentMounted,
		setContentMounted,
		registerContentId: (id) => ids.register('content', id),
		registerTitleId: (id) => ids.register('title', id),
		registerDescriptionId: (id) => ids.register('description', id),
		cancel,
		setCancel,
	};
	return <AlertDialogContext.Provider value={value}>{props.children}</AlertDialogContext.Provider>;
}

export interface AlertDialogTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}

export function AlertDialogTrigger(props: ParentProps<AlertDialogTriggerProps>) {
	const context = useAlertDialogContext();
	const [local, rest] = splitProps(props, ['children', 'onClick', 'type', 'ref']);
	return (
		<button
			{...rest}
			ref={composeRefs(local.ref, context.setTrigger)}
			type={local.type ?? 'button'}
			aria-haspopup="dialog"
			aria-expanded={context.open()}
			aria-controls={context.open() && context.contentMounted() ? context.contentId() : undefined}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented) context.setOpen(true);
			}}>
			{local.children}
		</button>
	);
}

export interface AlertDialogOverlayProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}

export function AlertDialogOverlay(props: AlertDialogOverlayProps) {
	const context = useAlertDialogContext();
	const [local, rest] = splitProps(props, ['class', 'ref']);
	return (
		<Show when={context.open()}>
			<div {...rest} ref={local.ref} data-state={getAlertDialogState(context.open())} class={`${styles[alertDialogStyleKeys.overlay]} ${local.class ?? ''}`} />
		</Show>
	);
}

export interface AlertDialogContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
	size?: AlertDialogSize;
	container?: Node;
	overlayClass?: string;
	onEscapeKeyDown?: (event: DismissableLayerEvent<KeyboardEvent>) => void;
	onPointerDownOutside?: (event: DismissableLayerEvent<PointerEvent>) => void;
	onFocusOutside?: (event: DismissableLayerEvent<FocusEvent>) => void;
	onInteractOutside?: (event: DismissableLayerEvent<DismissableLayerOutsideEvent>) => void;
}

export function AlertDialogContent(props: ParentProps<AlertDialogContentProps>) {
	const context = useAlertDialogContext();
	const parentScope = useContext(PortalScopeContext);
	const scope = createPortalScope(() => resolvePortalContainer(parentScope, props.container), parentScope);
	const [content, setContent] = createSignal<HTMLDivElement>();
	const [portalReady, setPortalReady] = createSignal(false);
	const [local, rest] = splitProps(props, [
		'children',
		'class',
		'ref',
		'id',
		'size',
		'container',
		'overlayClass',
		'aria-label',
		'aria-labelledby',
		'aria-describedby',
		'onEscapeKeyDown',
		'onPointerDownOutside',
		'onFocusOutside',
		'onInteractOutside',
	]);
	const contentId = () => local.id ?? context.contentId();
	onMount(() => {
		const timeout = window.setTimeout(() => {
			context.setContentMounted(true);
			setPortalReady(true);
		}, 0);
		onCleanup(() => {
			window.clearTimeout(timeout);
			context.setContentMounted(false);
		});
	});
	createEffect(() => onCleanup(context.registerContentId(local.id)));

	createEffect(() => {
		const element = content();
		if (!context.open() || !element) return;
		const removeBranch = scope.addBranch(element);
		const document = element.ownerDocument;
		const blockOutsideClick = (event: MouseEvent) => {
			const target = event.target;
			if (!isNodeValue(target)) return;
			const roots = [element, ...scope.getBranches()];
			if (roots.some((root) => root === target || root.contains(target))) return;
			if (event.cancelable) event.preventDefault();
			event.stopImmediatePropagation();
		};
		document.addEventListener('click', blockOutsideClick, true);
		const dismiss = registerDismissableLayer({
			element: content,
			portalScope: scope,
			modal: true,
			onEscapeKeyDown: local.onEscapeKeyDown,
			onPointerDownOutside: (event) => {
				local.onPointerDownOutside?.(event);
				const originalEvent = event.originalEvent;
				if (originalEvent.cancelable) originalEvent.preventDefault();
				event.preventDefault();
			},
			onFocusOutside: (event) => {
				local.onFocusOutside?.(event);
				if (!event.defaultPrevented) event.preventDefault();
			},
			onInteractOutside: local.onInteractOutside,
			onDismiss: () => context.setOpen(false),
		});
		const focus = activateModalFocusScope({ container: content, portalScope: scope, initialFocus: () => context.cancel(), restoreFocus: context.trigger });
		dismiss.update();
		focus.update();
		onCleanup(() => {
			document.removeEventListener('click', blockOutsideClick, true);
			dismiss.destroy();
			focus.destroy();
			removeBranch();
		});
	});

	return (
		<Show when={context.open() && portalReady()}>
			<Portal mount={scope.container()}>
				<PortalScopeContext.Provider value={scope}>
					<AlertDialogOverlay class={local.overlayClass} />
					<div
						{...rest}
						ref={composeRefs(local.ref, setContent)}
						id={contentId()}
						role="alertdialog"
						aria-modal="true"
						aria-label={local['aria-label']}
						aria-labelledby={local['aria-labelledby'] ?? (local['aria-label'] ? undefined : context.titleId())}
						aria-describedby={local['aria-describedby'] ?? context.descriptionId()}
						tabIndex={-1}
						data-state={getAlertDialogState(context.open())}
						data-size={local.size ?? 'default'}
						class={`${styles[alertDialogStyleKeys.content]} ${local.class ?? ''}`}>
						{local.children}
					</div>
				</PortalScopeContext.Provider>
			</Portal>
		</Show>
	);
}

export interface AlertDialogHeaderProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}

export function AlertDialogHeader(props: ParentProps<AlertDialogHeaderProps>) {
	const [local, rest] = splitProps(props, ['children', 'class', 'ref']);
	return (
		<div {...rest} ref={local.ref} class={`${styles[alertDialogStyleKeys.header]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface AlertDialogFooterProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}

export function AlertDialogFooter(props: ParentProps<AlertDialogFooterProps>) {
	const [local, rest] = splitProps(props, ['children', 'class', 'ref']);
	return (
		<div {...rest} ref={local.ref} class={`${styles[alertDialogStyleKeys.footer]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface AlertDialogTitleProps extends Omit<JSX.HTMLAttributes<HTMLHeadingElement>, 'ref'> {
	ref?: CallbackRef<HTMLHeadingElement>;
}

export function AlertDialogTitle(props: ParentProps<AlertDialogTitleProps>) {
	const context = useAlertDialogContext();
	const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'id']);
	const id = () => local.id ?? `${context.contentId()}-title`;
	createEffect(() => onCleanup(context.registerTitleId(id())));
	return (
		<h2 {...rest} ref={local.ref} id={id()} class={`${styles[alertDialogStyleKeys.title]} ${local.class ?? ''}`}>
			{local.children}
		</h2>
	);
}

export interface AlertDialogDescriptionProps extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, 'ref'> {
	ref?: CallbackRef<HTMLParagraphElement>;
}

export function AlertDialogDescription(props: ParentProps<AlertDialogDescriptionProps>) {
	const context = useAlertDialogContext();
	const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'id']);
	const id = () => local.id ?? `${context.contentId()}-description`;
	createEffect(() => onCleanup(context.registerDescriptionId(id())));
	return (
		<p {...rest} ref={local.ref} id={id()} class={`${styles[alertDialogStyleKeys.description]} ${local.class ?? ''}`}>
			{local.children}
		</p>
	);
}

export interface AlertDialogActionProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref' | 'size'> {
	ref?: CallbackRef<HTMLButtonElement>;
	variant?: ButtonVariant;
	size?: ButtonSize;
}

export function AlertDialogAction(props: ParentProps<AlertDialogActionProps>) {
	const context = useAlertDialogContext();
	const [local, rest] = splitProps(props, ['children', 'ref', 'onClick', 'variant', 'size', 'type']);
	return (
		<Button
			{...rest}
			ref={local.ref}
			type={local.type ?? 'button'}
			variant={local.variant}
			size={local.size}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented) context.setOpen(false);
			}}>
			{local.children}
		</Button>
	);
}

export interface AlertDialogCancelProps extends AlertDialogActionProps {}

export function AlertDialogCancel(props: ParentProps<AlertDialogCancelProps>) {
	const context = useAlertDialogContext();
	const [local, rest] = splitProps(props, ['children', 'ref', 'onClick', 'variant', 'size', 'type']);
	return (
		<Button
			{...rest}
			ref={composeRefs(local.ref, context.setCancel)}
			type={local.type ?? 'button'}
			variant={local.variant ?? 'outline'}
			size={local.size}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented) context.setOpen(false);
			}}>
			{local.children}
		</Button>
	);
}

export default AlertDialog;
