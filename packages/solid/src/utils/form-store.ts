import { createSignal, onCleanup, onMount, type Accessor } from 'solid-js';

export interface SnapshotStore<T> {
	getSnapshot(): T;
	subscribe(listener: () => void): () => void;
}

/** 将 FormStore 的订阅快照桥接为 Solid accessor。 */
export function createFormStoreSnapshot<T>(store: SnapshotStore<T>): Accessor<T> {
	const [snapshot, setSnapshot] = createSignal(store.getSnapshot());

	onMount(() => {
		const unsubscribe = store.subscribe(() => setSnapshot(() => store.getSnapshot()));
		setSnapshot(() => store.getSnapshot());
		onCleanup(unsubscribe);
	});

	return snapshot;
}
