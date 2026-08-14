import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getMessageScrollerButtonStyleKeys, isScrollerNearBottom, messageScrollerStyleKeys, scrollScrollerToEnd, scrollScrollerToStart } from '@tile-ui/core';
import type { MessageScrollerButtonBaseProps, MessageScrollerItemBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/message-scroller.module.scss';

interface MessageScrollerContextValue {
	viewportRef: React.RefObject<HTMLElement | null>;
	contentRef: React.RefObject<HTMLElement | null>;
	buttonActive: boolean;
	scrollable: boolean;
	registerViewport: (element: HTMLElement | null) => void;
	registerContent: (element: HTMLElement | null) => void;
	handleViewportScroll: () => void;
	scrollToEnd: (behavior?: ScrollBehavior) => void;
	scrollToStart: (behavior?: ScrollBehavior) => void;
}

const MessageScrollerContext = createContext<MessageScrollerContextValue | null>(null);

function useMessageScrollerContext(): MessageScrollerContextValue {
	const context = useContext(MessageScrollerContext);
	if (!context) {
		throw new Error('MessageScroller sub-components must be used within <MessageScrollerProvider>.');
	}
	return context;
}

export interface MessageScrollerProviderProps extends React.PropsWithChildren {}

function MessageScrollerProvider({ children }: MessageScrollerProviderProps) {
	const viewportRef = useRef<HTMLElement | null>(null);
	const contentRef = useRef<HTMLElement | null>(null);
	const stickToBottomRef = useRef(true);
	const [buttonActive, setButtonActive] = useState(false);
	const [scrollable, setScrollable] = useState(false);

	function registerViewport(element: HTMLElement | null) {
		viewportRef.current = element;
		if (element) {
			updateScrollState(element);
		}
	}

	function registerContent(element: HTMLElement | null) {
		contentRef.current = element;
	}

	function updateScrollState(viewport: HTMLElement) {
		const isScrollable = viewport.scrollHeight > viewport.clientHeight;
		const nearBottom = isScrollerNearBottom(viewport);
		stickToBottomRef.current = nearBottom;
		setScrollable(isScrollable);
		setButtonActive(isScrollable && !nearBottom);
	}

	function handleViewportScroll() {
		const viewport = viewportRef.current;
		if (viewport) {
			updateScrollState(viewport);
		}
	}

	function scrollToEnd(behavior: ScrollBehavior = 'smooth') {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		stickToBottomRef.current = true;
		scrollScrollerToEnd(viewport, behavior);
		setButtonActive(false);
	}

	function scrollToStart(behavior: ScrollBehavior = 'smooth') {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		stickToBottomRef.current = false;
		scrollScrollerToStart(viewport, behavior);
	}

	useEffect(() => {
		const content = contentRef.current;
		if (!content) {
			return;
		}
		const observer = new ResizeObserver(() => {
			const viewport = viewportRef.current;
			if (!viewport) {
				return;
			}
			updateScrollState(viewport);
			if (stickToBottomRef.current) {
				scrollScrollerToEnd(viewport, 'auto');
			}
		});
		observer.observe(content);
		return () => observer.disconnect();
	}, []);

	return (
		<MessageScrollerContext.Provider
			value={{ viewportRef, contentRef, buttonActive, scrollable, registerViewport, registerContent, handleViewportScroll, scrollToEnd, scrollToStart }}>
			{children}
		</MessageScrollerContext.Provider>
	);
}
MessageScrollerProvider.displayName = 'MessageScrollerProvider';

export interface MessageScrollerProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageScroller = React.forwardRef<HTMLDivElement, MessageScrollerProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="message-scroller" className={[styles[messageScrollerStyleKeys.root], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
});
MessageScroller.displayName = 'MessageScroller';

export interface MessageScrollerViewportProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageScrollerViewport = React.forwardRef<HTMLDivElement, MessageScrollerViewportProps>(({ className = '', children, onScroll, ...props }, ref) => {
	const context = useMessageScrollerContext();

	function setRef(element: HTMLDivElement | null) {
		context.registerViewport(element);
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	return (
		<div
			ref={setRef}
			data-slot="message-scroller-viewport"
			className={[styles[messageScrollerStyleKeys.viewport], className].filter(Boolean).join(' ')}
			onScroll={(event) => {
				context.handleViewportScroll();
				onScroll?.(event);
			}}
			{...props}>
			{children}
		</div>
	);
});
MessageScrollerViewport.displayName = 'MessageScrollerViewport';

export interface MessageScrollerContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageScrollerContent = React.forwardRef<HTMLDivElement, MessageScrollerContentProps>(({ className = '', children, ...props }, ref) => {
	const context = useMessageScrollerContext();

	function setRef(element: HTMLDivElement | null) {
		context.registerContent(element);
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	return (
		<div ref={setRef} data-slot="message-scroller-content" className={[styles[messageScrollerStyleKeys.content], className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
});
MessageScrollerContent.displayName = 'MessageScrollerContent';

export interface MessageScrollerItemProps extends React.HTMLAttributes<HTMLDivElement>, MessageScrollerItemBaseProps {}

const MessageScrollerItem = React.forwardRef<HTMLDivElement, MessageScrollerItemProps>(({ className = '', scrollAnchor = false, children, ...props }, ref) => {
	return (
		<div
			ref={ref}
			data-slot="message-scroller-item"
			data-scroll-anchor={scrollAnchor}
			className={[styles[messageScrollerStyleKeys.item], className].filter(Boolean).join(' ')}
			{...props}>
			{children}
		</div>
	);
});
MessageScrollerItem.displayName = 'MessageScrollerItem';

function ArrowDownIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<path d="M12 5v14" />
			<path d="m19 12-7 7-7-7" />
		</svg>
	);
}

export interface MessageScrollerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, MessageScrollerButtonBaseProps {
	/** 自定义按钮内容 */
	children?: React.ReactNode;
}

const MessageScrollerButton = React.forwardRef<HTMLButtonElement, MessageScrollerButtonProps>(({ className = '', direction = 'end', children, onClick, ...props }, ref) => {
	const context = useMessageScrollerContext();
	const styleKeys = getMessageScrollerButtonStyleKeys(direction);

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		if (direction === 'end') {
			context.scrollToEnd();
		} else {
			context.scrollToStart();
		}
		onClick?.(event);
	}

	return (
		<button
			ref={ref}
			type="button"
			data-slot="message-scroller-button"
			data-direction={direction}
			data-active={context.buttonActive}
			aria-label={direction === 'end' ? 'Scroll to end' : 'Scroll to start'}
			className={[styles[styleKeys.base], styles[styleKeys.direction], className].filter(Boolean).join(' ')}
			onClick={handleClick}
			{...props}>
			{children ?? <ArrowDownIcon />}
		</button>
	);
});
MessageScrollerButton.displayName = 'MessageScrollerButton';

function useMessageScroller() {
	return useMessageScrollerContext();
}

function useMessageScrollerScrollable() {
	const context = useMessageScrollerContext();
	return { scrollable: context.scrollable, isScrollable: context.scrollable };
}

function useMessageScrollerVisibility() {
	const context = useMessageScrollerContext();
	return { visible: context.buttonActive };
}

export {
	MessageScrollerProvider,
	MessageScroller,
	MessageScrollerViewport,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerButton,
	useMessageScroller,
	useMessageScrollerScrollable,
	useMessageScrollerVisibility,
};
export default MessageScroller;
