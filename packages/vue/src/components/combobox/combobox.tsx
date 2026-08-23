import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, useId, watch, Teleport, type PropType } from 'vue';
import { comboboxStyleKeys, filterComboboxItems, getSelectState, moveComboboxIndex } from '@tile-ui/core';
import type { ComboboxItem } from '@tile-ui/core';
import { usePortalContainer, type PortalContainer } from '../portal';
import styles from '@tile-ui/styles/scss/components/combobox.module.scss';

function comboboxCheckIcon() {
	return h(
		'svg',
		{
			xmlns: 'http://www.w3.org/2000/svg',
			width: '16',
			height: '16',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			'aria-hidden': 'true',
		},
		[h('path', { d: 'M20 6 9 17l-5-5' })],
	);
}

function comboboxChevronIcon() {
	return h(
		'svg',
		{
			class: styles[comboboxStyleKeys.triggerIcon],
			xmlns: 'http://www.w3.org/2000/svg',
			width: '16',
			height: '16',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			'aria-hidden': 'true',
		},
		[h('path', { d: 'm6 9 6 6 6-6' })],
	);
}

export const Combobox = defineComponent({
	name: 'Combobox',
	inheritAttrs: false,
	props: {
		items: { type: Array as PropType<ComboboxItem[]>, required: true },
		value: { type: String, default: undefined },
		defaultValue: { type: String, default: undefined },
		placeholder: { type: String, default: 'Select...' },
		searchPlaceholder: { type: String, default: 'Search...' },
		emptyText: { type: String, default: 'No items.' },
		notFoundText: { type: String, default: 'No results found.' },
		maxItems: { type: Number, default: undefined },
		disabled: { type: Boolean, default: false },
		filter: { type: Function as PropType<(item: ComboboxItem, query: string) => boolean>, default: undefined },
		container: { type: Object as PropType<PortalContainer>, default: null },
	},
	emits: ['update:value'],
	setup(props, { emit, attrs }) {
		const portalContainer = usePortalContainer(() => props.container);
		const open = ref(false);
		const query = ref('');
		const activeValue = ref<string | null>(null);
		const internalValue = ref(props.defaultValue);
		const triggerRef = ref<HTMLButtonElement | null>(null);
		const contentRef = ref<HTMLElement | null>(null);
		const contentId = `tile-combobox-${useId()}`;

		const currentValue = computed(() => (props.value !== undefined ? props.value : internalValue.value));
		const filteredItems = computed(() => filterComboboxItems(props.items, query.value, props.maxItems, props.filter));
		const selectedItem = computed(() => props.items.find((item) => item.value === currentValue.value));

		function setOpenState(next: boolean) {
			open.value = next;
			if (!next) {
				query.value = '';
				activeValue.value = null;
			}
		}

		function handleTriggerClick() {
			if (props.disabled) {
				return;
			}
			setOpenState(!open.value);
		}

		function handleSelect(item: ComboboxItem) {
			if (item.disabled) {
				return;
			}
			if (props.value === undefined) {
				internalValue.value = item.value;
			}
			emit('update:value', item.value);
			setOpenState(false);
		}

		function handleTriggerKeyDown(event: KeyboardEvent) {
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				if (props.disabled) {
					return;
				}
				setOpenState(true);
			}
		}

		function handleContentKeyDown(event: KeyboardEvent) {
			const enabledItems = filteredItems.value.filter((item) => !item.disabled);
			if (enabledItems.length === 0) {
				if (event.key === 'Escape') {
					event.preventDefault();
					setOpenState(false);
				}
				return;
			}

			const currentIndex = enabledItems.findIndex((item) => item.value === activeValue.value);

			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					activeValue.value = enabledItems[moveComboboxIndex(currentIndex, 1, enabledItems.length)].value;
					break;
				case 'ArrowUp':
					event.preventDefault();
					activeValue.value = enabledItems[moveComboboxIndex(currentIndex, -1, enabledItems.length)].value;
					break;
				case 'Home':
					event.preventDefault();
					activeValue.value = enabledItems[0].value;
					break;
				case 'End':
					event.preventDefault();
					activeValue.value = enabledItems[enabledItems.length - 1].value;
					break;
				case 'Enter':
				case ' ':
					event.preventDefault();
					handleSelect(enabledItems[currentIndex >= 0 ? currentIndex : 0]);
					break;
				case 'Escape':
					event.preventDefault();
					setOpenState(false);
					triggerRef.value?.focus();
					break;
			}
		}

		let disposeDocListeners: (() => void) | null = null;

		function updatePosition() {
			const trigger = triggerRef.value;
			const content = contentRef.value;
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

		function handleOpen() {
			// 内容通过 Teleport 条件渲染，需等组件挂载后再定位，否则 contentRef 为空、弹层停留在文档末尾。
			nextTick(() => updatePosition());
			window.addEventListener('resize', updatePosition);
			document.addEventListener('scroll', updatePosition, true);

			function handlePointerDown(event: PointerEvent) {
				const target = event.target as Node | null;
				const content = contentRef.value;
				const trigger = triggerRef.value;
				if (!target) {
					return;
				}
				if (content && content.contains(target)) {
					return;
				}
				if (trigger && trigger.contains(target)) {
					return;
				}
				setOpenState(false);
			}

			document.addEventListener('pointerdown', handlePointerDown);
			disposeDocListeners = () => document.removeEventListener('pointerdown', handlePointerDown);
		}

		function handleClose() {
			window.removeEventListener('resize', updatePosition);
			document.removeEventListener('scroll', updatePosition, true);
			disposeDocListeners?.();
			disposeDocListeners = null;
		}

		onMounted(() => {
			if (open.value) {
				handleOpen();
			}
		});

		watch(open, (next) => {
			if (next) {
				handleOpen();
			} else {
				handleClose();
			}
		});

		onBeforeUnmount(handleClose);

		return () => {
			const showEmpty = filteredItems.value.length === 0;
			const emptyMessage = query.value ? props.notFoundText : props.emptyText;
			const userClass = attrs.class;

			const content = h(
				'div',
				{
					ref: contentRef,
					id: contentId,
					role: 'listbox',
					tabindex: -1,
					'data-state': getSelectState(open.value),
					class: styles[comboboxStyleKeys.content],
					onKeydown: handleContentKeyDown,
				},
				[
					h('div', { class: styles[comboboxStyleKeys.search] }, [
						h('input', {
							role: 'combobox',
							'aria-expanded': open.value,
							'aria-controls': contentId,
							'aria-autocomplete': 'list',
							class: styles[comboboxStyleKeys.searchInput],
							value: query.value,
							placeholder: props.searchPlaceholder,
							onInput: (event: Event) => {
								query.value = (event.target as HTMLInputElement).value;
								activeValue.value = null;
							},
						}),
					]),
					h('div', { class: styles[comboboxStyleKeys.list] }, [
						showEmpty
							? h('div', { class: styles[comboboxStyleKeys.empty] }, [emptyMessage])
							: filteredItems.value.map((item) =>
									h(
										'div',
										{
											key: item.value,
											role: 'option',
											tabindex: -1,
											'aria-selected': item.value === currentValue.value,
											'data-highlighted': activeValue.value === item.value,
											'data-disabled': item.disabled,
											class: styles[comboboxStyleKeys.item],
											onMouseenter: () => {
												if (!item.disabled) {
													activeValue.value = item.value;
												}
											},
											onClick: () => handleSelect(item),
										},
										[
											h('span', { class: styles[comboboxStyleKeys.itemIndicator] }, [item.value === currentValue.value ? comboboxCheckIcon() : null]),
											item.label,
										],
									),
								),
					]),
				],
			);

			return h('div', { ...attrs, class: [styles[comboboxStyleKeys.root], userClass] }, [
				h(
					'button',
					{
						ref: triggerRef,
						type: 'button',
						'aria-haspopup': 'listbox',
						'aria-expanded': open.value,
						'aria-controls': contentId,
						'data-disabled': props.disabled,
						class: styles[comboboxStyleKeys.trigger],
						onClick: handleTriggerClick,
						onKeydown: handleTriggerKeyDown,
					},
					[
						h('span', { 'data-placeholder': !selectedItem.value, class: styles[comboboxStyleKeys.triggerValue] }, [selectedItem.value?.label ?? props.placeholder]),
						comboboxChevronIcon(),
					],
				),
				open.value ? h(Teleport, { to: portalContainer.value }, [content]) : null,
			]);
		};
	},
});

export default Combobox;
