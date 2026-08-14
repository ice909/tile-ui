import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { bubbleStyleKeys, getBubbleStyleKeys } from '@tile-ui/core';
import type { BubbleBaseProps, BubbleContentBaseProps, BubbleReactionsBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/bubble.module.scss';

export interface BubbleGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const BubbleGroup = React.forwardRef<HTMLDivElement, BubbleGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="bubble-group" className={[styles[bubbleStyleKeys.group], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
});
BubbleGroup.displayName = 'BubbleGroup';

export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement>, BubbleBaseProps {}

const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(({ className = '', variant = 'default', align = 'start', children, ...props }, ref) => {
	const styleKeys = getBubbleStyleKeys(variant);

	return (
		<div
			ref={ref}
			data-slot="bubble"
			data-variant={variant}
			data-align={align}
			className={[styles[styleKeys.base], styles[styleKeys.variant], className].filter(Boolean).join(' ')}
			{...props}>
			{children}
		</div>
	);
});
Bubble.displayName = 'Bubble';

export interface BubbleContentProps extends React.HTMLAttributes<HTMLDivElement>, BubbleContentBaseProps {}

const BubbleContent = React.forwardRef<HTMLDivElement, BubbleContentProps>(({ className = '', asChild = false, children, ...props }, ref) => {
	const Comp = asChild ? Slot : 'div';

	return (
		<Comp ref={ref} data-slot="bubble-content" className={[styles[bubbleStyleKeys.content], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</Comp>
	);
});
BubbleContent.displayName = 'BubbleContent';

export interface BubbleReactionsProps extends React.HTMLAttributes<HTMLDivElement>, BubbleReactionsBaseProps {}

const BubbleReactions = React.forwardRef<HTMLDivElement, BubbleReactionsProps>(({ className = '', side = 'bottom', align = 'end', children, ...props }, ref) => {
	return (
		<div
			ref={ref}
			data-slot="bubble-reactions"
			data-side={side}
			data-align={align}
			className={[styles[bubbleStyleKeys.reactions], className].filter(Boolean).join(' ')}
			{...props}>
			{children}
		</div>
	);
});
BubbleReactions.displayName = 'BubbleReactions';

export { BubbleGroup, Bubble, BubbleContent, BubbleReactions };
export default Bubble;
