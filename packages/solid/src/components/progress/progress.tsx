import { splitProps, type JSX } from 'solid-js';
import { clampProgressValue, getProgressOffset, progressStyleKeys } from '@tile-ui/core';
import type { ProgressBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/progress.module.scss';

export interface ProgressProps extends JSX.HTMLAttributes<HTMLDivElement>, ProgressBaseProps {}

export function Progress(props: ProgressProps) {
	const [local, rest] = splitProps(props, ['class', 'value', 'min', 'max']);
	const range = () => {
		const providedMin = Number.isFinite(local.min) ? local.min! : 0;
		const providedMax = Number.isFinite(local.max) ? local.max! : 100;
		return providedMin <= providedMax ? { min: providedMin, max: providedMax } : { min: providedMax, max: providedMin };
	};
	const rawValue = () => (Number.isFinite(local.value) ? local.value : range().min);
	const value = () => clampProgressValue(rawValue(), range().min, range().max);
	const offset = () => getProgressOffset(rawValue(), range().min, range().max);

	return (
		<div
			{...rest}
			role="progressbar"
			aria-valuemin={range().min}
			aria-valuemax={range().max}
			aria-valuenow={value()}
			class={`${styles[progressStyleKeys.root]} ${local.class ?? ''}`}>
			<div class={styles[progressStyleKeys.indicator]} style={{ transform: `translateX(-${100 - offset()}%)` }} />
		</div>
	);
}

export default Progress;
