import { cloneVNode, defineComponent, h, mergeProps, type PropType, type VNode } from 'vue';
import {
	attachmentStyleKeys,
	getAttachmentFileKind,
	getAttachmentMediaStyleKeys,
	getAttachmentStyleKeys,
	formatAttachmentSize,
	isAttachmentActionable,
	truncateAttachmentName,
} from '@tile-ui/core';
import type { AttachmentFileKind, AttachmentMediaVariant, AttachmentOrientation, AttachmentSize, AttachmentState, ButtonSize, ButtonVariant } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/attachment.module.scss';
import { Button } from '../button/button';

/**
 * 按文件类型渲染对应的内联 SVG 图标
 */
export const AttachmentFileIcon = defineComponent({
	name: 'AttachmentFileIcon',
	props: {
		kind: { type: String as PropType<AttachmentFileKind>, default: 'generic' },
	},
	setup(props) {
		const iconProps = {
			xmlns: 'http://www.w3.org/2000/svg',
			width: 16,
			height: 16,
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': 2,
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			'aria-hidden': 'true',
		};

		function renderIcon(kind: AttachmentFileKind): VNode[] {
			switch (kind) {
				case 'image':
					return [
						h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2', ry: '2' }),
						h('circle', { cx: '9', cy: '9', r: '2' }),
						h('path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }),
					];
				case 'video':
					return [h('path', { d: 'm22 8-6 4 6 4V8Z' }), h('rect', { width: '14', height: '12', x: '2', y: '6', rx: '2', ry: '2' })];
				case 'audio':
					return [h('path', { d: 'M11 5 6 9H2v6h4l5 4V5Z' }), h('path', { d: 'M15.54 8.46a5 5 0 0 1 0 7.07' })];
				case 'pdf':
					return [
						h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
						h('path', { d: 'M14 2v6h6' }),
						h('path', { d: 'M9 15c-.5-1 .5-3 2-3s2 2 2 3 0 2-1 2-2.5-.5-3-2Z' }),
					];
				case 'spreadsheet':
					return [h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2', ry: '2' }), h('path', { d: 'M3 9h18M3 15h18M9 3v18M15 3v18' })];
				case 'presentation':
					return [h('rect', { width: '18', height: '10', x: '3', y: '3', rx: '2', ry: '2' }), h('path', { d: 'M12 13v5M8 21l4-3 4 3M7 6h10' })];
				case 'archive':
					return [h('rect', { width: '20', height: '5', x: '2', y: '3', rx: '1' }), h('path', { d: 'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4' })];
				case 'code':
					return [h('path', { d: 'm16 18 6-6-6-6M8 6l-6 6 6 6' })];
				default:
					return [h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), h('path', { d: 'M14 2v6h6' })];
			}
		}

		return () => h('svg', iconProps, renderIcon(props.kind));
	},
});

function svgAttrs() {
	return {
		xmlns: 'http://www.w3.org/2000/svg',
		width: 16,
		height: 16,
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: 'currentColor',
		'stroke-width': 2,
		'stroke-linecap': 'round',
		'stroke-linejoin': 'round',
		'aria-hidden': 'true',
	};
}

function downloadIcon(): VNode {
	return h('svg', svgAttrs(), [h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }), h('path', { d: 'm7 10 5 5 5-5' }), h('path', { d: 'M12 15V3' })]);
}

function trashIcon(): VNode {
	return h('svg', svgAttrs(), [h('path', { d: 'M3 6h18' }), h('path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }), h('path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' })]);
}

export const Attachment = defineComponent({
	name: 'Attachment',
	props: {
		state: { type: String as PropType<AttachmentState>, default: 'done' },
		size: { type: String as PropType<AttachmentSize>, default: 'default' },
		orientation: { type: String as PropType<AttachmentOrientation>, default: 'horizontal' },
	},
	setup(props, { slots, attrs }) {
		return () => {
			const styleKeys = getAttachmentStyleKeys(props.size, props.orientation);
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h(
				'div',
				{
					...restAttrs,
					'data-slot': 'attachment',
					'data-state': props.state,
					'data-size': props.size,
					'data-orientation': props.orientation,
					class: [styles[styleKeys.base], styles[styleKeys.size], styles[styleKeys.orientation], userClass],
				},
				slots.default?.(),
			);
		};
	},
});

export const AttachmentGroup = defineComponent({
	name: 'AttachmentGroup',
	setup(_props, { slots, attrs }) {
		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h('div', { ...restAttrs, 'data-slot': 'attachment-group', class: [styles[attachmentStyleKeys.group], userClass] }, slots.default?.());
		};
	},
});

export const AttachmentMedia = defineComponent({
	name: 'AttachmentMedia',
	props: {
		variant: { type: String as PropType<AttachmentMediaVariant>, default: 'icon' },
	},
	setup(props, { slots, attrs }) {
		return () => {
			const styleKeys = getAttachmentMediaStyleKeys(props.variant);
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h(
				'div',
				{
					...restAttrs,
					'data-slot': 'attachment-media',
					'data-variant': props.variant,
					class: [styles[styleKeys.base], styles[styleKeys.variant], userClass],
				},
				slots.default?.(),
			);
		};
	},
});

export const AttachmentContent = defineComponent({
	name: 'AttachmentContent',
	setup(_props, { slots, attrs }) {
		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h('div', { ...restAttrs, 'data-slot': 'attachment-content', class: [styles[attachmentStyleKeys.content], userClass] }, slots.default?.());
		};
	},
});

export const AttachmentTitle = defineComponent({
	name: 'AttachmentTitle',
	setup(_props, { slots, attrs }) {
		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h('span', { ...restAttrs, 'data-slot': 'attachment-title', class: [styles[attachmentStyleKeys.title], userClass] }, slots.default?.());
		};
	},
});

export const AttachmentDescription = defineComponent({
	name: 'AttachmentDescription',
	setup(_props, { slots, attrs }) {
		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h('span', { ...restAttrs, 'data-slot': 'attachment-description', class: [styles[attachmentStyleKeys.description], userClass] }, slots.default?.());
		};
	},
});

export const AttachmentActions = defineComponent({
	name: 'AttachmentActions',
	setup(_props, { slots, attrs }) {
		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h('div', { ...restAttrs, 'data-slot': 'attachment-actions', class: [styles[attachmentStyleKeys.actions], userClass] }, slots.default?.());
		};
	},
});

export const AttachmentAction = defineComponent({
	name: 'AttachmentAction',
	props: {
		variant: { type: String as PropType<ButtonVariant>, default: 'ghost' },
		size: { type: String as PropType<ButtonSize>, default: 'icon-xs' },
	},
	setup(props, { slots, attrs }) {
		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h(
				Button,
				{
					...restAttrs,
					'data-slot': 'attachment-action',
					variant: props.variant,
					size: props.size,
					class: [styles[attachmentStyleKeys.action], userClass],
				},
				slots.default?.(),
			);
		};
	},
});

export const AttachmentTrigger = defineComponent({
	name: 'AttachmentTrigger',
	inheritAttrs: false,
	props: {
		asChild: { type: Boolean, default: false },
		type: { type: String as PropType<'button' | 'submit' | 'reset'>, default: 'button' },
	},
	setup(props, { slots, attrs }) {
		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			const triggerProps = {
				...restAttrs,
				'data-slot': 'attachment-trigger',
				type: props.asChild ? undefined : props.type,
				class: [styles[attachmentStyleKeys.trigger], userClass],
			};

			if (props.asChild) {
				const child = slots.default?.()[0];
				if (child) {
					return cloneVNode(child, mergeProps(child.props ?? {}, triggerProps));
				}
				return null;
			}

			return h('button', triggerProps, slots.default?.());
		};
	},
});

export const AttachmentCard = defineComponent({
	name: 'AttachmentCard',
	props: {
		name: { type: String, default: undefined },
		size: { type: Number, default: undefined },
		file: { type: File, default: undefined },
		state: { type: String as PropType<AttachmentState>, default: 'done' },
		orientation: { type: String as PropType<AttachmentOrientation>, default: 'horizontal' },
		downloading: { type: Boolean, default: false },
		action: { type: [Object, Function], default: undefined },
	},
	emits: ['remove', 'download', 'preview', 'click'],
	setup(props, { attrs, emit }) {
		return () => {
			const kind = getAttachmentFileKind(props.name, props.file?.type);
			const actionable = isAttachmentActionable(props.state);
			const displayName = props.name ? truncateAttachmentName(props.name) : '';
			const description = props.size !== undefined ? formatAttachmentSize(props.size) : props.state;

			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			const actions: unknown[] = [];
			if (hasListener(attrs, 'download')) {
				actions.push(
					h(AttachmentAction, { 'aria-label': '下载', disabled: !actionable || props.downloading, onClick: (event: MouseEvent) => emit('download', event) }, () =>
						downloadIcon(),
					),
				);
			}
			if (props.action != null) {
				actions.push(props.action);
			} else if (hasListener(attrs, 'remove')) {
				actions.push(h(AttachmentAction, { 'aria-label': '删除', disabled: !actionable, onClick: (event: MouseEvent) => emit('remove', event) }, () => trashIcon()));
			}

			const children: unknown[] = [
				h(AttachmentMedia, { variant: 'icon' }, () => h(AttachmentFileIcon, { kind })),
				h(AttachmentContent, {}, () => [
					displayName ? h(AttachmentTitle, {}, () => displayName) : null,
					description ? h(AttachmentDescription, {}, () => description) : null,
				]),
			];
			if (actions.length > 0) {
				children.push(h(AttachmentActions, {}, () => actions));
			}

			return h(
				Attachment,
				{
					...restAttrs,
					state: props.state,
					orientation: props.orientation,
					class: [styles[attachmentStyleKeys.card], userClass],
					onClick: (event: MouseEvent) => emit('click', event),
				},
				() => children,
			);
		};
	},
});

function hasListener(attrs: Record<string, unknown>, name: string): boolean {
	return typeof attrs[`on${name.charAt(0).toUpperCase()}${name.slice(1)}`] === 'function';
}

export default Attachment;
