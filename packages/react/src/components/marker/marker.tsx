import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { getMarkerVariantKey, markerStyleKeys } from '@tile-ui/core';
import type { MarkerBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/marker.module.scss';

export interface MarkerProps extends React.HTMLAttributes<HTMLDivElement>, MarkerBaseProps {}

const Marker = React.forwardRef<HTMLDivElement, MarkerProps>(({ className = '', variant = 'default', asChild = false, children, ...props }, ref) => {
	const Comp = asChild ? Slot : 'div';
	const variantKey = getMarkerVariantKey(variant);
	const classes = [styles[markerStyleKeys.root], styles[variantKey], className].filter(Boolean).join(' ');

	return (
		<Comp ref={ref} data-slot="marker" data-variant={variant} className={classes} {...props}>
			{children}
		</Comp>
	);
});
Marker.displayName = 'Marker';

export interface MarkerIconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const MarkerIcon = React.forwardRef<HTMLSpanElement, MarkerIconProps>(({ className = '', children, ...props }, ref) => {
	return (
		<span ref={ref} data-slot="marker-icon" aria-hidden="true" className={`${styles[markerStyleKeys.icon]} ${className}`} {...props}>
			{children}
		</span>
	);
});
MarkerIcon.displayName = 'MarkerIcon';

export interface MarkerContentProps extends React.HTMLAttributes<HTMLSpanElement> {}

const MarkerContent = React.forwardRef<HTMLSpanElement, MarkerContentProps>(({ className = '', children, ...props }, ref) => {
	return (
		<span ref={ref} data-slot="marker-content" className={`${styles[markerStyleKeys.content]} ${className}`} {...props}>
			{children}
		</span>
	);
});
MarkerContent.displayName = 'MarkerContent';

export { Marker, MarkerIcon, MarkerContent };
export default Marker;
