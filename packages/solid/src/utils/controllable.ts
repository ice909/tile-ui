import { createRenderEffect, createSignal, type Accessor } from 'solid-js';

export type ControllableUpdater<T> = T | ((previous: T) => T);

export interface ControllableSignalOptions<T> {
	value?: Accessor<T | undefined>;
	defaultValue: Accessor<T>;
	onChange?: (value: T) => void;
}

/**
 * 创建支持受控与非受控模式的信号。defaultValue 仅在创建时读取。
 */
export function createControllableSignal<T>(options: ControllableSignalOptions<T>): [Accessor<T>, (next: ControllableUpdater<T>) => T, () => T] {
	const initialValue = options.defaultValue();
	const [uncontrolledValue, setUncontrolledValue] = createSignal(initialValue);
	const controlledValue = () => options.value?.();
	const value = () => {
		const controlled = controlledValue();
		return controlled !== undefined ? controlled : uncontrolledValue();
	};

	createRenderEffect(() => {
		const controlled = controlledValue();
		if (controlled !== undefined) {
			setUncontrolledValue(() => controlled);
		}
	});

	const setValue = (next: ControllableUpdater<T>) => {
		const previous = value();
		const resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next;

		if (controlledValue() === undefined) {
			setUncontrolledValue(() => resolved);
		}
		if (!Object.is(previous, resolved)) {
			options.onChange?.(resolved);
		}
		return resolved;
	};

	const reset = () => {
		const controlled = controlledValue();
		if (controlled !== undefined) {
			return controlled;
		}
		setUncontrolledValue(() => initialValue);
		return initialValue;
	};

	return [value, setValue, reset];
}
