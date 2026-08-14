import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { comboboxStyleKeys, filterComboboxItems, getSelectState, moveComboboxIndex } from '@tile-ui/core';
import type { ComboboxBaseProps, ComboboxItem } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/combobox.module.scss';

function ComboboxCheckIcon() {
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
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

function ComboboxChevronIcon() {
	return (
		<svg
			className={styles[comboboxStyleKeys.triggerIcon]}
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

export interface ComboboxProps extends React.HTMLAttributes<HTMLDivElement>, ComboboxBaseProps {}

const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
	(
		{
			className = '',
			items,
			value,
			onValueChange,
			placeholder = 'Select...',
			searchPlaceholder = 'Search...',
			emptyText = 'No items.',
			notFoundText = 'No results found.',
			maxItems,
			disabled = false,
			filter,
			...props
		},
		ref,
	) => {
		const [open, setOpen] = useState(false);
		const [query, setQuery] = useState('');
		const [activeValue, setActiveValue] = useState<string | null>(null);
		const triggerRef = useRef<HTMLButtonElement | null>(null);
		const contentRef = useRef<HTMLDivElement | null>(null);
		const contentId = useId();

		const filteredItems = useMemo(() => filterComboboxItems(items, query, maxItems, filter), [items, query, maxItems, filter]);

		const selectedItem = useMemo(() => items.find((item) => item.value === value), [items, value]);

		function setOpenState(next: boolean) {
			setOpen(next);
			if (!next) {
				setQuery('');
				setActiveValue(null);
			}
		}

		const handleTriggerClick = useCallback(() => {
			if (disabled) {
				return;
			}
			setOpenState(!open);
		}, [disabled, open]);

		const handleSelect = useCallback(
			(item: ComboboxItem) => {
				if (item.disabled) {
					return;
				}
				onValueChange?.(item.value);
				setOpenState(false);
			},
			[onValueChange],
		);

		function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				if (disabled) {
					return;
				}
				setOpenState(true);
			}
		}

		function handleContentKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
			const enabledItems = filteredItems.filter((item) => !item.disabled);
			if (enabledItems.length === 0) {
				if (event.key === 'Escape') {
					event.preventDefault();
					setOpenState(false);
				}
				return;
			}

			const currentIndex = enabledItems.findIndex((item) => item.value === activeValue);

			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					setActiveValue(enabledItems[moveComboboxIndex(currentIndex, 1, enabledItems.length)].value);
					break;
				case 'ArrowUp':
					event.preventDefault();
					setActiveValue(enabledItems[moveComboboxIndex(currentIndex, -1, enabledItems.length)].value);
					break;
				case 'Home':
					event.preventDefault();
					setActiveValue(enabledItems[0].value);
					break;
				case 'End':
					event.preventDefault();
					setActiveValue(enabledItems[enabledItems.length - 1].value);
					break;
				case 'Enter':
				case ' ':
					event.preventDefault();
					handleSelect(enabledItems[currentIndex >= 0 ? currentIndex : 0]);
					break;
				case 'Escape':
					event.preventDefault();
					setOpenState(false);
					triggerRef.current?.focus();
					break;
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
				const margin = 8;
				const left = Math.min(Math.max(triggerRect.left, margin), Math.max(margin, viewport.width - contentSize.width - margin));
				const top = Math.min(Math.max(triggerRect.bottom + 4, margin), Math.max(margin, viewport.height - contentSize.height - margin));
				content.style.top = `${top}px`;
				content.style.left = `${left}px`;
			}

			updatePosition();
			window.addEventListener('resize', updatePosition);
			document.addEventListener('scroll', updatePosition, true);

			return () => {
				window.removeEventListener('resize', updatePosition);
				document.removeEventListener('scroll', updatePosition, true);
			};
		}, [open]);

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
				setOpenState(false);
			}

			document.addEventListener('pointerdown', handlePointerDown);
			return () => document.removeEventListener('pointerdown', handlePointerDown);
		}, [open]);

		const state = getSelectState(open);
		const showEmpty = filteredItems.length === 0;
		const emptyMessage = query ? notFoundText : emptyText;

		const content = open ? (
			<div ref={contentRef} id={contentId} role="listbox" tabIndex={-1} data-state={state} className={styles[comboboxStyleKeys.content]} onKeyDown={handleContentKeyDown}>
				<div className={styles[comboboxStyleKeys.search]}>
					<input
						className={styles[comboboxStyleKeys.searchInput]}
						value={query}
						placeholder={searchPlaceholder}
						autoFocus
						onChange={(event) => {
							setQuery(event.target.value);
							setActiveValue(null);
						}}
					/>
				</div>
				<div className={styles[comboboxStyleKeys.list]}>
					{showEmpty ? (
						<div className={styles[comboboxStyleKeys.empty]}>{emptyMessage}</div>
					) : (
						filteredItems.map((item) => {
							const isActive = activeValue === item.value;
							const isSelected = item.value === value;
							return (
								<div
									key={item.value}
									role="option"
									tabIndex={-1}
									aria-selected={isSelected}
									data-highlighted={isActive}
									data-disabled={item.disabled}
									className={styles[comboboxStyleKeys.item]}
									onMouseEnter={() => {
										if (!item.disabled) {
											setActiveValue(item.value);
										}
									}}
									onClick={() => handleSelect(item)}>
									<span className={styles[comboboxStyleKeys.itemIndicator]}>{isSelected && <ComboboxCheckIcon />}</span>
									{item.label}
								</div>
							);
						})
					)}
				</div>
			</div>
		) : null;

		return (
			<div ref={ref} className={`${styles[comboboxStyleKeys.root]} ${className}`} {...props}>
				<button
					ref={triggerRef}
					type="button"
					aria-haspopup="listbox"
					aria-expanded={open}
					aria-controls={contentId}
					data-disabled={disabled}
					className={styles[comboboxStyleKeys.trigger]}
					onClick={handleTriggerClick}
					onKeyDown={handleTriggerKeyDown}>
					<span data-placeholder={!selectedItem} className={styles[comboboxStyleKeys.triggerValue]}>
						{selectedItem?.label ?? placeholder}
					</span>
					<ComboboxChevronIcon />
				</button>
				{typeof document !== 'undefined' && open ? createPortal(content, document.body) : content}
			</div>
		);
	},
);
Combobox.displayName = 'Combobox';

export { Combobox };
export default Combobox;
