import { Show, createContext, createEffect, createSignal, createUniqueId, onCleanup, onMount, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import { dialogStyleKeys, getDialogState } from '@tile-ui/core';
import type { DialogBaseProps } from '@tile-ui/core';
import { invokeEventHandler } from '../../utils/events';
import { Button } from '../button';
import styles from '@tile-ui/styles/scss/components/dialog.module.scss';

interface DialogContextValue {
	open: Accessor<boolean>;
	setOpen: (next: boolean) => void;
	close: () => void;
	contentId: Accessor<string>;
	setContentId: (id: string) => void;
	titleId: Accessor<string | undefined>;
	descriptionId: Accessor<string | undefined>;
	setTitleId: (id: string | undefined) => void;
	setDescriptionId: (id: string | undefined) => void;
}

const DialogContext = createContext<DialogContextValue>();

interface OpenDialog {
	id: symbol;
	content: () => HTMLDivElement | null;
	restoreTarget: HTMLElement | null;
}

const openDialogs: OpenDialog[] = [];
let scrollLockCount = 0;
let previousBodyOverflow = '';

function isTopDialog(id: symbol) {
	return openDialogs.at(-1)?.id === id;
}

function isElementVisible(element: HTMLElement, boundary: HTMLElement) {
	if (element.matches(':disabled')) return false;

	let current: HTMLElement | null = element;
	while (current) {
		if (current.hidden || current.hasAttribute('inert') || current.getAttribute('aria-hidden') === 'true') return false;
		const style = getComputedStyle(current);
		if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
		if (current === boundary) break;
		current = current.parentElement;
	}

	return current === boundary;
}

function lockBodyScroll() {
	if (typeof document === 'undefined') return;
	if (scrollLockCount === 0) {
		previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}
	scrollLockCount += 1;
}

function unlockBodyScroll() {
	if (typeof document === 'undefined' || scrollLockCount === 0) return;
	scrollLockCount -= 1;
	if (scrollLockCount === 0) {
		document.body.style.overflow = previousBodyOverflow;
	}
}

function useDialog(): DialogContextValue {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error('Dialog 子组件必须位于 <Dialog> 内部。');
	}
	return context;
}

export interface DialogProps extends DialogBaseProps {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: JSX.Element;
}

/**
 * SolidJS Dialog（Root）：受控 (open) / 非受控 (defaultOpen) 双模式。
 */
export function Dialog(props: DialogProps) {
	const [internal, setInternal] = createSignal(props.defaultOpen ?? false);
	const [titleId, setTitleId] = createSignal<string>();
	const [descriptionId, setDescriptionId] = createSignal<string>();
	const baseId = `tile-solid-dialog-${createUniqueId()}`;
	const [contentId, setContentId] = createSignal(`${baseId}-content`);
	const open = () => (props.open !== undefined ? props.open : internal());

	function setOpen(next: boolean) {
		if (props.open === undefined) {
			setInternal(next);
		}
		props.onOpenChange?.(next);
	}

	const value: DialogContextValue = {
		open,
		setOpen,
		close: () => setOpen(false),
		contentId,
		setContentId,
		titleId,
		descriptionId,
		setTitleId,
		setDescriptionId,
	};

	return <DialogContext.Provider value={value}>{props.children}</DialogContext.Provider>;
}

export interface DialogTriggerProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {}

export function DialogTrigger(props: ParentProps<DialogTriggerProps>) {
	const context = useDialog();
	const [local, rest] = splitProps(props, ['children', 'class', 'onClick', 'type']);

	return (
		<button
			{...rest}
			type={local.type ?? 'button'}
			class={local.class}
			aria-haspopup="dialog"
			aria-expanded={context.open()}
			aria-controls={context.open() ? context.contentId() : undefined}
			onClick={(event) => {
				invokeEventHandler(local.onClick as Parameters<typeof invokeEventHandler<MouseEvent>>[0], event);
				if (!event.defaultPrevented) {
					context.setOpen(true);
				}
			}}>
			{local.children}
		</button>
	);
}

export interface DialogCloseProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {}

export function DialogClose(props: ParentProps<DialogCloseProps>) {
	const context = useDialog();
	const [local, rest] = splitProps(props, ['children', 'class', 'onClick', 'type']);

	return (
		<button
			{...rest}
			type={local.type ?? 'button'}
			class={local.class}
			onClick={(event) => {
				invokeEventHandler(local.onClick as Parameters<typeof invokeEventHandler<MouseEvent>>[0], event);
				if (!event.defaultPrevented) {
					context.close();
				}
			}}>
			{local.children}
		</button>
	);
}

export interface DialogOverlayProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function DialogOverlay(props: DialogOverlayProps) {
	const context = useDialog();
	const [local, rest] = splitProps(props, ['class', 'onClick', 'children']);

	return (
		<Show when={context.open()}>
			<div
				{...rest}
				data-state={getDialogState(context.open())}
				class={`${styles[dialogStyleKeys.overlay]} ${local.class ?? ''}`}
				onClick={(event) => {
					invokeEventHandler(local.onClick as Parameters<typeof invokeEventHandler<MouseEvent>>[0], event);
					if (!event.defaultPrevented && event.target === event.currentTarget) {
						context.close();
					}
				}}>
				{local.children}
			</div>
		</Show>
	);
}

export interface DialogContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
	showCloseButton?: boolean;
	container?: Node;
	overlayClass?: string;
}

/**
 * SolidJS DialogContent：支持 Portal 容器、焦点陷阱、Escape、滚动锁定与焦点还原。
 */
export function DialogContent(props: ParentProps<DialogContentProps>) {
	const context = useDialog();
	const [local, rest] = splitProps(props, ['children', 'class', 'showCloseButton', 'container', 'overlayClass', 'id', 'aria-label', 'aria-labelledby', 'aria-describedby']);
	let contentRef: HTMLDivElement | null = null;
	const dialogId = Symbol('tile-dialog');
	const contentId = () => local.id ?? context.contentId();

	context.setContentId(contentId());
	createEffect(() => {
		context.setContentId(contentId());
	});

	createEffect(() => {
		if (!context.open() || typeof document === 'undefined') {
			return;
		}

		const entry: OpenDialog = {
			id: dialogId,
			content: () => contentRef,
			restoreTarget: document.activeElement instanceof HTMLElement ? document.activeElement : null,
		};
		openDialogs.push(entry);
		lockBodyScroll();

		const handleKeyDown = (event: KeyboardEvent) => {
			if (!isTopDialog(dialogId)) {
				return;
			}

			if (event.key === 'Escape') {
				event.preventDefault();
				context.close();
				return;
			}

			if (event.key !== 'Tab' || !contentRef) {
				return;
			}
			const container = contentRef;

			const focusables = Array.from(
				container.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
				),
			).filter((element) => isElementVisible(element, container));

			if (focusables.length === 0) {
				event.preventDefault();
				container.focus();
				return;
			}

			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			const active = document.activeElement;
			if (event.shiftKey && (active === first || active === container || !container.contains(active))) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && (active === last || active === container || !container.contains(active))) {
				event.preventDefault();
				first.focus();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		queueMicrotask(() => {
			if (isTopDialog(dialogId)) contentRef?.focus();
		});

		onCleanup(() => {
			document.removeEventListener('keydown', handleKeyDown);
			const wasTop = isTopDialog(dialogId);
			const index = openDialogs.findIndex((dialog) => dialog.id === dialogId);
			if (index !== -1) {
				const nextDialog = openDialogs[index + 1];
				if (nextDialog) nextDialog.restoreTarget = entry.restoreTarget;
				openDialogs.splice(index, 1);
			}
			unlockBodyScroll();
			if (wasTop) {
				const nextTop = openDialogs.at(-1)?.content();
				if (nextTop) nextTop.focus();
				else if (entry.restoreTarget?.isConnected) entry.restoreTarget.focus();
			}
		});
	});

	return (
		<Show when={context.open()}>
			<Portal mount={local.container}>
				<DialogOverlay class={local.overlayClass} />
				<div
					{...rest}
					ref={(element) => {
						contentRef = element;
					}}
					id={contentId()}
					role="dialog"
					aria-modal="true"
					aria-label={local['aria-label']}
					aria-labelledby={local['aria-labelledby'] ?? (local['aria-label'] ? undefined : context.titleId())}
					aria-describedby={local['aria-describedby'] ?? context.descriptionId()}
					tabIndex={-1}
					data-state={getDialogState(context.open())}
					class={`${styles[dialogStyleKeys.content]} ${local.class ?? ''}`}>
					{local.children}
					<Show when={local.showCloseButton !== false}>
						<button type="button" aria-label="关闭" class={styles[dialogStyleKeys.close]} onClick={() => context.close()}>
							<svg
								class={styles[dialogStyleKeys.xIcon]}
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
						</button>
					</Show>
				</div>
			</Portal>
		</Show>
	);
}

export interface DialogHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function DialogHeader(props: ParentProps<DialogHeaderProps>) {
	const [local, rest] = splitProps(props, ['children', 'class']);
	return (
		<div {...rest} class={`${styles[dialogStyleKeys.header]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface DialogFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {
	showCloseButton?: boolean;
}

export function DialogFooter(props: ParentProps<DialogFooterProps>) {
	const context = useDialog();
	const [local, rest] = splitProps(props, ['children', 'class', 'showCloseButton']);
	return (
		<div {...rest} class={`${styles[dialogStyleKeys.footer]} ${local.class ?? ''}`}>
			{local.children}
			<Show when={local.showCloseButton}>
				<Button type="button" variant="outline" onClick={() => context.close()}>
					Close
				</Button>
			</Show>
		</div>
	);
}

export interface DialogTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {}

export function DialogTitle(props: ParentProps<DialogTitleProps>) {
	const context = useDialog();
	const [local, rest] = splitProps(props, ['children', 'class', 'id']);
	const id = local.id ?? `${context.contentId()}-title`;

	onMount(() => {
		context.setTitleId(id);
		onCleanup(() => {
			if (context.titleId() === id) {
				context.setTitleId(undefined);
			}
		});
	});

	return (
		<h2 {...rest} id={id} class={`${styles[dialogStyleKeys.title]} ${local.class ?? ''}`}>
			{local.children}
		</h2>
	);
}

export interface DialogDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {}

export function DialogDescription(props: ParentProps<DialogDescriptionProps>) {
	const context = useDialog();
	const [local, rest] = splitProps(props, ['children', 'class', 'id']);
	const id = local.id ?? `${context.contentId()}-description`;

	onMount(() => {
		context.setDescriptionId(id);
		onCleanup(() => {
			if (context.descriptionId() === id) {
				context.setDescriptionId(undefined);
			}
		});
	});

	return (
		<p {...rest} id={id} class={`${styles[dialogStyleKeys.description]} ${local.class ?? ''}`}>
			{local.children}
		</p>
	);
}

export { Dialog as default };
