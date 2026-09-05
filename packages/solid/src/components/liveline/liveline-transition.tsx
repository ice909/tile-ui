import { createEffect, createSignal, For, onCleanup, onMount, type JSX } from 'solid-js';
import styles from '@tile-ui/styles/scss/components/liveline.module.scss';

export interface LivelineTransitionProps {
	/** Key passed to the lazy chart factory. */
	active: string;
	/** Creates a chart inside its keyed layer owner, so removal disposes its engine. */
	children: (key: string) => JSX.Element;
	/** Cross-fade duration in milliseconds. */
	duration?: number;
	class?: string;
	className?: string;
	style?: JSX.CSSProperties | string;
	ref?: (element: HTMLDivElement) => void;
}

export function LivelineTransition(props: LivelineTransitionProps) {
	const [mounted, setMounted] = createSignal(new Set([props.active]));
	const [visible, setVisible] = createSignal(props.active);
	let ready = false;

	onMount(() => {
		ready = true;
	});

	createEffect(() => {
		const active = props.active;
		const duration = props.duration ?? 300;
		if (!ready) return;

		if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			setMounted(new Set([active]));
			setVisible(active);
			return;
		}

		setMounted((current) => new Set([...current, active]));
		let secondFrame = 0;
		const firstFrame = requestAnimationFrame(() => {
			secondFrame = requestAnimationFrame(() => setVisible(active));
		});
		const timer = window.setTimeout(() => {
			setMounted(new Set([active]));
			setVisible(active);
		}, duration + 50);

		onCleanup(() => {
			cancelAnimationFrame(firstFrame);
			cancelAnimationFrame(secondFrame);
			clearTimeout(timer);
		});
	});

	return (
		<div
			ref={(element) => props.ref?.(element)}
			data-slot="liveline-transition"
			class={`${styles.transition} ${props.class ?? ''} ${props.className ?? ''}`}
			style={props.style}>
			<For each={[...mounted()]}>
				{(key) => {
					const active = () => key === visible();
					return (
						<div
							data-slot="liveline-transition-layer"
							data-active={active() || undefined}
							aria-hidden={!active()}
							inert={!active()}
							class={styles.transitionLayer}
							style={{ 'transition-duration': `${props.duration ?? 300}ms` }}>
							{props.children(key)}
						</div>
					);
				}}
			</For>
		</div>
	);
}
