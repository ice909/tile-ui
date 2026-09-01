import { Show, createContext, createEffect, createSignal, createUniqueId, onCleanup, onMount, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import { drawerStyleKeys, getDrawerState, getDrawerTranslateStyle, type DrawerBaseProps, type DrawerDirection } from '@tile-ui/core';
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
import styles from '@tile-ui/styles/scss/components/drawer.module.scss';

interface DrawerContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	direction: Accessor<DrawerDirection>;
	modal: Accessor<boolean>;
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

const DrawerContext = createContext<DrawerContextValue>();

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

function useDrawerContext() {
	const context = useContext(DrawerContext);
	if (!context) throw new Error('Drawer 子组件必须位于 <Drawer> 内部。');
	return context;
}

export interface DrawerProps extends DrawerBaseProps {
	children?: JSX.Element;
}
export function Drawer(props: DrawerProps) {
	const [internalOpen, setInternalOpen] = createSignal(props.defaultOpen ?? false);
	const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
	const [contentMounted, setContentMounted] = createSignal(false);
	const ids = createCompositeIdRegistry(`tile-solid-drawer-${createUniqueId()}`);
	const open = () => props.open ?? internalOpen();
	const setOpen = (next: boolean) => {
		if (next === open()) return;
		if (props.open === undefined) setInternalOpen(next);
		props.onOpenChange?.(next);
	};
	const value: DrawerContextValue = {
		open,
		setOpen,
		direction: () => props.direction ?? 'right',
		modal: () => props.modal !== false,
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
	return <DrawerContext.Provider value={value}>{props.children}</DrawerContext.Provider>;
}

export interface DrawerTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}
export function DrawerTrigger(props: ParentProps<DrawerTriggerProps>) {
	const context = useDrawerContext();
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
export interface DrawerCloseProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}
export function DrawerClose(props: ParentProps<DrawerCloseProps>) {
	const context = useDrawerContext();
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
export interface DrawerOverlayProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function DrawerOverlay(props: DrawerOverlayProps) {
	const context = useDrawerContext();
	const [local, rest] = splitProps(props, ['class', 'ref', 'onClick']);
	return (
		<Show when={context.open() && context.modal()}>
			<div
				{...rest}
				ref={local.ref}
				data-state={getDrawerState(context.open())}
				class={`${styles[drawerStyleKeys.overlay]} ${local.class ?? ''}`}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (!event.defaultPrevented && event.target === event.currentTarget) context.setOpen(false);
				}}
			/>
		</Show>
	);
}

export interface DrawerContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
	showCloseButton?: boolean;
	container?: Node;
	overlayClass?: string;
	onEscapeKeyDown?: (event: DismissableLayerEvent<KeyboardEvent>) => void;
	onPointerDownOutside?: (event: DismissableLayerEvent<PointerEvent>) => void;
	onFocusOutside?: (event: DismissableLayerEvent<FocusEvent>) => void;
	onInteractOutside?: (event: DismissableLayerEvent<DismissableLayerOutsideEvent>) => void;
}

export function DrawerContent(props: ParentProps<DrawerContentProps>) {
	const context = useDrawerContext();
	const parentScope = useContext(PortalScopeContext);
	const scope = createPortalScope(() => resolvePortalContainer(parentScope, props.container), parentScope);
	const [content, setContent] = createSignal<HTMLDivElement>();
	const [portalReady, setPortalReady] = createSignal(false);
	const [visible, setVisible] = createSignal(false);
	const [local, rest] = splitProps(props, [
		'children',
		'class',
		'ref',
		'id',
		'style',
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
		setVisible(false);
		const view = element.ownerDocument.defaultView;
		const frame = view?.requestAnimationFrame?.(() => setVisible(true));
		if (frame === undefined) setVisible(true);
		const removeBranch = scope.addBranch(element);
		const dismiss = registerDismissableLayer({
			element: content,
			portalScope: scope,
			modal: context.modal(),
			onEscapeKeyDown: local.onEscapeKeyDown,
			onPointerDownOutside: (event) => {
				local.onPointerDownOutside?.(event);
				if (context.modal()) suppressOutsideActivation(event.originalEvent);
			},
			onFocusOutside: local.onFocusOutside,
			onInteractOutside: local.onInteractOutside,
			onDismiss: () => context.setOpen(false),
		});
		const focus = context.modal() ? activateModalFocusScope({ container: content, portalScope: scope, restoreFocus: context.trigger }) : undefined;
		dismiss.update();
		focus?.update();
		onCleanup(() => {
			if (frame !== undefined) view?.cancelAnimationFrame?.(frame);
			dismiss.destroy();
			focus?.destroy();
			removeBranch();
		});
	});
	const contentStyle = (): JSX.CSSProperties | string | undefined => {
		if (visible()) return local.style;
		const internal = `transform:${getDrawerTranslateStyle(context.direction())};opacity:0`;
		return typeof local.style === 'string' ? `${internal};${local.style}` : Object.assign({ transform: getDrawerTranslateStyle(context.direction()), opacity: 0 }, local.style);
	};
	return (
		<Show when={context.open() && portalReady()}>
			<Portal mount={scope.container()}>
				<PortalScopeContext.Provider value={scope}>
					<DrawerOverlay class={local.overlayClass} />
					<div
						{...rest}
						ref={composeRefs(local.ref, setContent)}
						id={contentId()}
						role="dialog"
						aria-modal={context.modal() ? 'true' : undefined}
						aria-label={local['aria-label']}
						aria-labelledby={local['aria-labelledby'] ?? (local['aria-label'] ? undefined : context.titleId())}
						aria-describedby={local['aria-describedby'] ?? context.descriptionId()}
						tabIndex={-1}
						data-state={getDrawerState(context.open())}
						data-direction={context.direction()}
						style={contentStyle()}
						class={`${styles[drawerStyleKeys.content]} ${local.class ?? ''}`}>
						<div class={styles[drawerStyleKeys.handle]} />
						{local.children}
						<Show when={local.showCloseButton !== false}>
							<button type="button" aria-label="关闭" class={styles[drawerStyleKeys.close]} onClick={() => context.setOpen(false)}>
								<CloseIcon class={styles[drawerStyleKeys.xIcon]} />
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
export interface DrawerHeaderProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function DrawerHeader(props: ParentProps<DrawerHeaderProps>) {
	const [local, rest] = splitProps(props, ['children', 'class', 'ref']);
	return (
		<div {...rest} ref={local.ref} class={`${styles[drawerStyleKeys.header]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface DrawerFooterProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function DrawerFooter(props: ParentProps<DrawerFooterProps>) {
	const [local, rest] = splitProps(props, ['children', 'class', 'ref']);
	return (
		<div {...rest} ref={local.ref} class={`${styles[drawerStyleKeys.footer]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface DrawerTitleProps extends Omit<JSX.HTMLAttributes<HTMLHeadingElement>, 'ref'> {
	ref?: CallbackRef<HTMLHeadingElement>;
}
export function DrawerTitle(props: ParentProps<DrawerTitleProps>) {
	const context = useDrawerContext();
	const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'id']);
	const id = () => local.id ?? `${context.contentId()}-title`;
	createEffect(() => onCleanup(context.registerTitleId(id())));
	return (
		<h2 {...rest} ref={local.ref} id={id()} class={`${styles[drawerStyleKeys.title]} ${local.class ?? ''}`}>
			{local.children}
		</h2>
	);
}
export interface DrawerDescriptionProps extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, 'ref'> {
	ref?: CallbackRef<HTMLParagraphElement>;
}
export function DrawerDescription(props: ParentProps<DrawerDescriptionProps>) {
	const context = useDrawerContext();
	const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'id']);
	const id = () => local.id ?? `${context.contentId()}-description`;
	createEffect(() => onCleanup(context.registerDescriptionId(id())));
	return (
		<p {...rest} ref={local.ref} id={id()} class={`${styles[drawerStyleKeys.description]} ${local.class ?? ''}`}>
			{local.children}
		</p>
	);
}

export default Drawer;
