import { createContext, createEffect, createSignal, createUniqueId, onCleanup, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import { getPopoverPosition, getPopoverState, popoverStyleKeys, resolvePopoverSide } from '@tile-ui/core';
import type { PopoverBaseProps, PopoverContentBaseProps } from '@tile-ui/core';
import {
	createAnchoredPosition,
	createControllableSignal,
	createPortalScope,
	invokeEventHandler,
	isNodeValue,
	PortalScopeContext,
	registerDismissableLayer,
	resolvePortalContainer,
	usePortalScope,
	type CallbackRef,
	type DismissableLayerEvent,
	type DismissableLayerOutsideEvent,
	type PortalScope,
} from '../../utils';
import styles from '@tile-ui/styles/scss/components/popover.module.scss';

interface PopoverContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean, reason?: PopoverCloseReason) => void;
	trigger: Accessor<HTMLButtonElement | undefined>;
	setTrigger: (element: HTMLButtonElement) => void;
	triggerId: Accessor<string>;
	contentId: Accessor<string>;
	closeReason: Accessor<PopoverCloseReason>;
	setTriggerId: (id: string) => void;
	setContentId: (id: string) => void;
	setCloseReason: (reason: PopoverCloseReason) => void;
	portalScope: PortalScope;
	parentPortalScope?: PortalScope;
	setPortalContainer: (container: Node | undefined) => void;
}

type PopoverCloseReason = 'programmatic' | 'escape' | 'pointer-outside' | 'focus-outside';

const POINTER_FOCUS_TARGET_SELECTOR = 'a[href], area[href], button, input, select, textarea, iframe, [contenteditable="true"], [tabindex]';

function pointerTargetsFocusableElement(target: EventTarget | null): boolean {
	if (!isNodeValue(target)) return false;
	const ElementConstructor = target.ownerDocument?.defaultView?.Element;
	if (!ElementConstructor) return false;
	const element = target.nodeType === 1 ? (target as Element) : target.parentElement;
	const candidate = element?.closest(POINTER_FOCUS_TARGET_SELECTOR);
	if (!candidate || !(candidate instanceof ElementConstructor)) return false;
	return !candidate.matches(':disabled, [aria-disabled="true"], [hidden], [inert]');
}

const PopoverContext = createContext<PopoverContextValue>();

function usePopover() {
	const context = useContext(PopoverContext);
	if (!context) throw new Error('PopoverTrigger and PopoverContent must be used within <Popover>.');
	return context;
}

export interface PopoverProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, PopoverBaseProps {
	triggerId?: string;
	contentId?: string;
	ref?: CallbackRef<HTMLDivElement>;
}

/** SolidJS Popover：非模态锚定层，支持嵌套 portal 分支、外部关闭和焦点还原。 */
export function Popover(props: ParentProps<PopoverProps>) {
	const parentPortalScope = usePortalScope();
	const [local, rest] = splitProps(props, ['open', 'defaultOpen', 'onOpenChange', 'triggerId', 'contentId', 'class', 'children', 'ref']);
	const [open, setOpen] = createControllableSignal({
		value: () => local.open,
		defaultValue: () => local.defaultOpen ?? false,
		onChange: (next) => local.onOpenChange?.(next),
	});
	const [closeReason, setCloseReason] = createSignal<PopoverCloseReason>('programmatic');
	const requestOpen = (next: boolean, reason: PopoverCloseReason = 'programmatic') => {
		setCloseReason(next ? 'programmatic' : reason);
		setOpen(next);
	};
	createEffect(() => {
		if (open()) setCloseReason('programmatic');
	});
	const baseId = `tile-solid-popover-${createUniqueId()}`;
	const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
	const [triggerId, setTriggerId] = createSignal(local.triggerId ?? `${baseId}-trigger`);
	const [contentId, setContentId] = createSignal(local.contentId ?? `${baseId}-content`);
	const [portalContainer, setPortalContainer] = createSignal<Node>();
	const portalScope = createPortalScope(portalContainer, parentPortalScope);
	const context: PopoverContextValue = {
		open,
		setOpen: requestOpen,
		trigger,
		setTrigger,
		triggerId,
		contentId,
		closeReason,
		setTriggerId,
		setContentId,
		setCloseReason,
		portalScope,
		parentPortalScope,
		setPortalContainer,
	};

	return (
		<PopoverContext.Provider value={context}>
			<PortalScopeContext.Provider value={portalScope}>
				<div {...rest} ref={local.ref} data-slot="popover" data-state={getPopoverState(open())} class={`${styles[popoverStyleKeys.root]} ${local.class ?? ''}`}>
					{local.children}
				</div>
			</PortalScopeContext.Provider>
		</PopoverContext.Provider>
	);
}

export interface PopoverTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}

export function PopoverTrigger(props: ParentProps<PopoverTriggerProps>) {
	const context = usePopover();
	const [local, rest] = splitProps(props, ['id', 'class', 'children', 'ref', 'type', 'onClick']);
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
			aria-haspopup="dialog"
			aria-expanded={context.open()}
			aria-controls={context.contentId()}
			data-slot="popover-trigger"
			data-state={getPopoverState(context.open())}
			class={`${styles[popoverStyleKeys.trigger]} ${local.class ?? ''}`}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented) context.setOpen(!context.open());
			}}>
			{local.children}
		</button>
	);
}

export interface PopoverContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, PopoverContentBaseProps {
	container?: Node;
	ref?: CallbackRef<HTMLDivElement>;
	onEscapeKeyDown?: (event: DismissableLayerEvent<KeyboardEvent>) => void;
	onPointerDownOutside?: (event: DismissableLayerEvent<PointerEvent>) => void;
	onFocusOutside?: (event: DismissableLayerEvent<FocusEvent>) => void;
	onInteractOutside?: (event: DismissableLayerEvent<DismissableLayerOutsideEvent>) => void;
}

export function PopoverContent(props: ParentProps<PopoverContentProps>) {
	const context = usePopover();
	const [local, rest] = splitProps(props, [
		'id',
		'class',
		'children',
		'container',
		'ref',
		'side',
		'align',
		'sideOffset',
		'onEscapeKeyDown',
		'onPointerDownOutside',
		'onFocusOutside',
		'onInteractOutside',
	]);
	const id = () => local.id ?? context.contentId();
	const side = () => local.side ?? 'bottom';
	const [resolvedSide, setResolvedSide] = createSignal(side());
	const align = () => local.align ?? 'center';
	const sideOffset = () => local.sideOffset ?? 4;
	let content: HTMLDivElement | undefined;
	let removeBranch: (() => void) | undefined;
	let position: ReturnType<typeof createAnchoredPosition> | undefined;
	let pointerOutsideTarget: EventTarget | null = null;
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
				const nextSide = resolvePopoverSide(side(), direction === 'rtl');
				setResolvedSide(nextSide);
				const next = getPopoverPosition({
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
				context.setCloseReason('escape');
				if (event.originalEvent.defaultPrevented) event.preventDefault();
				local.onEscapeKeyDown?.(event);
				if (event.defaultPrevented) context.setCloseReason('programmatic');
			},
			onPointerDownOutside: (event) => {
				context.setCloseReason('pointer-outside');
				pointerOutsideTarget = event.originalEvent.target;
				local.onPointerDownOutside?.(event);
				if (event.defaultPrevented) {
					pointerOutsideTarget = null;
					context.setCloseReason('programmatic');
				}
			},
			onFocusOutside: (event) => {
				context.setCloseReason('focus-outside');
				local.onFocusOutside?.(event);
				if (event.defaultPrevented) context.setCloseReason('programmatic');
			},
			onInteractOutside: local.onInteractOutside,
			onDismiss: () => context.setOpen(false, context.closeReason()),
		});
		queueMicrotask(() => {
			layer.update();
			if (context.open() && content && !content.contains(content.ownerDocument.activeElement)) content.focus({ preventScroll: true });
		});
		onCleanup(() => {
			layer.destroy();
			position?.destroy();
			position = undefined;
			context.setPortalContainer(undefined);
			const ownerDocument = content?.ownerDocument;
			const active = ownerDocument?.activeElement;
			const reason = context.closeReason();
			if ((reason === 'escape' || reason === 'programmatic') && active && content?.contains(active) && context.trigger()?.isConnected)
				context.trigger()!.focus({ preventScroll: true });
			if (reason === 'pointer-outside' && !pointerTargetsFocusableElement(pointerOutsideTarget)) {
				ownerDocument?.defaultView?.setTimeout(() => {
					const nextActive = ownerDocument.activeElement;
					if (
						(nextActive === ownerDocument.body || nextActive === ownerDocument.documentElement || (nextActive && content?.contains(nextActive))) &&
						context.trigger()?.isConnected
					)
						context.trigger()!.focus({ preventScroll: true });
				}, 0);
			}
			pointerOutsideTarget = null;
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
				aria-labelledby={context.triggerId()}
				tabIndex={-1}
				hidden={!context.open()}
				data-slot="popover-content"
				data-state={getPopoverState(context.open())}
				data-side={resolvedSide()}
				data-align={align()}
				class={`${styles[popoverStyleKeys.content]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		</Portal>
	);
}

export default Popover;
