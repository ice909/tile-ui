import { createContext, createUniqueId, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { collapsibleStyleKeys, getCollapsibleState, getNextCollapsibleOpen } from '@tile-ui/core';
import type { CollapsibleBaseProps } from '@tile-ui/core';
import { createControllableSignal, invokeEventHandler } from '../../utils';
import styles from '@tile-ui/styles/scss/components/collapsible.module.scss';

interface CollapsibleContextValue {
	open: Accessor<boolean>;
	disabled: Accessor<boolean>;
	triggerId: Accessor<string>;
	contentId: Accessor<string>;
	toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue>();

function useCollapsible() {
	const context = useContext(CollapsibleContext);
	if (!context) throw new Error('CollapsibleTrigger and CollapsibleContent must be used within <Collapsible>.');
	return context;
}

export type CollapsibleRef<T> = (element: T) => void;

export interface CollapsibleProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, CollapsibleBaseProps {
	onOpenChange?: (open: boolean) => void;
	/** 预声明 Trigger ID，使 SSR 输出中的 aria-labelledby 保持精确。 */
	triggerId?: string;
	/** 预声明 Content ID，使先渲染的 Trigger 在 SSR 中获得精确 aria-controls。 */
	contentId?: string;
	ref?: CollapsibleRef<HTMLDivElement>;
}

/** SolidJS Collapsible：支持受控/非受控状态、原生隐藏语义与稳定 ARIA 关联。 */
export function Collapsible(props: ParentProps<CollapsibleProps>) {
	const [local, rest] = splitProps(props, ['open', 'defaultOpen', 'onOpenChange', 'disabled', 'triggerId', 'contentId', 'class', 'children', 'ref']);
	const initialOpen = local.defaultOpen ?? false;
	const [open, setOpen] = createControllableSignal<boolean>({
		value: () => local.open,
		defaultValue: () => initialOpen,
		onChange: (next) => local.onOpenChange?.(next),
	});
	const baseId = `tile-solid-collapsible-${createUniqueId()}`;
	const triggerId = () => local.triggerId ?? `${baseId}-trigger`;
	const contentId = () => local.contentId ?? `${baseId}-content`;
	const disabled = () => local.disabled ?? false;
	const context: CollapsibleContextValue = {
		open,
		disabled,
		triggerId,
		contentId,
		toggle: () => {
			if (!disabled()) setOpen(getNextCollapsibleOpen(open()));
		},
	};

	return (
		<CollapsibleContext.Provider value={context}>
			<div
				{...rest}
				ref={local.ref}
				data-slot="collapsible"
				data-state={getCollapsibleState(open())}
				data-disabled={disabled() || undefined}
				class={`${styles[collapsibleStyleKeys.root]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		</CollapsibleContext.Provider>
	);
}

export interface CollapsibleTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'id' | 'ref'> {
	ref?: CollapsibleRef<HTMLButtonElement>;
}

export function CollapsibleTrigger(props: ParentProps<CollapsibleTriggerProps>) {
	const context = useCollapsible();
	const [local, rest] = splitProps(props, ['class', 'children', 'disabled', 'onClick', 'ref', 'type']);
	const disabled = () => context.disabled() || (local.disabled ?? false);

	return (
		<button
			{...rest}
			ref={local.ref}
			id={context.triggerId()}
			type={local.type ?? 'button'}
			aria-expanded={context.open()}
			aria-controls={context.contentId()}
			data-slot="collapsible-trigger"
			data-state={getCollapsibleState(context.open())}
			data-disabled={disabled() || undefined}
			disabled={disabled()}
			class={`${styles[collapsibleStyleKeys.trigger]} ${local.class ?? ''}`}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented && !disabled()) context.toggle();
			}}>
			{local.children}
		</button>
	);
}

export interface CollapsibleContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'id' | 'ref'> {
	ref?: CollapsibleRef<HTMLDivElement>;
}

export function CollapsibleContent(props: ParentProps<CollapsibleContentProps>) {
	const context = useCollapsible();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<div
			{...rest}
			ref={local.ref}
			id={context.contentId()}
			role="region"
			aria-labelledby={context.triggerId()}
			data-slot="collapsible-content"
			data-state={getCollapsibleState(context.open())}
			hidden={!context.open()}
			class={`${styles[collapsibleStyleKeys.content]} ${local.class ?? ''}`}>
			<div class={styles[collapsibleStyleKeys.contentInner]}>{local.children}</div>
		</div>
	);
}

export default Collapsible;
