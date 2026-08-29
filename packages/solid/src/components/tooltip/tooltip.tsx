import { createContext, createEffect, createSignal, createUniqueId, onCleanup, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import { getTooltipPosition, getTooltipState, resolveTooltipSide, tooltipStyleKeys, TOOLTIP_CLOSE_DELAY_MS } from '@tile-ui/core';
import type { TooltipBaseProps, TooltipContentBaseProps, TooltipProviderBaseProps } from '@tile-ui/core';
import {
	createAnchoredPosition,
	createControllableSignal,
	createHoverIntent,
	createPortalScope,
	isNodeValue,
	invokeEventHandler,
	PortalScopeContext,
	registerDismissableLayer,
	resolvePortalContainer,
	usePortalScope,
	type CallbackRef,
	type HoverIntentOwner,
	type PortalScope,
} from '../../utils';
import styles from '@tile-ui/styles/scss/components/tooltip.module.scss';

interface TooltipProviderContextValue {
	delayDuration: Accessor<number>;
}

interface TooltipContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	trigger: Accessor<HTMLElement | undefined>;
	setTrigger: (element: HTMLElement) => void;
	triggerId: Accessor<string>;
	contentId: Accessor<string>;
	setTriggerId: (id: string) => void;
	setContentId: (id: string) => void;
	cancelIntent: () => void;
	setOwner: (owner: HoverIntentOwner, kind: 'pointer' | 'focus', active: boolean) => void;
	portalScope: PortalScope;
	parentPortalScope?: PortalScope;
	setPortalContainer: (container: Node | undefined) => void;
}

const TooltipProviderContext = createContext<TooltipProviderContextValue>({ delayDuration: () => 0 });
const TooltipContext = createContext<TooltipContextValue>();

function useTooltip() {
	const context = useContext(TooltipContext);
	if (!context) throw new Error('TooltipTrigger and TooltipContent must be used within <Tooltip>.');
	return context;
}

export interface TooltipProviderProps extends TooltipProviderBaseProps {
	children?: JSX.Element;
}

export function TooltipProvider(props: TooltipProviderProps) {
	return <TooltipProviderContext.Provider value={{ delayDuration: () => props.delayDuration ?? 0 }}>{props.children}</TooltipProviderContext.Provider>;
}

export interface TooltipProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, TooltipBaseProps {
	triggerId?: string;
	contentId?: string;
	ref?: CallbackRef<HTMLDivElement>;
}

/** SolidJS Tooltip：共享 provider 延迟，并在 trigger/content 间保留悬停所有权。 */
export function Tooltip(props: ParentProps<TooltipProps>) {
	const provider = useContext(TooltipProviderContext);
	const parentPortalScope = usePortalScope();
	const [local, rest] = splitProps(props, ['open', 'defaultOpen', 'onOpenChange', 'triggerId', 'contentId', 'class', 'children', 'ref']);
	const [open, setOpen] = createControllableSignal({
		value: () => local.open,
		defaultValue: () => local.defaultOpen ?? false,
		onChange: (next) => local.onOpenChange?.(next),
	});
	const baseId = `tile-solid-tooltip-${createUniqueId()}`;
	const [trigger, setTriggerSignal] = createSignal<HTMLElement>();
	const [triggerId, setTriggerId] = createSignal(local.triggerId ?? `${baseId}-trigger`);
	const [contentId, setContentId] = createSignal(local.contentId ?? `${baseId}-content`);
	const [portalContainer, setPortalContainer] = createSignal<Node>();
	const portalScope = createPortalScope(portalContainer, parentPortalScope);
	const ownership = { trigger: { pointer: false, focus: false }, content: { pointer: false, focus: false } };
	let delayDuration = provider.delayDuration();
	let intent = createHoverIntent({ open, openDelay: delayDuration, closeDelay: TOOLTIP_CLOSE_DELAY_MS, reopenOnHoverAfterExternalClose: false, onOpenChange: setOpen });
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
		const nextDelay = provider.delayDuration();
		if (nextDelay === delayDuration) return;
		delayDuration = nextDelay;
		intent.destroy();
		intent = createHoverIntent({ open, openDelay: delayDuration, closeDelay: TOOLTIP_CLOSE_DELAY_MS, reopenOnHoverAfterExternalClose: false, onOpenChange: setOpen });
		replayOwnership();
	});
	createEffect(() => {
		open();
		intent.sync();
	});
	onCleanup(() => intent.destroy());

	const context: TooltipContextValue = {
		open,
		setOpen,
		trigger,
		setTrigger: setTriggerSignal,
		triggerId,
		contentId,
		setTriggerId,
		setContentId,
		cancelIntent: () => intent.cancel(),
		setOwner,
		portalScope,
		parentPortalScope,
		setPortalContainer,
	};

	return (
		<TooltipContext.Provider value={context}>
			<PortalScopeContext.Provider value={portalScope}>
				<div {...rest} ref={local.ref} data-slot="tooltip" data-state={getTooltipState(open())} class={`${styles[tooltipStyleKeys.root]} ${local.class ?? ''}`}>
					{local.children}
				</div>
			</PortalScopeContext.Provider>
		</TooltipContext.Provider>
	);
}

export interface TooltipTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}

export function TooltipTrigger(props: ParentProps<TooltipTriggerProps>) {
	const context = useTooltip();
	const [local, rest] = splitProps(props, ['id', 'class', 'children', 'ref', 'type', 'onPointerEnter', 'onPointerLeave', 'onFocus', 'onBlur', 'onKeyDown']);
	const id = () => local.id ?? context.triggerId();
	createEffect(() => context.setTriggerId(id()));
	return (
		<button
			{...rest}
			ref={(element) => {
				context.setTrigger(element);
				local.ref?.(element);
			}}
			id={id()}
			type={local.type ?? 'button'}
			aria-describedby={context.open() ? context.contentId() : undefined}
			data-slot="tooltip-trigger"
			data-state={getTooltipState(context.open())}
			class={`${styles[tooltipStyleKeys.trigger]} ${local.class ?? ''}`}
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

export interface TooltipContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, TooltipContentBaseProps {
	container?: Node;
	ref?: CallbackRef<HTMLDivElement>;
}

export function TooltipContent(props: ParentProps<TooltipContentProps>) {
	const context = useTooltip();
	const [local, rest] = splitProps(props, ['id', 'class', 'children', 'container', 'ref', 'side', 'sideOffset', 'onPointerEnter', 'onPointerLeave']);
	const side = () => local.side ?? 'top';
	const [resolvedSide, setResolvedSide] = createSignal(side());
	const sideOffset = () => local.sideOffset ?? 0;
	const id = () => local.id ?? context.contentId();
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
				const nextSide = resolveTooltipSide(side(), direction === 'rtl');
				setResolvedSide(nextSide);
				const next = getTooltipPosition({
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
					sideOffset: sideOffset(),
					viewport: { width: containerRect.width, height: containerRect.height },
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
				context.setOpen(false);
			},
		});
		queueMicrotask(() => layer.update());
		onCleanup(() => {
			layer.destroy();
			position?.destroy();
			position = undefined;
			context.setPortalContainer(undefined);
		});
	});
	createEffect(() => {
		side();
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
				role="tooltip"
				hidden={!context.open()}
				data-slot="tooltip-content"
				data-state={getTooltipState(context.open())}
				data-side={resolvedSide()}
				class={`${styles[tooltipStyleKeys.content]} ${local.class ?? ''}`}
				onPointerEnter={(event) => {
					invokeEventHandler(local.onPointerEnter, event);
					if (!event.defaultPrevented && event.pointerType !== 'touch') context.setOwner('content', 'pointer', true);
				}}
				onPointerLeave={(event) => {
					invokeEventHandler(local.onPointerLeave, event);
					if (!event.defaultPrevented && event.pointerType !== 'touch') context.setOwner('content', 'pointer', false);
				}}>
				{local.children}
				<span class={styles[tooltipStyleKeys.arrow]} aria-hidden="true" />
			</div>
		</Portal>
	);
}

export default Tooltip;
