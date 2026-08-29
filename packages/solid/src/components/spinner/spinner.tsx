import { splitProps, type JSX } from 'solid-js';
import { getSpinnerSize, spinnerStyleKeys } from '@tile-ui/core';
import type { SpinnerBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/spinner.module.scss';
export interface SpinnerProps extends JSX.SvgSVGAttributes<SVGSVGElement>, SpinnerBaseProps {}
export function Spinner(props: SpinnerProps) {
	const [local, rest] = splitProps(props, ['class', 'size', 'children']);
	const size = () => getSpinnerSize(local.size ?? 'default');
	return (
		<svg
			{...rest}
			data-slot="spinner"
			role={rest.role ?? 'status'}
			aria-label={rest['aria-label'] ?? 'Loading'}
			data-size={size()}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class={`${styles[spinnerStyleKeys.root]} ${local.class ?? ''}`}>
			<path d="M21 12a9 9 0 1 1-6.219-8.56" />
			{local.children}
		</svg>
	);
}
export default Spinner;
