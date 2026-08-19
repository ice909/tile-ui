import { defineComponent, h, inject, provide, ref, onMounted, type InjectionKey, type Ref } from 'vue';
import { avatarStyleKeys, shouldShowAvatarFallback } from '@tile-ui/core';
import type { AvatarImageStatus } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/avatar.module.scss';

interface AvatarContextValue {
	status: Ref<AvatarImageStatus>;
	hasImage: Ref<boolean>;
}

const AvatarContextKey: InjectionKey<AvatarContextValue> = Symbol('tile-avatar');

export const Avatar = defineComponent({
	name: 'Avatar',
	props: {
		size: {
			type: String as () => 'default' | 'sm' | 'lg',
			default: 'default',
		},
	},
	setup(props, { slots, attrs }) {
		const status = ref<AvatarImageStatus>('loading');
		const hasImage = ref(false);
		provide(AvatarContextKey, { status, hasImage });

		return () => h('span', { ...attrs, class: [styles[avatarStyleKeys.root], attrs.class], 'data-size': props.size }, slots.default?.());
	},
});

export const AvatarImage = defineComponent({
	name: 'AvatarImage',
	props: {
		src: { type: String, default: undefined },
		alt: { type: String, default: '' },
	},
	emits: ['load', 'error'],
	setup(props, { attrs, emit }) {
		const contextValue = inject(AvatarContextKey);
		if (!contextValue) {
			throw new Error('AvatarImage must be used within <Avatar>.');
		}
		const context: AvatarContextValue = contextValue;

		const imageRef = ref<HTMLImageElement | null>(null);

		onMounted(() => {
			context.hasImage.value = true;

			const img = imageRef.value;
			if (img && img.complete) {
				context.status.value = img.naturalWidth > 0 ? 'loaded' : 'error';
			}
		});

		function handleLoad(event: Event) {
			context.status.value = 'loaded';
			emit('load', event);
		}

		function handleError(event: Event) {
			context.status.value = 'error';
			emit('error', event);
		}

		return () => {
			const imgAttrs = { ...attrs };
			const userClass = imgAttrs.class;
			delete imgAttrs.class;

			return h('img', {
				...imgAttrs,
				ref: imageRef,
				src: props.src,
				alt: props.alt,
				class: [styles[avatarStyleKeys.image], userClass],
				onLoad: handleLoad,
				onError: handleError,
			});
		};
	},
});

export const AvatarFallback = defineComponent({
	name: 'AvatarFallback',
	setup(_props, { slots, attrs }) {
		const contextValue = inject(AvatarContextKey);
		if (!contextValue) {
			throw new Error('AvatarFallback must be used within <Avatar>.');
		}
		const context: AvatarContextValue = contextValue;

		return () => {
			if (!shouldShowAvatarFallback(context.status.value, context.hasImage.value)) {
				return null;
			}

			return h('span', { ...attrs, class: [styles[avatarStyleKeys.fallback], attrs.class] }, slots.default?.());
		};
	},
});

export const AvatarBadge = defineComponent({
	name: 'AvatarBadge',
	setup(_props, { slots, attrs }) {
		return () => h('span', { ...attrs, class: [styles[avatarStyleKeys.badge], attrs.class] }, slots.default?.());
	},
});

export const AvatarGroup = defineComponent({
	name: 'AvatarGroup',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[avatarStyleKeys.group], attrs.class] }, slots.default?.());
	},
});

export const AvatarGroupCount = defineComponent({
	name: 'AvatarGroupCount',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[avatarStyleKeys.groupCount], attrs.class] }, slots.default?.());
	},
});

export default Avatar;
