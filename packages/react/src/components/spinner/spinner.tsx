import React from 'react';
import { getSpinnerSize, spinnerStyleKeys } from '@tile-ui/core';
import type { SpinnerBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/spinner.module.scss';

export interface SpinnerProps extends React.SVGProps<SVGSVGElement>, SpinnerBaseProps {}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(({ className = '', size = 'default', ...props }, ref) => {
	const resolvedSize = getSpinnerSize(size);

	return (
		<svg
			ref={ref}
			data-slot="spinner"
			role="status"
			aria-label="Loading"
			data-size={resolvedSize}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`${styles[spinnerStyleKeys.root]} ${className}`}
			{...props}>
			<path d="M21 12a9 9 0 1 1-6.219-8.56" />
		</svg>
	);
});
Spinner.displayName = 'Spinner';

export { Spinner };
export default Spinner;
