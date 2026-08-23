import { defineComponent, h, onBeforeUnmount, shallowRef, watch, type PropType, type VNode } from 'vue';
import { buildSonnerToastApi, createSonnerStore, getSonnerPositionStyleKeys, resolveSonnerTheme, sonnerStyleKeys } from '@tile-ui/core';
import type { SonnerPosition, SonnerTheme, SonnerToast, SonnerType } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/sonner.module.scss';

const sonnerStore = createSonnerStore();

const toasts = shallowRef<SonnerToast[]>(sonnerStore.getToasts());
sonnerStore.subscribe(() => {
	toasts.value = sonnerStore.getToasts();
});

export const toast = buildSonnerToastApi(sonnerStore);

export function useToast() {
	return {
		toasts,
		toast,
		dismiss: (id?: string) => toast.dismiss(id),
		dismissAll: () => toast.dismissAll(),
	};
}

function svgAttrs() {
	return {
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
	};
}

function renderToastIcon(type: SonnerType) {
	switch (type) {
		case 'success':
			return h('svg', svgAttrs(), [h('circle', { cx: '12', cy: '12', r: '10' }), h('path', { d: 'm9 12 2 2 4-4' })]);
		case 'info':
			return h('svg', svgAttrs(), [h('circle', { cx: '12', cy: '12', r: '10' }), h('path', { d: 'M12 16v-4' }), h('path', { d: 'M12 8h.01' })]);
		case 'warning':
			return h('svg', svgAttrs(), [
				h('path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' }),
				h('path', { d: 'M12 9v4' }),
				h('path', { d: 'M12 17h.01' }),
			]);
		case 'error':
			return h('svg', svgAttrs(), [h('path', { d: 'M13 2 3 14h9l-1 8 10-12h-9l1-8Z' })]);
		case 'loading':
			return h('svg', svgAttrs(), [h('path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' })]);
		default:
			return null;
	}
}

const closeIcon = h('svg', svgAttrs(), [h('path', { d: 'M18 6 6 18' }), h('path', { d: 'm6 6 12 12' })]);

export const Toaster = defineComponent({
	name: 'Toaster',
	inheritAttrs: false,
	props: {
		position: { type: String as PropType<SonnerPosition>, default: 'bottom-right' },
		duration: { type: Number, default: undefined },
		theme: { type: String as PropType<SonnerTheme>, default: undefined },
		richColors: { type: Boolean, default: false },
		closeButton: { type: Boolean, default: true },
	},
	setup(props, { attrs }) {
		const systemTheme = shallowRef<'light' | 'dark'>('light');
		let media: MediaQueryList | undefined;
		const updateSystemTheme = () => {
			systemTheme.value = media?.matches ? 'dark' : 'light';
		};

		watch(
			() => props.theme,
			(theme) => {
				media?.removeEventListener('change', updateSystemTheme);
				media = undefined;
				if (theme === 'system' && typeof window !== 'undefined') {
					media = window.matchMedia('(prefers-color-scheme: dark)');
					updateSystemTheme();
					media.addEventListener('change', updateSystemTheme);
				}
			},
			{ immediate: true },
		);

		onBeforeUnmount(() => media?.removeEventListener('change', updateSystemTheme));

		watch(
			() => props.duration,
			(duration) => {
				if (duration !== undefined) {
					sonnerStore.setDefaultDuration(duration);
				}
			},
			{ immediate: true },
		);

		return () => {
			const resolvedTheme = resolveSonnerTheme(props.theme, systemTheme.value === 'dark');
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;
			const groups = new Map<string, SonnerToast[]>();
			for (const item of toasts.value) {
				const key = item.position ?? props.position;
				const list = groups.get(key);
				if (list) {
					list.push(item);
				} else {
					groups.set(key, [item]);
				}
			}

			const containers: VNode[] = [];
			for (const [groupPosition, list] of groups) {
				const styleKeys = getSonnerPositionStyleKeys(groupPosition as SonnerPosition);
				const toastNodes = list.map((item) => {
					const children: VNode[] = [];
					const icon = renderToastIcon(item.type);
					if (icon) {
						children.push(h('div', { class: styles[sonnerStyleKeys.icon] }, [icon]));
					}
					children.push(
						h('div', { class: styles[sonnerStyleKeys.content] }, [
							item.title !== undefined ? h('div', { class: styles[sonnerStyleKeys.title] }, item.title) : null,
							item.description !== undefined ? h('div', { class: styles[sonnerStyleKeys.description] }, item.description) : null,
						]),
					);
					if (props.closeButton && item.dismissible !== false) {
						children.push(
							h(
								'button',
								{
									type: 'button',
									'aria-label': '关闭',
									class: styles[sonnerStyleKeys.close],
									onClick: () => sonnerStore.dismiss(item.id),
								},
								[closeIcon],
							),
						);
					}
					return h(
						'div',
						{
							key: item.id,
							'data-slot': 'toast',
							'data-type': item.type,
							'data-dismissing': item.dismissing ? 'true' : 'false',
							class: styles[sonnerStyleKeys.toast],
						},
						children,
					);
				});
				containers.push(
					h(
						'div',
						{
							...restAttrs,
							key: groupPosition,
							'data-slot': 'toaster',
							'data-theme': resolvedTheme,
							'data-rich-colors': props.richColors ? 'true' : undefined,
							class: [styles[styleKeys.base], styles[styleKeys.position], resolvedTheme, userClass],
						},
						toastNodes,
					),
				);
			}
			return containers;
		};
	},
});

export default Toaster;
