import { createSignal, splitProps, type JSX } from 'solid-js';
import { getToggleState, getToggleStyleKeys } from '@tile-ui/core';
import type { ToggleBaseProps } from '@tile-ui/core';
import { invokeEventHandler } from '../../utils/events';
import styles from '@tile-ui/styles/scss/components/toggle.module.scss';

export interface ToggleProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement>, ToggleBaseProps {
	/** 受控按压状态 */
	pressed?: boolean;
	/** 非受控初始按压状态 */
	defaultPressed?: boolean;
	/** 按压状态变化回调 */
	onPressedChange?: (pressed: boolean) => void;
}

/**
 * SolidJS Toggle：受控 (pressed) / 非受控 (defaultPressed) 双模式，复用 core 逻辑。
 */
export function Toggle(props: ToggleProps) {
	const [local, rest] = splitProps(props, ['variant', 'size', 'pressed', 'defaultPressed', 'onPressedChange', 'class', 'onClick', 'disabled', 'children', 'type']);
	const [internalPressed, setInternalPressed] = createSignal(local.defaultPressed ?? false);
	const isPressed = () => (local.pressed !== undefined ? local.pressed : internalPressed());
	const state = () => getToggleState(isPressed());
	const styleKeys = () => getToggleStyleKeys(local.variant, local.size);
	const variant = () => local.variant ?? 'default';
	const size = () => local.size ?? 'default';

	function handleClick(event: MouseEvent) {
		invokeEventHandler(local.onClick as Parameters<typeof invokeEventHandler<MouseEvent>>[0], event);
		if (event.defaultPrevented) {
			return;
		}

		const next = !isPressed();
		if (local.pressed === undefined) {
			setInternalPressed(next);
		}
		local.onPressedChange?.(next);
	}

	return (
		<button
			{...rest}
			type={local.type ?? 'button'}
			aria-pressed={isPressed()}
			data-state={state()}
			data-variant={variant()}
			data-size={size()}
			disabled={local.disabled}
			class={`${styles[styleKeys().base]} ${styles[styleKeys().variant]} ${styles[styleKeys().size]} ${local.class ?? ''}`}
			onClick={handleClick}>
			{local.children}
		</button>
	);
}

export default Toggle;
