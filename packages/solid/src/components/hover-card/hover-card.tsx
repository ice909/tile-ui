import { createContext, createEffect, createSignal, createUniqueId, onCleanup, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import { getHoverCardPosition, getHoverCardState, hoverCardStyleKeys, resolveHoverCardSide } from '@tile-ui/core';
import type { HoverCardBaseProps, HoverCardContentBaseProps } from '@tile-ui/core';
import {
	createAnchoredPosition,
	createControllableSignal,
	createHoverIntent,
	createPortalScope,
	invokeEventHandler,
	isHTMLElementNode,
	isNodeValue,
	PortalScopeContext,
	registerDismissableLayer,
	resolvePortalContainer,
	usePortalScope,
	type CallbackRef,
	type HoverIntentOwner,
	type PortalScope,
} from '../../utils';
import styles from '@tile-ui/styles/scss/components/hover-card.module.scss';

interface HoverCardContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	trigger: Accessor<HTMLButtonElement | undefined>;
	setTrigger: (element: HTMLButtonElement) => void;
	contentId: Accessor<string>;
	setContentId: (id: string) => void;
	cancelIntent: () => void;
	setOwner: (owner: HoverIntentOwner, kind: 'pointer' | 'focus', active: boolean) => void;
	portalScope: PortalScope;
	parentPortalScope?: PortalScope;
	setPortalContainer: (container: Node | undefined) => void;
}

const HoverCardContext = createContext<HoverCardContextValue>();

function useHoverCard() {
	const context = useContext(HoverCardContext);
	if (!context) throw new Error('HoverCardTrigger and HoverCardContent must be used within <HoverCard>.');
	return context;
}

function restoreHoverCardFocus(content: HTMLElement | undefined, trigger: HTMLElement | undefined) {
	const active = content?.ownerDocument.activeElement;
	if (!active || !content?.contains(active)) return;
	if (trigger?.isConnected) trigger.focus({ preventScroll: true });
	else if (isHTMLElementNode(active)) active.blur();
}

export interface HoverCardProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, HoverCardBaseProps {
	contentId?: string;
	ref?: CallbackRef<HTMLDivElement>;
}

/** SolidJS HoverCard：trigger/content 共享 hover/focus 所有权与延迟。 */
export function HoverCard(props: ParentProps<HoverCardProps>) {
	const parentPortalScope = usePortalScope();
	const [local, rest] = splitProps(props, ['open', 'defaultOpen', 'openDelay', 'closeDelay', 'onOpenChange', 'contentId', 'class', 'children', 'ref']);
	const [open, setOpen] = createControllableSignal({
		value: () => local.open,
		defaultValue: () => local.defaultOpen ?? false,
		onChange: (next) => local.onOpenChange?.(next),
	});
	const baseId = `tile-solid-hover-card-${createUniqueId()}`;
	const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
	const [contentId, setContentId] = createSignal(local.contentId ?? `${baseId}-content`);
	const [portalContainer, setPortalContainer] = createSignal<Node>();
	const portalScope = createPortalScope(portalContainer, parentPortalScope);
	const ownership = { trigger: { pointer: false, focus: false }, content: { pointer: false, focus: false } };
	let openDelay = local.openDelay ?? 200;
	let closeDelay = local.closeDelay ?? 300;
	let intent = createHoverIntent({ open, openDelay, closeDelay, reopenOnHoverAfterExternalClose: false, onOpenChange: setOpen });
	const hasOwner = () => (['trigger', 'content'] as const).some((owner) => ownership[owner].pointer || ownership[owner].focus);
	const replayOwnership = () => {
		if (hasOwner()) intent.enter('trigger');
		else if (open()) {
			intent.enter('trigger');
			intent.leave('trigger');
		}
	};
	const setOwner = (owner: HoverIntentOwner, kind: 'pointer' | 'focus', active: boolean) => {
		const hadOwner = hasOwner();
		const state = ownership[owner];
		state[kind] = active;
		const hasNextOwner = hasOwner();
		if (!hadOwner && hasNextOwner) intent.enter('trigger');
		else if (hadOwner && !hasNextOwner) intent.leave('trigger');
	};
	createEffect(() => {
		const nextOpenDelay = local.openDelay ?? 200;
		const nextCloseDelay = local.closeDelay ?? 300;
		if (nextOpenDelay === openDelay && nextCloseDelay === closeDelay) return;
		openDelay = nextOpenDelay;
		closeDelay = nextCloseDelay;
		intent.destroy();
		intent = createHoverIntent({ open, openDelay, closeDelay, reopenOnHoverAfterExternalClose: false, onOpenChange: setOpen });
		replayOwnership();
	});
	createEffect(() => {
		open();
		intent.sync();
	});
	onCleanup(() => intent.destroy());
	const context: HoverCardContextValue = {
		open,
		setOpen,
		trigger,
		setTrigger,
		contentId,
		setContentId,
		cancelIntent: () => intent.cancel(),
		setOwner,
		portalScope,
		parentPortalScope,
		setPortalContainer,
	};

	return (
		<HoverCardContext.Provider value={context}>
			<PortalScopeContext.Provider value={portalScope}>
				<div {...rest} ref={local.ref} data-slot="hover-card" data-state={getHoverCardState(open())} class={`${styles[hoverCardStyleKeys.root]} ${local.class ?? ''}`}>
					{local.children}
				</div>
			</PortalScopeContext.Provider>
		</HoverCardContext.Provider>
	);
}

export interface HoverCardTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}

export function HoverCardTrigger(props: ParentProps<HoverCardTriggerProps>) {
	const context = useHoverCard();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'type', 'onPointerEnter', 'onPointerLeave', 'onFocus', 'onBlur', 'onKeyDown']);
	return (
		<button
			{...rest}
			ref={(element) => {
				context.setTrigger(element);
				local.ref?.(element);
			}}
			type={local.type ?? 'button'}
			aria-describedby={context.open() ? context.contentId() : undefined}
			data-slot="hover-card-trigger"
			data-state={getHoverCardState(context.open())}
			class={`${styles[hoverCardStyleKeys.trigger]} ${local.class ?? ''}`}
			onPointerEnter={(event) => {
				invokeEventHandler(local.onPointerEnter, event);
				if (!event.defaultPrevented && event.pointerType !== 'touch') context.setOwner('trigger', 'pointer', true);
			}}
			onPointerLeave={(event) => {
				invokeEventHandler(local.onPointerLeave, event);
				if (!event.defaultPrevented && event.pointerType !== 'touch') context.setOwner('trigger', 'pointer', false);
			}}
			onFocus={(event) => {
				invokeEventHandler(local.onFocus, event);
				if (!event.defaultPrevented) context.setOwner('trigger', 'focus', true);
			}}
			onBlur={(event) => {
				invokeEventHandler(local.onBlur, event);
				if (!event.defaultPrevented) context.setOwner('trigger', 'focus', false);
			}}
			onKeyDown={(event) => {
				invokeEventHandler(local.onKeyDown, event);
				if (!event.defaultPrevented && event.key === 'Escape') {
					context.cancelIntent();
					context.setOpen(false);
				}
			}}>
			{local.children}
		</button>
	);
}

export interface HoverCardContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, HoverCardContentBaseProps {
	container?: Node;
	ref?: CallbackRef<HTMLDivElement>;
}

export function HoverCardContent(props: ParentProps<HoverCardContentProps>) {
	const context = useHoverCard();
	const [local, rest] = splitProps(props, [
		'id',
		'class',
		'children',
		'container',
		'ref',
		'side',
		'align',
		'sideOffset',
		'onPointerEnter',
		'onPointerLeave',
		'onFocusIn',
		'onFocusOut',
	]);
	const id = () => local.id ?? context.contentId();
	const side = () => local.side ?? 'bottom';
	const [resolvedSide, setResolvedSide] = createSignal(side());
	const align = () => local.align ?? 'center';
	const sideOffset = () => local.sideOffset ?? 4;
	let content: HTMLDivElement | undefined;
	let removeBranch: (() => void) | undefined;
	let position: ReturnType<typeof createAnchoredPosition> | undefined;
	createEffect(() => context.setContentId(id()));
	createEffect(() => setResolvedSide(side()));
	createEffect(() => {
		if (!context.open()) return;
		const container = resolvePortalContainer(context.parentPortalScope, local.container);
		context.setPortalContainer(container);
		position = createAnchoredPosition({
			anchor: context.trigger,
			content: () => content,
			container: () => {
				const ElementConstructor = isNodeValue(container) ? container.ownerDocument?.defaultView?.Element : undefined;
				return ElementConstructor && container instanceof ElementConstructor ? container : undefined;
			},
			open: context.open,
			onPosition: ({ anchorRect, contentRect, containerRect, direction }) => {
				if (!content) return;
				const nextSide = resolveHoverCardSide(side(), direction === 'rtl');
				setResolvedSide(nextSide);
				const next = getHoverCardPosition({
					triggerRect: {
						top: anchorRect.top - containerRect.top,
						right: anchorRect.right - containerRect.left,
						bottom: anchorRect.bottom - containerRect.top,
						left: anchorRect.left - containerRect.left,
						width: anchorRect.width,
						height: anchorRect.height,
					},
					contentSize: contentRect,
					side: nextSide,
					align: align(),
					sideOffset: sideOffset(),
					viewport: { width: containerRect.width, height: containerRect.height },
					rtl: direction === 'rtl',
				});
				content.style.top = `${next.top + containerRect.top}px`;
				content.style.left = `${next.left + containerRect.left}px`;
				content.dir = direction;
			},
		});
		const layer = registerDismissableLayer({
			element: () => content,
			branches: () => (context.trigger() ? [context.trigger()!] : []),
			portalScope: context.portalScope,
			onEscapeKeyDown: (event) => {
				if (event.originalEvent.defaultPrevented) event.preventDefault();
			},
			onPointerDownOutside: (event) => event.preventDefault(),
			onFocusOutside: (event) => event.preventDefault(),
			onDismiss: () => {
				context.cancelIntent();
				restoreHoverCardFocus(content, context.trigger());
				context.setOpen(false);
			},
		});
		queueMicrotask(() => layer.update());
		onCleanup(() => {
			restoreHoverCardFocus(content, context.trigger());
			layer.destroy();
			position?.destroy();
			position = undefined;
			context.setPortalContainer(undefined);
		});
	});
	createEffect(() => {
		side();
		align();
		sideOffset();
		if (context.open()) position?.recompute();
	});
	onCleanup(() => removeBranch?.());

	return (
		<Portal mount={resolvePortalContainer(context.parentPortalScope, local.container)}>
			<div
				{...rest}
				ref={(element) => {
					content = element;
					local.ref?.(element);
					removeBranch?.();
					removeBranch = context.portalScope.addBranch(element);
				}}
				id={id()}
				role="dialog"
				aria-modal="false"
				hidden={!context.open()}
				data-slot="hover-card-content"
				data-state={getHoverCardState(context.open())}
				data-side={resolvedSide()}
				data-align={align()}
				class={`${styles[hoverCardStyleKeys.content]} ${local.class ?? ''}`}
				onPointerEnter={(event) => {
					invokeEventHandler(local.onPointerEnter, event);
					if (!event.defaultPrevented && event.pointerType !== 'touch') context.setOwner('content', 'pointer', true);
				}}
				onPointerLeave={(event) => {
					invokeEventHandler(local.onPointerLeave, event);
					if (!event.defaultPrevented && event.pointerType !== 'touch') context.setOwner('content', 'pointer', false);
				}}
				onFocusIn={(event) => {
					invokeEventHandler(local.onFocusIn, event);
					if (!event.defaultPrevented) context.setOwner('content', 'focus', true);
				}}
				onFocusOut={(event) => {
					invokeEventHandler(local.onFocusOut, event);
					if (!event.defaultPrevented && !(isNodeValue(event.relatedTarget) && event.currentTarget.contains(event.relatedTarget)))
						context.setOwner('content', 'focus', false);
				}}>
				{local.children}
			</div>
		</Portal>
	);
}

export default HoverCard;
