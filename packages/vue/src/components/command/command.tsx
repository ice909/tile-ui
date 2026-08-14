import { computed, defineComponent, h, inject, onBeforeUnmount, onMounted, provide, ref, watch, Teleport, type ComputedRef, type InjectionKey, type PropType, type Ref } from 'vue';
import { commandStyleKeys, matchCommandItem } from '@tile-ui/core';
import type { CommandFilterFn, CommandGroupDef, CommandItemDef } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/command.module.scss';

interface CommandContextValue {
	search: string;
	setSearch: (value: string) => void;
	filter?: CommandFilterFn;
	loop: boolean;
	itemsRef: Ref<HTMLElement[]>;
	visibleCount: number;
	reportVisibility: (visible: boolean) => void;
}

type CommandContext = ComputedRef<CommandContextValue>;

const CommandContextKey: InjectionKey<CommandContext> = Symbol('tile-command');

function useCommandContext(): CommandContext {
	const context = inject(CommandContextKey);
	if (!context) {
		throw new Error('TCommand 子组件必须位于 <TCommand> 内部。');
	}
	return context;
}

function commandSearchIcon() {
	return h(
		'svg',
		{
			class: styles[commandStyleKeys.inputIcon],
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
		[h('circle', { cx: '11', cy: '11', r: '8' }), h('path', { d: 'm21 21-4.3-4.3' })],
	);
}

export const TCommand = defineComponent({
	name: 'TCommand',
	inheritAttrs: false,
	props: {
		items: { type: Array as PropType<CommandItemDef[]>, default: undefined },
		groups: { type: Array as PropType<CommandGroupDef[]>, default: undefined },
		filter: { type: Function as PropType<CommandFilterFn>, default: undefined },
		loop: { type: Boolean, default: true },
	},
	setup(props, { slots, attrs }) {
		const search = ref('');
		const itemsRef = ref<HTMLElement[]>([]);
		const visibleCount = ref(0);

		function setSearch(value: string) {
			search.value = value;
		}

		function reportVisibility(visible: boolean) {
			visibleCount.value += visible ? 1 : -1;
		}

		const context = computed<CommandContextValue>(() => ({
			search: search.value,
			setSearch,
			filter: props.filter,
			loop: props.loop,
			itemsRef,
			visibleCount: visibleCount.value,
			reportVisibility,
		}));

		provide(CommandContextKey, context);

		return () => {
			let content = slots.default?.();

			if (props.groups && props.groups.length > 0) {
				content = props.groups.map((group) =>
					h(TCommandGroup, { key: group.value, heading: group.label }, () =>
						group.items.map((item) =>
							h(TCommandItem, { key: item.value, value: item.value, keywords: item.keywords, disabled: item.disabled }, () => [
								item.label ?? item.value,
								item.shortcut ? h(TCommandShortcut, () => [item.shortcut]) : null,
							]),
						),
					),
				);
			} else if (props.items && props.items.length > 0) {
				content = props.items.map((item) =>
					h(TCommandItem, { key: item.value, value: item.value, keywords: item.keywords, disabled: item.disabled }, () => [
						item.label ?? item.value,
						item.shortcut ? h(TCommandShortcut, () => [item.shortcut]) : null,
					]),
				);
			}

			return h('div', { ...attrs, class: [styles[commandStyleKeys.root], attrs.class] }, content);
		};
	},
});

export const TCommandInput = defineComponent({
	name: 'TCommandInput',
	inheritAttrs: false,
	setup(_props, { attrs }) {
		const context = useCommandContext();

		return () =>
			h('div', { class: styles[commandStyleKeys.inputWrapper] }, [
				commandSearchIcon(),
				h('input', {
					...attrs,
					value: context.value.search,
					onInput: (event: Event) => {
						context.value.setSearch((event.target as HTMLInputElement).value);
					},
					class: [styles[commandStyleKeys.input], attrs.class],
				}),
			]);
	},
});

export const TCommandList = defineComponent({
	name: 'TCommandList',
	setup(_props, { slots, attrs }) {
		const context = useCommandContext();

		function handleKeyDown(event: KeyboardEvent) {
			const items = context.value.itemsRef.value.filter((item) => !item.hasAttribute('hidden') && item.getAttribute('data-disabled') !== 'true');
			if (items.length === 0) {
				return;
			}

			const currentIndex = items.findIndex((item) => item.getAttribute('data-selected') === 'true');

			const highlight = (next: number) => {
				items.forEach((item) => item.removeAttribute('data-selected'));
				items[next].setAttribute('data-selected', 'true');
				items[next].scrollIntoView({ block: 'nearest' });
			};

			const loop = context.value.loop;
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

		return () => h('div', { ...attrs, class: [styles[commandStyleKeys.list], attrs.class], onKeydown: handleKeyDown }, slots.default?.());
	},
});

export const TCommandEmpty = defineComponent({
	name: 'TCommandEmpty',
	setup(_props, { slots, attrs }) {
		const context = useCommandContext();
		return () => {
			if (context.value.visibleCount > 0) {
				return null;
			}
			return h('div', { ...attrs, class: [styles[commandStyleKeys.empty], attrs.class] }, slots.default?.());
		};
	},
});

export const TCommandGroup = defineComponent({
	name: 'TCommandGroup',
	inheritAttrs: false,
	props: {
		heading: { type: String, default: undefined },
	},
	setup(props, { slots, attrs }) {
		return () =>
			h('div', { ...attrs, class: [styles[commandStyleKeys.group], attrs.class] }, [
				props.heading ? h('div', { class: styles[commandStyleKeys.groupLabel] }, [props.heading]) : null,
				h('div', { class: styles[commandStyleKeys.groupContent] }, slots.default?.()),
			]);
	},
});

export const TCommandItem = defineComponent({
	name: 'TCommandItem',
	inheritAttrs: false,
	props: {
		value: { type: String, required: true },
		keywords: { type: Array as PropType<string[]>, default: undefined },
		disabled: { type: Boolean, default: false },
	},
	emits: ['select'],
	setup(props, { emit, slots, attrs }) {
		const context = useCommandContext();
		const itemRef = ref<HTMLElement | null>(null);

		const matches = computed(() => {
			if (context.value.filter) {
				return context.value.filter(props.value, context.value.search, props.keywords);
			}
			return matchCommandItem({ value: props.value, keywords: props.keywords }, context.value.search);
		});

		onMounted(() => {
			if (itemRef.value) {
				context.value.itemsRef.value.push(itemRef.value);
			}
		});

		watch(
			matches,
			(visible, wasVisible) => {
				if (visible && !wasVisible) {
					context.value.reportVisibility(true);
				} else if (!visible && wasVisible) {
					context.value.reportVisibility(false);
				}
			},
			{ immediate: true },
		);

		onBeforeUnmount(() => {
			context.value.itemsRef.value = context.value.itemsRef.value.filter((item) => item !== itemRef.value);
			if (matches.value) {
				context.value.reportVisibility(false);
			}
		});

		function handleClick() {
			if (props.disabled) {
				return;
			}
			emit('select', props.value);
		}

		return () =>
			h(
				'div',
				{
					...attrs,
					ref: itemRef,
					tabindex: -1,
					hidden: !matches.value,
					'data-disabled': props.disabled,
					class: [styles[commandStyleKeys.item], attrs.class],
					onClick: handleClick,
				},
				slots.default?.(),
			);
	},
});

export const TCommandSeparator = defineComponent({
	name: 'TCommandSeparator',
	setup(_props, { attrs }) {
		return () => h('div', { ...attrs, class: [styles[commandStyleKeys.separator], attrs.class] });
	},
});

export const TCommandShortcut = defineComponent({
	name: 'TCommandShortcut',
	setup(_props, { slots, attrs }) {
		return () => h('span', { ...attrs, class: [styles[commandStyleKeys.shortcut], attrs.class] }, slots.default?.());
	},
});

export const TCommandDialog = defineComponent({
	name: 'TCommandDialog',
	props: {
		open: { type: Boolean, default: false },
		title: { type: String, default: 'Command Palette' },
		description: { type: String, default: 'Search for a command to run...' },
	},
	emits: ['update:open'],
	setup(props, { emit, slots }) {
		function handleOverlayClick() {
			emit('update:open', false);
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				emit('update:open', false);
			}
		}

		return () => {
			if (!props.open) {
				return null;
			}

			return h(Teleport, { to: 'body' }, [
				h('div', { onKeydown: handleKeyDown }, [
					h('div', { class: styles[commandStyleKeys.dialogOverlay], onClick: handleOverlayClick }),
					h('div', { class: styles[commandStyleKeys.dialogContent], role: 'dialog', 'aria-modal': 'true' }, [
						h('h2', { class: styles[commandStyleKeys.dialogTitle] }, [props.title]),
						h('p', { class: styles[commandStyleKeys.dialogDescription] }, [props.description]),
						slots.default?.(),
					]),
				]),
			]);
		};
	},
});

export default TCommand;
