import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { getMessageStyleKeys, messageStyleKeys } from '@tile-ui/core';
import type { MessageBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/message.module.scss';

interface MessagePrimitiveProps extends JSX.HTMLAttributes<HTMLDivElement> {}

function messagePrimitive(key: 'group' | 'avatar' | 'content' | 'header' | 'footer', slot: string) {
	return (props: ParentProps<MessagePrimitiveProps>) => {
		const [local, rest] = splitProps(props, ['class', 'children']);
		return (
			<div {...rest} data-slot={slot} class={[styles[messageStyleKeys[key]], local.class].filter(Boolean).join(' ')}>
				{local.children}
			</div>
		);
	};
}

export interface MessageGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const MessageGroup = messagePrimitive('group', 'message-group');

export interface MessageProps extends JSX.HTMLAttributes<HTMLDivElement>, MessageBaseProps {}

export function Message(props: ParentProps<MessageProps>) {
	const [local, rest] = splitProps(props, ['align', 'class', 'children']);
	const align = () => local.align ?? 'start';
	const styleKeys = () => getMessageStyleKeys(align());
	const classes = () => [styles[styleKeys().base], styles[styleKeys().align], local.class].filter(Boolean).join(' ');

	return (
		<div {...rest} data-slot="message" data-align={align()} class={classes()}>
			{local.children}
		</div>
	);
}

export interface MessageAvatarProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const MessageAvatar = messagePrimitive('avatar', 'message-avatar');

export interface MessageContentProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const MessageContent = messagePrimitive('content', 'message-content');

export interface MessageHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const MessageHeader = messagePrimitive('header', 'message-header');

export interface MessageFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const MessageFooter = messagePrimitive('footer', 'message-footer');

export default Message;
