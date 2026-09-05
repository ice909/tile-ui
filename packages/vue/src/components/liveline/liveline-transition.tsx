import { defineComponent, Fragment, isVNode, onBeforeUnmount, ref, watch, type CSSProperties, type VNode } from 'vue';
import styles from '@tile-ui/styles/scss/components/liveline.module.scss';

export interface LivelineTransitionProps {
	active: string;
	duration?: number;
	class?: unknown;
	style?: CSSProperties | string | Array<CSSProperties | string>;
}

function prefersReducedMotion() {
	return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function flattenChildren(children: unknown[]): VNode[] {
	return children.flatMap((child) => {
		if (!isVNode(child)) return [];
		return child.type === Fragment && Array.isArray(child.children) ? flattenChildren(child.children) : [child];
	});
}

export const LivelineTransition = defineComponent({
	name: 'LivelineTransition',
	inheritAttrs: false,
	props: {
		active: { type: String, required: true },
		duration: { type: Number, default: 300 },
	},
	setup(props, { attrs, slots }) {
		const mounted = ref(new Set([props.active]));
		const visible = ref(props.active);
		let firstFrame = 0;
		let secondFrame = 0;
		let timer = 0;

		function clearTransition() {
			if (typeof window === 'undefined') return;
			window.cancelAnimationFrame(firstFrame);
			window.cancelAnimationFrame(secondFrame);
			window.clearTimeout(timer);
		}

		watch(
			() => [props.active, props.duration] as const,
			([active]) => {
				clearTransition();
				if (prefersReducedMotion()) {
					mounted.value = new Set([active]);
					visible.value = active;
					return;
				}
				mounted.value = new Set([...mounted.value, active]);
				firstFrame = window.requestAnimationFrame(() => {
					secondFrame = window.requestAnimationFrame(() => {
						visible.value = active;
					});
				});
				timer = window.setTimeout(() => {
					mounted.value = new Set([active]);
					visible.value = active;
				}, props.duration + 50);
			},
		);
		onBeforeUnmount(clearTransition);

		return () => {
			const rootAttrs = { ...attrs };
			delete rootAttrs.class;
			delete rootAttrs.style;
			return (
				<div {...rootAttrs} data-slot="liveline-transition" class={[styles.transition, attrs.class]} style={attrs.style as CSSProperties}>
					{flattenChildren(slots.default?.() ?? []).map((child) => {
						const key = String(child.key ?? '');
						if (!mounted.value.has(key)) return null;
						const active = key === visible.value;
						return (
							<div
								key={key}
								data-slot="liveline-transition-layer"
								data-active={active || undefined}
								aria-hidden={!active}
								inert={active ? undefined : true}
								class={styles.transitionLayer}
								style={{ transitionDuration: `${props.duration}ms` }}>
								{child}
							</div>
						);
					})}
				</div>
			);
		};
	},
});

export default LivelineTransition;
