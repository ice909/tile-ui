import React from 'react';
import { getMessageStyleKeys, messageStyleKeys } from '@tile-ui/core';
import type { MessageBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/message.module.scss';

export interface MessageGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageGroup = React.forwardRef<HTMLDivElement, MessageGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="message-group" className={[styles[messageStyleKeys.group], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
});
MessageGroup.displayName = 'MessageGroup';

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement>, MessageBaseProps {}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(({ className = '', align = 'start', children, ...props }, ref) => {
	const styleKeys = getMessageStyleKeys(align);

	return (
		<div ref={ref} data-slot="message" data-align={align} className={[styles[styleKeys.base], styles[styleKeys.align], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
});
Message.displayName = 'Message';

export interface MessageAvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageAvatar = React.forwardRef<HTMLDivElement, MessageAvatarProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="message-avatar" className={[styles[messageStyleKeys.avatar], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
});
MessageAvatar.displayName = 'MessageAvatar';

export interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="message-content" className={[styles[messageStyleKeys.content], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
});
MessageContent.displayName = 'MessageContent';

export interface MessageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageHeader = React.forwardRef<HTMLDivElement, MessageHeaderProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="message-header" className={[styles[messageStyleKeys.header], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
});
MessageHeader.displayName = 'MessageHeader';

export interface MessageFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageFooter = React.forwardRef<HTMLDivElement, MessageFooterProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="message-footer" className={[styles[messageStyleKeys.footer], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
});
MessageFooter.displayName = 'MessageFooter';

export { MessageGroup, Message, MessageAvatar, MessageContent, MessageHeader, MessageFooter };
export default Message;
