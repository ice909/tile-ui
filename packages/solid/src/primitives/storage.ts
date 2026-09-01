import { createSignal, onMount, type Accessor, type Setter } from 'solid-js';

export type StorageDefaultValue<T> = T | (() => T);
export type StorageSignal<T> = [Accessor<T>, Setter<T>];

function resolveDefaultValue<T>(defaultValue: StorageDefaultValue<T>): T {
	return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
}

function createStorage<T>(kind: 'localStorage' | 'sessionStorage', key: string, defaultValue: StorageDefaultValue<T>): StorageSignal<T> {
	const [value, setValue] = createSignal<T>(resolveDefaultValue(defaultValue));

	onMount(() => {
		try {
			const item = window[kind].getItem(key);
			if (item !== null) setValue(() => JSON.parse(item) as T);
		} catch (error) {
			console.warn(`Error reading ${kind} key "${key}":`, error);
		}
	});

	const setStoredValue = ((next: T | ((previous: T) => T)) => {
		let resolved!: T;
		setValue((previous) => {
			resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next;
			return resolved;
		});

		try {
			if (typeof window !== 'undefined') {
				const serialized = JSON.stringify(resolved);
				if (serialized === undefined) window[kind].removeItem(key);
				else window[kind].setItem(key, serialized);
			}
		} catch (error) {
			console.warn(`Error setting ${kind} key "${key}":`, error);
		}

		return resolved;
	}) as Setter<T>;

	return [value, setStoredValue];
}

/** 创建与 localStorage 同步的 owner 作用域信号。 */
export function createLocalStorage<T = string>(key: string, defaultValue: StorageDefaultValue<T> = '' as T): StorageSignal<T> {
	return createStorage('localStorage', key, defaultValue);
}

/** 创建与 sessionStorage 同步的 owner 作用域信号。 */
export function createSessionStorage<T = string>(key: string, defaultValue: StorageDefaultValue<T> = '' as T): StorageSignal<T> {
	return createStorage('sessionStorage', key, defaultValue);
}
