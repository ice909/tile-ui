import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { commandStyleKeys, matchCommandItem } from '@tile-ui/core';
import type { CommandBaseProps, CommandFilterFn } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/command.module.scss';

interface CommandContextValue {
	search: string;
	setSearch: (value: string) => void;
	filter?: CommandFilterFn;
	loop: boolean;
	itemsRef: React.RefObject<HTMLElement[]>;
	visibleCount: number;
	reportVisibility: (visible: boolean) => void;
}

const CommandContext = createContext<CommandContextValue | null>(null);

function useCommandContext(): CommandContextValue {
	const context = useContext(CommandContext);
	if (!context) {
		throw new Error('Command 子组件必须位于 <Command> 内部。');
	}
	return context;
}

function CommandSearchIcon() {
	return (
		<svg
			className={styles[commandStyleKeys.inputIcon]}
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
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.3-4.3" />
		</svg>
	);
}

export interface CommandProps extends React.HTMLAttributes<HTMLDivElement>, CommandBaseProps {}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(({ className = '', items, groups, filter, loop = true, children, ...props }, ref) => {
	const [search, setSearch] = useState('');
	const itemsRef = useRef<HTMLElement[]>([]);
	const [visibleCount, setVisibleCount] = useState(0);

	const reportVisibility = useCallback((visible: boolean) => {
		setVisibleCount((count) => count + (visible ? 1 : -1));
	}, []);

	const value = { search, setSearch, filter, loop, itemsRef, visibleCount, reportVisibility };

	const renderDataItems = (defs: { value: string; label?: string; keywords?: string[]; disabled?: boolean; shortcut?: string }[]) =>
		defs.map((item) => (
			<CommandItem key={item.value} value={item.value} keywords={item.keywords} disabled={item.disabled}>
				{item.label ?? item.value}
				{item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
			</CommandItem>
		));

	let content = children;
	if (groups && groups.length > 0) {
		content = groups.map((group) => (
			<CommandGroup key={group.value} heading={group.label}>
				{renderDataItems(group.items)}
			</CommandGroup>
		));
	} else if (items && items.length > 0) {
		content = renderDataItems(items);
	}

	return (
		<CommandContext.Provider value={value}>
			<div ref={ref} className={`${styles[commandStyleKeys.root]} ${className}`} {...props}>
				{content}
			</div>
		</CommandContext.Provider>
	);
});
Command.displayName = 'Command';

export interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(({ className = '', value, onChange, ...props }, ref) => {
	const context = useCommandContext();

	function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		onChange?.(event);
		context.setSearch(event.target.value);
	}

	return (
		<div className={styles[commandStyleKeys.inputWrapper]}>
			<CommandSearchIcon />
			<input ref={ref} value={value ?? context.search} onChange={handleChange} className={`${styles[commandStyleKeys.input]} ${className}`} {...props} />
		</div>
	);
});
CommandInput.displayName = 'CommandInput';

export interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(({ className = '', children, ...props }, ref) => {
	const { itemsRef, loop } = useCommandContext();

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		const items = itemsRef.current.filter((item) => !item.hasAttribute('hidden') && item.getAttribute('data-disabled') !== 'true');
		if (items.length === 0) {
			return;
		}

		const currentIndex = items.findIndex((item) => item.getAttribute('data-selected') === 'true');

		const highlight = (next: number) => {
			items.forEach((item) => item.removeAttribute('data-selected'));
			items[next].setAttribute('data-selected', 'true');
			items[next].scrollIntoView({ block: 'nearest' });
		};

		const nextFrom = (direction: 1 | -1): number => {
			if (currentIndex < 0) {
				return direction === 1 ? 0 : items.length - 1;
			}
			const next = currentIndex + direction;
			if (next < 0) {
				return loop ? items.length - 1 : 0;
			}
			if (next >= items.length) {
				return loop ? 0 : items.length - 1;
			}
			return next;
		};

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				highlight(nextFrom(1));
				break;
			case 'ArrowUp':
				event.preventDefault();
				highlight(nextFrom(-1));
				break;
			case 'Enter':
				event.preventDefault();
				(currentIndex >= 0 ? items[currentIndex] : items[0]).click();
				break;
		}
	}

	return (
		<div ref={ref} className={`${styles[commandStyleKeys.list]} ${className}`} onKeyDown={handleKeyDown} {...props}>
			{children}
		</div>
	);
});
CommandList.displayName = 'CommandList';

export interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandEmpty = React.forwardRef<HTMLDivElement, CommandEmptyProps>(({ className = '', children, ...props }, ref) => {
	const { visibleCount } = useCommandContext();
	if (visibleCount > 0) {
		return null;
	}
	const classes = [styles[commandStyleKeys.empty], className].filter(Boolean).join(' ');
	return (
		<div ref={ref} className={classes} {...props}>
			{children}
		</div>
	);
});
CommandEmpty.displayName = 'CommandEmpty';

export interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
	heading?: string;
}

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(({ className = '', heading, children, ...props }, ref) => {
	return (
		<div ref={ref} className={`${styles[commandStyleKeys.group]} ${className}`} {...props}>
			{heading ? <div className={styles[commandStyleKeys.groupLabel]}>{heading}</div> : null}
			<div className={styles[commandStyleKeys.groupContent]}>{children}</div>
		</div>
	);
});
CommandGroup.displayName = 'CommandGroup';

export interface CommandItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'value' | 'onSelect'> {
	value: string;
	keywords?: string[];
	disabled?: boolean;
	onSelect?: (value: string) => void;
}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(({ className = '', value, keywords, disabled = false, onSelect, children, ...props }, ref) => {
	const context = useCommandContext();
	const itemRef = useRef<HTMLDivElement | null>(null);
	const { filter: filterFn, search, itemsRef, reportVisibility } = context;

	const matches = useMemo(() => {
		if (filterFn) {
			return filterFn(value, search, keywords);
		}
		return matchCommandItem({ value, keywords }, search);
	}, [value, keywords, search, filterFn]);

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

	useEffect(() => {
		if (matches) {
			reportVisibility(true);
			return () => reportVisibility(false);
		}
	}, [matches, reportVisibility]);

	function setRef(element: HTMLDivElement | null) {
		itemRef.current = element;
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	function handleClick() {
		if (disabled) {
			return;
		}
		onSelect?.(value);
	}

	const classes = [styles[commandStyleKeys.item], className].filter(Boolean).join(' ');
	return (
		<div ref={setRef} tabIndex={-1} hidden={!matches} data-disabled={disabled} className={classes} onClick={handleClick} {...props}>
			{children}
		</div>
	);
});
CommandItem.displayName = 'CommandItem';

export interface CommandSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandSeparator = React.forwardRef<HTMLDivElement, CommandSeparatorProps>(({ className = '', ...props }, ref) => {
	const classes = [styles[commandStyleKeys.separator], className].filter(Boolean).join(' ');
	return <div ref={ref} className={classes} {...props} />;
});
CommandSeparator.displayName = 'CommandSeparator';

export interface CommandShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {}

const CommandShortcut = React.forwardRef<HTMLSpanElement, CommandShortcutProps>(({ className = '', children, ...props }, ref) => {
	const classes = [styles[commandStyleKeys.shortcut], className].filter(Boolean).join(' ');
	return (
		<span ref={ref} className={classes} {...props}>
			{children}
		</span>
	);
});
CommandShortcut.displayName = 'CommandShortcut';

export interface CommandDialogProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	title?: string;
	description?: string;
	children?: React.ReactNode;
}

const CommandDialog = ({ open = false, onOpenChange, title = 'Command Palette', description = 'Search for a command to run...', children }: CommandDialogProps) => {
	if (!open) {
		return null;
	}

	function handleOverlayClick() {
		onOpenChange?.(false);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		if (event.key === 'Escape') {
			onOpenChange?.(false);
		}
	}

	const content = (
		<div onKeyDown={handleKeyDown}>
			<div className={styles[commandStyleKeys.dialogOverlay]} onClick={handleOverlayClick} />
			<div className={styles[commandStyleKeys.dialogContent]} role="dialog" aria-modal="true">
				<h2 className={styles[commandStyleKeys.dialogTitle]}>{title}</h2>
				<p className={styles[commandStyleKeys.dialogDescription]}>{description}</p>
				{children}
			</div>
		</div>
	);

	if (typeof document === 'undefined') {
		return null;
	}

	return createPortal(content, document.body);
};
CommandDialog.displayName = 'CommandDialog';

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut, CommandDialog };
export default Command;
