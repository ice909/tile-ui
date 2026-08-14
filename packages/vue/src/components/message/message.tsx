import { defineComponent, h, type PropType } from 'vue';
import { getMessageStyleKeys, messageStyleKeys } from '@tile-ui/core';
import type { MessageAlign } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/message.module.scss';

export const TMessageGroup = defineComponent({
	name: 'TMessageGroup',
	setup(_props, { slots }) {
		return () => h('div', { 'data-slot': 'message-group', class: styles[messageStyleKeys.group] }, slots.default?.());
	},
});

export const TMessage = defineComponent({
	name: 'TMessage',
	props: {
		align: { type: String as PropType<MessageAlign>, default: 'start' },
	},
	setup(props, { slots }) {
		return () => {
			const styleKeys = getMessageStyleKeys(props.align);
			return h('div', { 'data-slot': 'message', 'data-align': props.align, class: [styles[styleKeys.base], styles[styleKeys.align]] }, slots.default?.());
		};
	},
});

export const TMessageAvatar = defineComponent({
	name: 'TMessageAvatar',
	setup(_props, { slots }) {
		return () => h('div', { 'data-slot': 'message-avatar', class: styles[messageStyleKeys.avatar] }, slots.default?.());
	},
});

export const TMessageContent = defineComponent({
	name: 'TMessageContent',
	setup(_props, { slots }) {
		return () => h('div', { 'data-slot': 'message-content', class: styles[messageStyleKeys.content] }, slots.default?.());
	},
});

export const TMessageHeader = defineComponent({
	name: 'TMessageHeader',
	setup(_props, { slots }) {
		return () => h('div', { 'data-slot': 'message-header', class: styles[messageStyleKeys.header] }, slots.default?.());
	},
});

export const TMessageFooter = defineComponent({
	name: 'TMessageFooter',
	setup(_props, { slots }) {
		return () => h('div', { 'data-slot': 'message-footer', class: styles[messageStyleKeys.footer] }, slots.default?.());
	},
});

export default TMessage;
