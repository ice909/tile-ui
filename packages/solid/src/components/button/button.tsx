import { Show, splitProps, type JSX } from 'solid-js';
import { getButtonStyleKeys, isButtonDisabled } from '@tile-ui/core';
import type { ButtonBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/button.module.scss';

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement>, Omit<ButtonBaseProps, 'asChild'> {}

/**
 * SolidJS Button：复用 core 的样式 key 与禁用判定，样式来自共享 SCSS。
 */
export function Button(props: ButtonProps) {
	const [local, rest] = splitProps(props, ['variant', 'size', 'loading', 'children', 'disabled', 'class', 'type']);
	const styleKeys = () => getButtonStyleKeys(local.variant, local.size);
	const isDisabled = () => isButtonDisabled(local.disabled, local.loading);

	return (
		<button
			{...rest}
			class={`${styles[styleKeys().base]} ${styles[styleKeys().variant]} ${styles[styleKeys().size]} ${local.class ?? ''}`}
			disabled={isDisabled()}
			type={local.type ?? 'button'}>
			<Show when={local.loading}>
				<svg
					class={styles.spinner}
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true">
					<circle cx="12" cy="12" r="10" />
				</svg>
			</Show>
			{local.children}
		</button>
	);
}

export default Button;
