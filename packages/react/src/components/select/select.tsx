import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSelectCheckState, getSelectPosition, getSelectState, selectStyleKeys } from '@tile-ui/core';
import type { SelectBaseProps, SelectContentBaseProps, SelectItemBaseProps, SelectPositionResult, SelectTriggerBaseProps } from '@tile-ui/core';
import { usePortalContainer, type PortalContainer } from '../portal';
import styles from '@tile-ui/styles/scss/components/select.module.scss';

interface SelectContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	value: string | undefined;
	setValue: (value: string) => void;
	triggerRef: React.RefObject<HTMLButtonElement | null>;
	contentId: string;
	itemTexts: Record<string, string>;
	registerItemText: (value: string, text: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(): SelectContextValue {
	const context = useContext(SelectContext);
	if (!context) {
		throw new Error('Select 子组件必须位于 <Select> 内部。');
	}
	return context;
}

interface SelectContentContextValue {
	itemsRef: React.RefObject<HTMLElement[]>;
	close: () => void;
}

const SelectContentContext = createContext<SelectContentContextValue | null>(null);

function useSelectContentContext(): SelectContentContextValue {
	const context = useContext(SelectContentContext);
	if (!context) {
		throw new Error('SelectItem 必须位于 <SelectContent> 内部。');
	}
	return context;
}

function SelectCheckIcon() {
	return (
		<svg
			className={styles[selectStyleKeys.checkIcon]}
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
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

function SelectChevronIcon() {
	return (
		<svg
			className={styles[selectStyleKeys.chevron]}
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
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'>, SelectBaseProps {}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
	({ className = '', open, defaultOpen = false, onOpenChange, value, defaultValue, onValueChange, children, ...props }, ref) => {
		const [internalOpen, setInternalOpen] = useState(defaultOpen);
		const isOpen = open !== undefined ? open : internalOpen;

		const [internalValue, setInternalValue] = useState(defaultValue);
		const resolvedValue = value !== undefined ? value : internalValue;

		const triggerRef = useRef<HTMLButtonElement | null>(null);
		const contentId = useId();
		const [itemTexts, setItemTexts] = useState<Record<string, string>>({});

		const setOpen = useCallback(
			(next: boolean) => {
				if (open === undefined) {
					setInternalOpen(next);
				}
				onOpenChange?.(next);
			},
			[open, onOpenChange],
		);

		const setValue = useCallback(
			(next: string) => {
				if (value === undefined) {
					setInternalValue(next);
				}
				onValueChange?.(next);
			},
			[value, onValueChange],
		);

		const registerItemText = useCallback((itemValue: string, text: string) => {
			setItemTexts((prev) => (prev[itemValue] === text ? prev : { ...prev, [itemValue]: text }));
		}, []);

		return (
			<SelectContext.Provider value={{ open: isOpen, setOpen, value: resolvedValue, setValue, triggerRef, contentId, itemTexts, registerItemText }}>
				<div ref={ref} className={`${styles[selectStyleKeys.root]} ${className}`} {...props}>
					{children}
				</div>
			</SelectContext.Provider>
		);
	},
);
Select.displayName = 'Select';

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, SelectTriggerBaseProps {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(({ className = '', size = 'default', children, onClick, onKeyDown, ...props }, ref) => {
	const context = useSelectContext();

	function setRef(element: HTMLButtonElement | null) {
		context.triggerRef.current = element;
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		onClick?.(event);
		if (event.defaultPrevented) {
			return;
		}
		context.setOpen(!context.open);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		onKeyDown?.(event);
		if (event.defaultPrevented) {
			return;
		}
		if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			context.setOpen(true);
		}
	}

	const state = getSelectState(context.open);
	const classes = [styles[selectStyleKeys.trigger], className].filter(Boolean).join(' ');

	return (
		<button
			ref={setRef}
			type="button"
			role="combobox"
			aria-haspopup="listbox"
			aria-expanded={context.open}
			aria-controls={context.contentId}
			data-state={state}
			data-size={size}
			className={classes}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			{...props}>
			{children}
			<SelectChevronIcon />
		</button>
	);
});
SelectTrigger.displayName = 'SelectTrigger';

export interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
	/** 未选中时展示的占位文本 */
	placeholder?: string;
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(({ className = '', placeholder, children, ...props }, ref) => {
	const { value, itemTexts } = useSelectContext();
	const text = value !== undefined ? itemTexts[value] : undefined;
	const showPlaceholder = !text;
	const classes = [styles[selectStyleKeys.value], className].filter(Boolean).join(' ');

	return (
		<span ref={ref} data-placeholder={showPlaceholder} className={classes} {...props}>
			{text ?? placeholder ?? children}
		</span>
	);
});
SelectValue.displayName = 'SelectValue';

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement>, SelectContentBaseProps {
	container?: PortalContainer;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
	({ className = '', position = 'item-aligned', align = 'center', sideOffset = 4, container, children, onKeyDown, ...props }, ref) => {
		const { open, setOpen, triggerRef, contentId } = useSelectContext();
		const portalContainer = usePortalContainer(container);
		const [coords, setCoords] = useState<SelectPositionResult | null>(null);
		const contentRef = useRef<HTMLDivElement | null>(null);
		const itemsRef = useRef<HTMLElement[]>([]);

		function setRef(element: HTMLDivElement | null) {
			contentRef.current = element;
			if (typeof ref === 'function') {
				ref(element);
			} else if (ref) {
				ref.current = element;
			}
		}

		useLayoutEffect(() => {
			if (!open) {
				return;
			}

			function updatePosition() {
				const trigger = triggerRef.current;
				const content = contentRef.current;
				if (!trigger || !content) {
					return;
				}

				const triggerRect = trigger.getBoundingClientRect();
				const contentSize = { width: content.offsetWidth, height: content.offsetHeight };
				const viewport = { width: window.innerWidth, height: window.innerHeight };
				setCoords(getSelectPosition({ triggerRect, contentSize, align, sideOffset, viewport }));
			}

			function highlightSelected() {
				const items = itemsRef.current;
				items.forEach((item) => item.removeAttribute('data-highlighted'));
				const selected = items.find((item) => item.getAttribute('aria-selected') === 'true');
				const target = selected ?? items[0];
				if (target) {
					target.setAttribute('data-highlighted', 'true');
					target.focus();
				}
			}

			updatePosition();
			highlightSelected();
			window.addEventListener('resize', updatePosition);
			document.addEventListener('scroll', updatePosition, true);

			return () => {
				window.removeEventListener('resize', updatePosition);
				document.removeEventListener('scroll', updatePosition, true);
			};
		}, [open, align, sideOffset, triggerRef]);

		useEffect(() => {
			if (!open) {
				return;
			}

			function handlePointerDown(event: PointerEvent) {
				const target = event.target as Node | null;
				if (!target) {
					return;
				}
				const content = contentRef.current;
				const trigger = triggerRef.current;
				if (content && content.contains(target)) {
					return;
				}
				if (trigger && trigger.contains(target)) {
					return;
				}
				setOpen(false);
			}

			document.addEventListener('pointerdown', handlePointerDown);
			return () => document.removeEventListener('pointerdown', handlePointerDown);
		}, [open, triggerRef, setOpen]);

		function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
			onKeyDown?.(event);
			if (event.defaultPrevented) {
				return;
			}

			const items = itemsRef.current.filter((item) => item.getAttribute('data-disabled') !== 'true');
			if (items.length === 0) {
				if (event.key === 'Escape') {
					event.preventDefault();
					setOpen(false);
					triggerRef.current?.focus();
				}
				return;
			}

			const currentIndex = items.findIndex((item) => item.getAttribute('data-highlighted') === 'true');

			const highlight = (next: number) => {
				items.forEach((item) => item.removeAttribute('data-highlighted'));
				items[next].setAttribute('data-highlighted', 'true');
				items[next].focus();
			};

			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					highlight(currentIndex < 0 ? 0 : (currentIndex + 1) % items.length);
					break;
				case 'ArrowUp':
					event.preventDefault();
					highlight(currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length);
					break;
				case 'Home':
					event.preventDefault();
					highlight(0);
					break;
				case 'End':
					event.preventDefault();
					highlight(items.length - 1);
					break;
				case 'Enter':
				case ' ':
					event.preventDefault();
					(currentIndex >= 0 ? items[currentIndex] : items[0]).click();
					break;
				case 'Escape':
					event.preventDefault();
					setOpen(false);
					triggerRef.current?.focus();
					break;
			}
		}

		const state = getSelectState(open);
		const classes = [styles[selectStyleKeys.content], className].filter(Boolean).join(' ');

		const content = (
			<SelectContentContext.Provider value={{ itemsRef, close: () => setOpen(false) }}>
				<div
					ref={setRef}
					id={contentId}
					role="listbox"
					tabIndex={-1}
					data-state={state}
					data-position={position}
					className={classes}
					style={coords ? { top: `${coords.top}px`, left: `${coords.left}px` } : undefined}
					onKeyDown={handleKeyDown}
					{...props}>
					{children}
				</div>
			</SelectContentContext.Provider>
		);

		if (!portalContainer) {
			return null;
		}

		return createPortal(content, portalContainer);
	},
);
SelectContent.displayName = 'SelectContent';

export interface SelectGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectGroup = React.forwardRef<HTMLDivElement, SelectGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} role="group" className={`${styles[selectStyleKeys.group]} ${className}`} {...props}>
			{children}
		</div>
	);
});
SelectGroup.displayName = 'SelectGroup';

export interface SelectLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectLabel = React.forwardRef<HTMLDivElement, SelectLabelProps>(({ className = '', children, ...props }, ref) => {
	const classes = [styles[selectStyleKeys.label], className].filter(Boolean).join(' ');
	return (
		<div ref={ref} className={classes} {...props}>
			{children}
		</div>
	);
});
SelectLabel.displayName = 'SelectLabel';

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement>, SelectItemBaseProps {}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(({ className = '', value, disabled = false, children, onClick, ...props }, ref) => {
	const { itemsRef, close } = useSelectContentContext();
	const { value: selectedValue, setValue, registerItemText } = useSelectContext();
	const itemRef = useRef<HTMLDivElement | null>(null);
	const isSelected = selectedValue === value;

	useEffect(() => {
		const element = itemRef.current;
		if (!element) {
			return;
		}
		itemsRef.current.push(element);
		return () => {
			itemsRef.current = itemsRef.current.filter((item) => item !== element);
		};
	}, [itemsRef]);

	useLayoutEffect(() => {
		const element = itemRef.current;
		if (element) {
			registerItemText(value, element.textContent ?? '');
		}
	}, [value, registerItemText, children]);

	function setRef(element: HTMLDivElement | null) {
		itemRef.current = element;
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	function handleClick(event: React.MouseEvent<HTMLDivElement>) {
		onClick?.(event);
		if (event.defaultPrevented) {
			return;
		}
		if (disabled) {
			return;
		}
		setValue(value);
		close();
	}

	const classes = [styles[selectStyleKeys.item], className].filter(Boolean).join(' ');
	return (
		<div
			ref={setRef}
			role="option"
			tabIndex={-1}
			aria-selected={isSelected}
			data-checked={getSelectCheckState(isSelected)}
			data-disabled={disabled}
			className={classes}
			onClick={handleClick}
			{...props}>
			<span className={styles[selectStyleKeys.indicator]}>{isSelected && <SelectCheckIcon />}</span>
			{children}
		</div>
	);
});
SelectItem.displayName = 'SelectItem';

export interface SelectSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(({ className = '', ...props }, ref) => {
	const classes = [styles[selectStyleKeys.separator], className].filter(Boolean).join(' ');
	return <div ref={ref} role="separator" className={classes} {...props} />;
});
SelectSeparator.displayName = 'SelectSeparator';

export interface SelectScrollUpButtonProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectScrollUpButton = React.forwardRef<HTMLDivElement, SelectScrollUpButtonProps>(({ className = '', ...props }, ref) => {
	const classes = [styles[selectStyleKeys.scrollButton], className].filter(Boolean).join(' ');
	return (
		<div ref={ref} className={classes} {...props}>
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
				<path d="m18 15-6-6-6 6" />
			</svg>
		</div>
	);
});
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

export interface SelectScrollDownButtonProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectScrollDownButton = React.forwardRef<HTMLDivElement, SelectScrollDownButtonProps>(({ className = '', ...props }, ref) => {
	const classes = [styles[selectStyleKeys.scrollButton], className].filter(Boolean).join(' ');
	return (
		<div ref={ref} className={classes} {...props}>
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
				<path d="m6 9 6 6 6-6" />
			</svg>
		</div>
	);
});
SelectScrollDownButton.displayName = 'SelectScrollDownButton';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton };
export default Select;
