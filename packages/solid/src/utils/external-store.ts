import type { Accessor } from 'solid-js';

import { createFormStoreSnapshot, type SnapshotStore } from './form-store';

export interface ExternalStore<T> {
	getSnapshot(): T;
	subscribe(listener: () => void): () => void;
}

type ExternalStoreEqualityOptions<T> =
	| {
			/** 默认使用 Object.is；返回 true 时保留当前快照且不触发依赖。 */
			equals?: (previous: T, next: T) => boolean;
			getVersion?: never;
	  }
	| {
			/** 为可变快照捕获版本；版本使用 Object.is 比较，变化时即使快照引用相同也会触发依赖。 */
			getVersion: (snapshot: T) => unknown;
			equals?: never;
	  };

export type ExternalStoreAccessorOptions<T> = ExternalStoreEqualityOptions<T> & {
	/** SSR 的确定性快照；服务端不会创建或订阅外部 store。 */
	serverSnapshot: T;
};

interface ExternalStoreState<T> {
	snapshot: T;
	version?: unknown;
}

/**
 * 将仅在浏览器挂载时创建的外部 store 桥接为当前 Solid owner 的 accessor。
 * 每个 owner 独立订阅并清理；订阅后会立即重读，以关闭读取与订阅之间的竞态。
 */
export function createExternalStoreAccessor<T>(createStore: () => ExternalStore<T>, options: ExternalStoreAccessorOptions<T>): Accessor<T> {
	const getVersion = options.getVersion;
	const equals = options.equals ?? Object.is;
	let current: ExternalStoreState<T> = {
		snapshot: options.serverSnapshot,
		version: getVersion?.(options.serverSnapshot),
	};
	let store: ExternalStore<T> | undefined;
	let hasClientSnapshot = false;

	const proxy: SnapshotStore<ExternalStoreState<T>> = {
		getSnapshot: () => {
			if (!store) return current;
			const snapshot = store.getSnapshot();
			const version = getVersion?.(snapshot);
			if (!hasClientSnapshot) {
				hasClientSnapshot = true;
				current = { snapshot, version };
				return current;
			}
			const unchanged = getVersion ? Object.is(current.version, version) : equals(current.snapshot, snapshot);
			if (!unchanged) current = { snapshot, version };
			return current;
		},
		subscribe: (listener) => {
			store = createStore();
			return store.subscribe(listener);
		},
	};

	const state = createFormStoreSnapshot(proxy);
	return () => state().snapshot;
}
