import { Show, createContext, createEffect, createSignal, createUniqueId, onCleanup, onMount, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import { getSheetState, sheetStyleKeys, type SheetBaseProps, type SheetSide } from '@tile-ui/core';
import {
	PortalScopeContext,
	activateModalFocusScope,
	composeRefs,
	createCompositeIdRegistry,
	createPortalScope,
	eventPathContains,
	getEventPath,
	invokeEventHandler,
	isNodeValue,
	registerDismissableLayer,
	resolvePortalContainer,
	type CallbackRef,
	type DismissableLayerEvent,
	type DismissableLayerOutsideEvent,
} from '../../utils';
import styles from '@tile-ui/styles/scss/components/sheet.module.scss';

interface SheetContextValue {
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
}

const SheetContext = createContext<SheetContextValue>();

const OUTSIDE_ACTION_SELECTOR = 'a[href], button, input, select, textarea, [role="button"], [role="link"]';

function suppressOutsideActivation(originalEvent: PointerEvent) {
	if (originalEvent.cancelable) originalEvent.preventDefault();
	const document = (isNodeValue(originalEvent.target) ? originalEvent.target.ownerDocument : undefined) ?? originalEvent.view?.document;
	if (!document) return;
	const path = getEventPath(originalEvent);
	const ElementConstructor = document.defaultView?.Element;
	const actionTarget = path.find((target): target is Element => !!ElementConstructor && target instanceof ElementConstructor && target.matches(OUTSIDE_ACTION_SELECTOR));
	const pointerTarget = actionTarget ?? (isNodeValue(originalEvent.target) ? originalEvent.target : undefined);
	if (!pointerTarget) return;
	let active = true;
	const cleanup = () => {
		if (!active) return;
		active = false;
		document.removeEventListener('click', blockClick, true);
		document.defaultView?.clearTimeout(timeout);
	};
	const blockClick = (event: MouseEvent) => {
		if (event.target !== pointerTarget && !eventPathContains(getEventPath(event), pointerTarget)) return;
		if (event.cancelable) event.preventDefault();
		event.stopImmediatePropagation();
		cleanup();
	};
	const timeout = document.defaultView?.setTimeout(cleanup, 1000);
	document.addEventListener('click', blockClick, true);
}

function useSheetContext() {
	const context = useContext(SheetContext);
	if (!context) throw new Error('Sheet 子组件必须位于 <Sheet> 内部。');
	return context;
}

export interface SheetProps extends SheetBaseProps {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: JSX.Element;
}

export function Sheet(props: SheetProps) {
	const [internalOpen, setInternalOpen] = createSignal(props.defaultOpen ?? false);
	const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
	const [contentMounted, setContentMounted] = createSignal(false);
	const ids = createCompositeIdRegistry(`tile-solid-sheet-${createUniqueId()}`);
	const open = () => props.open ?? internalOpen();
	const setOpen = (next: boolean) => {
		if (next === open()) return;
		if (props.open === undefined) setInternalOpen(next);
		props.onOpenChange?.(next);
	};
	const value: SheetContextValue = {
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
	};
	return <SheetContext.Provider value={value}>{props.children}</SheetContext.Provider>;
}

export interface SheetTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}
export function SheetTrigger(props: ParentProps<SheetTriggerProps>) {
	const context = useSheetContext();
	const [local, rest] = splitProps(props, ['children', 'ref', 'onClick', 'type']);
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

export interface SheetCloseProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}
export function SheetClose(props: ParentProps<SheetCloseProps>) {
	const context = useSheetContext();
	const [local, rest] = splitProps(props, ['children', 'ref', 'onClick', 'type']);
	return (
		<button
			{...rest}
			ref={local.ref}
			type={local.type ?? 'button'}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented) context.setOpen(false);
			}}>
			{local.children}
		</button>
	);
}

export interface SheetOverlayProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function SheetOverlay(props: SheetOverlayProps) {
	const context = useSheetContext();
	const [local, rest] = splitProps(props, ['class', 'ref', 'onClick']);
	return (
		<Show when={context.open()}>
			<div
				{...rest}
				ref={local.ref}
				data-state={getSheetState(context.open())}
				class={`${styles[sheetStyleKeys.overlay]} ${local.class ?? ''}`}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (!event.defaultPrevented && event.target === event.currentTarget) context.setOpen(false);
				}}
			/>
		</Show>
	);
}

export interface SheetContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
	side?: SheetSide;
	showCloseButton?: boolean;
	container?: Node;
	overlayClass?: string;
	onEscapeKeyDown?: (event: DismissableLayerEvent<KeyboardEvent>) => void;
	onPointerDownOutside?: (event: DismissableLayerEvent<PointerEvent>) => void;
	onFocusOutside?: (event: DismissableLayerEvent<FocusEvent>) => void;
	onInteractOutside?: (event: DismissableLayerEvent<DismissableLayerOutsideEvent>) => void;
}

export function SheetContent(props: ParentProps<SheetContentProps>) {
	const context = useSheetContext();
	const parentScope = useContext(PortalScopeContext);
	const scope = createPortalScope(() => resolvePortalContainer(parentScope, props.container), parentScope);
	const [content, setContent] = createSignal<HTMLDivElement>();
	const [portalReady, setPortalReady] = createSignal(false);
	const [local, rest] = splitProps(props, [
		'children',
		'class',
		'ref',
		'id',
		'side',
		'showCloseButton',
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
		const dismiss = registerDismissableLayer({
			element: content,
			portalScope: scope,
			modal: true,
			onEscapeKeyDown: local.onEscapeKeyDown,
			onPointerDownOutside: (event) => {
				local.onPointerDownOutside?.(event);
				suppressOutsideActivation(event.originalEvent);
			},
			onFocusOutside: local.onFocusOutside,
			onInteractOutside: local.onInteractOutside,
			onDismiss: () => context.setOpen(false),
		});
		const focus = activateModalFocusScope({ container: content, portalScope: scope, restoreFocus: context.trigger });
		dismiss.update();
		focus.update();
		onCleanup(() => {
			dismiss.destroy();
			focus.destroy();
			removeBranch();
		});
	});
	return (
		<Show when={context.open() && portalReady()}>
			<Portal mount={scope.container()}>
				<PortalScopeContext.Provider value={scope}>
					<SheetOverlay class={local.overlayClass} />
					<div
						{...rest}
						ref={composeRefs(local.ref, setContent)}
						id={contentId()}
						role="dialog"
						aria-modal="true"
						aria-label={local['aria-label']}
						aria-labelledby={local['aria-labelledby'] ?? (local['aria-label'] ? undefined : context.titleId())}
						aria-describedby={local['aria-describedby'] ?? context.descriptionId()}
						tabIndex={-1}
						data-state={getSheetState(context.open())}
						data-side={local.side ?? 'right'}
						class={`${styles[sheetStyleKeys.content]} ${local.class ?? ''}`}>
						{local.children}
						<Show when={local.showCloseButton !== false}>
							<button type="button" aria-label="关闭" class={styles[sheetStyleKeys.close]} onClick={() => context.setOpen(false)}>
								<CloseIcon class={styles[sheetStyleKeys.xIcon]} />
							</button>
						</Show>
					</div>
				</PortalScopeContext.Provider>
			</Portal>
		</Show>
	);
}

function CloseIcon(props: { class?: string }) {
	return (
		<svg
			class={props.class}
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true">
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	);
}

export interface SheetHeaderProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function SheetHeader(props: ParentProps<SheetHeaderProps>) {
	const [local, rest] = splitProps(props, ['children', 'class', 'ref']);
	return (
		<div {...rest} ref={local.ref} class={`${styles[sheetStyleKeys.header]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface SheetFooterProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function SheetFooter(props: ParentProps<SheetFooterProps>) {
	const [local, rest] = splitProps(props, ['children', 'class', 'ref']);
	return (
		<div {...rest} ref={local.ref} class={`${styles[sheetStyleKeys.footer]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface SheetTitleProps extends Omit<JSX.HTMLAttributes<HTMLHeadingElement>, 'ref'> {
	ref?: CallbackRef<HTMLHeadingElement>;
}
export function SheetTitle(props: ParentProps<SheetTitleProps>) {
	const context = useSheetContext();
	const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'id']);
	const id = () => local.id ?? `${context.contentId()}-title`;
	createEffect(() => onCleanup(context.registerTitleId(id())));
	return (
		<h2 {...rest} ref={local.ref} id={id()} class={`${styles[sheetStyleKeys.title]} ${local.class ?? ''}`}>
			{local.children}
		</h2>
	);
}
export interface SheetDescriptionProps extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, 'ref'> {
	ref?: CallbackRef<HTMLParagraphElement>;
}
export function SheetDescription(props: ParentProps<SheetDescriptionProps>) {
	const context = useSheetContext();
	const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'id']);
	const id = () => local.id ?? `${context.contentId()}-description`;
	createEffect(() => onCleanup(context.registerDescriptionId(id())));
	return (
		<p {...rest} ref={local.ref} id={id()} class={`${styles[sheetStyleKeys.description]} ${local.class ?? ''}`}>
			{local.children}
		</p>
	);
}

export default Sheet;
