export type NativeValueControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** 隐藏原生表单控件使用的内联样式。 */
export const HIDDEN_FORM_CONTROL_STYLE = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: '0',
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0, 0, 0, 0)',
	'white-space': 'nowrap',
	'border-width': '0',
	'pointer-events': 'none',
} as const;

/** 隐藏原生表单控件的完整非交互属性。 */
export const HIDDEN_FORM_CONTROL_PROPS = {
	tabIndex: -1,
	'aria-hidden': 'true',
	style: HIDDEN_FORM_CONTROL_STYLE,
} as const;

/** 设置原生控件首次渲染时的重置基准值。 */
export function setInitialNativeValue(control: NativeValueControl | undefined, value: string): void {
	if (!control) {
		return;
	}
	if (control instanceof HTMLSelectElement) {
		for (const option of control.options) {
			option.defaultSelected = option.value === value;
		}
		return;
	}
	control.defaultValue = value;
}

/** 设置 checkbox/radio 首次渲染时的重置基准状态。 */
export function setInitialNativeChecked(control: HTMLInputElement | undefined, checked: boolean): void {
	if (control) {
		control.defaultChecked = checked;
	}
}

/** 监听控件所属表单的原生 reset，并返回清理函数。 */
export function listenToFormReset(control: { form: HTMLFormElement | null } | undefined, reset: () => void): () => void {
	const form = control?.form;
	if (!form) {
		return () => undefined;
	}
	form.addEventListener('reset', reset);
	return () => form.removeEventListener('reset', reset);
}

export interface FormResetBinding {
	bind(control: { form: HTMLFormElement | null } | undefined): void;
	cleanup(): void;
}

/** 创建可在控件或 form 关联变化后重新绑定的 reset 监听器。 */
export function createFormResetBinding(reset: () => void): FormResetBinding {
	let cleanup: () => void = () => undefined;
	return {
		bind(control) {
			cleanup();
			cleanup = listenToFormReset(control, reset);
		},
		cleanup() {
			cleanup();
			cleanup = () => undefined;
		},
	};
}

function dispatchInputEvent(control: HTMLElement): void {
	const event = typeof InputEvent === 'function' ? new InputEvent('input', { bubbles: true }) : new Event('input', { bubbles: true });
	control.dispatchEvent(event);
}

/** 通过原生属性 setter 更新值，并按需派发可冒泡事件。 */
export function setNativeValue(control: HTMLInputElement | HTMLTextAreaElement, value: string, eventType?: 'input' | 'change'): void {
	const prototype = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
	Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(control, value);
	if (eventType === 'input') {
		dispatchInputEvent(control);
	} else if (eventType === 'change') {
		control.dispatchEvent(new Event('change', { bubbles: true }));
	}
}

/** 通过原生属性 setter 更新选中状态，并按需按原生顺序派发 input/change。 */
export function setNativeChecked(control: HTMLInputElement, checked: boolean, dispatchEvents: boolean = false): void {
	Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set?.call(control, checked);
	if (dispatchEvents) {
		dispatchInputEvent(control);
		control.dispatchEvent(new Event('change', { bubbles: true }));
	}
}
