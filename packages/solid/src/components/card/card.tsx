import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { cardStyleKeys } from '@tile-ui/core';
import type { CardBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/card.module.scss';

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement>, CardBaseProps {}

/**
 * SolidJS Card：复用 core 的样式 key，样式来自共享 SCSS。
 */
export function Card(props: ParentProps<CardProps>) {
	const [local, rest] = splitProps(props, ['as', 'class', 'children']);

	return (
		<Dynamic component={local.as ?? 'div'} {...rest} class={`${styles[cardStyleKeys.card]} ${local.class ?? ''}`}>
			{local.children}
		</Dynamic>
	);
}

export interface CardHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function CardHeader(props: ParentProps<CardHeaderProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} class={`${styles[cardStyleKeys.header]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface CardTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle(props: ParentProps<CardTitleProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<h3 {...rest} class={`${styles[cardStyleKeys.title]} ${local.class ?? ''}`}>
			{local.children}
		</h3>
	);
}

export interface CardDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription(props: ParentProps<CardDescriptionProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<p {...rest} class={`${styles[cardStyleKeys.description]} ${local.class ?? ''}`}>
			{local.children}
		</p>
	);
}

export interface CardActionProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function CardAction(props: ParentProps<CardActionProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} class={`${styles[cardStyleKeys.action]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface CardContentProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function CardContent(props: ParentProps<CardContentProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} class={`${styles[cardStyleKeys.content]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface CardFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function CardFooter(props: ParentProps<CardFooterProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} class={`${styles[cardStyleKeys.footer]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export default Card;
