import React from 'react';
import { aspectRatioStyleKeys, getAspectRatioPadding } from '@tile-ui/core';
import type { AspectRatioBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/aspect-ratio.module.scss';

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement>, AspectRatioBaseProps {}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(({ className = '', ratio = 1, children, style, ...props }, ref) => {
	const paddingTop = `${getAspectRatioPadding(ratio)}%`;

	return (
		<div ref={ref} data-slot="aspect-ratio" className={`${styles[aspectRatioStyleKeys.root]} ${className}`} style={{ ...style, paddingTop }} {...props}>
			<div className={styles[aspectRatioStyleKeys.content]}>{children}</div>
		</div>
	);
});
AspectRatio.displayName = 'AspectRatio';

export { AspectRatio };
export default AspectRatio;
