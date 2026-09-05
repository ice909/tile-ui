import React, { useEffect, useRef, useState } from 'react';
import styles from '@tile-ui/styles/scss/components/liveline.module.scss';

export interface LivelineTransitionProps {
	/** Key of the active child to display. Must match a child's `key` prop. */
	active: string;
	/** Chart elements with unique `key` props. */
	children: React.ReactElement | React.ReactElement[];
	/** Cross-fade duration in milliseconds. */
	duration?: number;
	className?: string;
	style?: React.CSSProperties;
}

function prefersReducedMotion() {
	return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const LivelineTransition = React.forwardRef<HTMLDivElement, LivelineTransitionProps>(({ active, children, duration = 300, className = '', style }, ref) => {
	const childArray = Array.isArray(children) ? children : [children];
	const [mounted, setMounted] = useState<Set<string>>(() => new Set([active]));
	const [visible, setVisible] = useState(active);
	const initializedRef = useRef(false);

	useEffect(() => {
		if (!initializedRef.current) {
			initializedRef.current = true;
			return;
		}
		if (prefersReducedMotion()) {
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

		return () => {
			cancelAnimationFrame(firstFrame);
			cancelAnimationFrame(secondFrame);
			clearTimeout(timer);
		};
	}, [active, duration]);

	return (
		<div ref={ref} data-slot="liveline-transition" className={`${styles.transition} ${className}`} style={style}>
			{childArray.map((child) => {
				const key = String(child.key ?? '');
				if (!mounted.has(key)) return null;
				const isActive = key === visible;
				return (
					<div
						key={key}
						data-slot="liveline-transition-layer"
						data-active={isActive || undefined}
						aria-hidden={!isActive}
						// A nonempty attribute works in both React 18 (unknown) and 19 (boolean).
						{...(!isActive ? { inert: 'inert' as unknown as boolean } : {})}
						className={styles.transitionLayer}
						style={{ transitionDuration: `${duration}ms` }}>
						{child}
					</div>
				);
			})}
		</div>
	);
});
LivelineTransition.displayName = 'LivelineTransition';

export { LivelineTransition };
