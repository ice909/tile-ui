import React from 'react';
import { skeletonStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/skeleton.module.scss';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(({ className = '', ...props }, ref) => {
	return <div ref={ref} className={`${styles[skeletonStyleKeys.base]} ${className}`} {...props} />;
});

Skeleton.displayName = 'Skeleton';

export { Skeleton };
export default Skeleton;
