import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { bubbleStyleKeys, getBubbleStyleKeys } from '@tile-ui/core';
import type { BubbleBaseProps, BubbleReactionsBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/bubble.module.scss';

export interface BubbleGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export function BubbleGroup(props: ParentProps<BubbleGroupProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} data-slot="bubble-group" class={`${styles[bubbleStyleKeys.group]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface BubbleProps extends JSX.HTMLAttributes<HTMLDivElement>, BubbleBaseProps {}
export function Bubble(props: ParentProps<BubbleProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant', 'align']);
	const keys = () => getBubbleStyleKeys(local.variant ?? 'default');
	return (
		<div
			{...rest}
			data-slot="bubble"
			data-variant={local.variant ?? 'default'}
			data-align={local.align ?? 'start'}
			class={`${styles[keys().base]} ${styles[keys().variant]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface BubbleContentProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export function BubbleContent(props: ParentProps<BubbleContentProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} data-slot="bubble-content" class={`${styles[bubbleStyleKeys.content]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface BubbleReactionsProps extends JSX.HTMLAttributes<HTMLDivElement>, BubbleReactionsBaseProps {}
export function BubbleReactions(props: ParentProps<BubbleReactionsProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'side', 'align']);
	return (
		<div
			{...rest}
			data-slot="bubble-reactions"
			data-side={local.side ?? 'bottom'}
			data-align={local.align ?? 'end'}
			class={`${styles[bubbleStyleKeys.reactions]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export default Bubble;
