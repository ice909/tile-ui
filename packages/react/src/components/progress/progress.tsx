import React from 'react';
import { getProgressOffset, progressStyleKeys } from '@tile-ui/core';
import type { ProgressBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/progress.module.scss';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement>, ProgressBaseProps {}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className = '', value = 0, min = 0, max = 100, ...props }, ref) => {
	const offset = getProgressOffset(value, min, max);

	return (
		<div ref={ref} role="progressbar" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} className={`${styles[progressStyleKeys.root]} ${className}`} {...props}>
			<div className={styles[progressStyleKeys.indicator]} style={{ transform: `translateX(-${100 - offset}%)` }} />
		</div>
	);
});

Progress.displayName = 'Progress';

export { Progress };
export default Progress;
