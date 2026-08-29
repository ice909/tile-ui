import { createEffect, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createExternalStoreAccessor, type ExternalStore } from '../src/utils';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	const dispose = render(node, container);
	disposers.push(dispose);
	return { container, dispose };
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('createExternalStoreAccessor', () => {
	it('creates the store in its owner, closes a synchronous subscribe race, and cleans up', () => {
		let value = 0;
		const unsubscribe = vi.fn();
		const createStore = vi.fn(
			(): ExternalStore<number> => ({
				getSnapshot: () => value,
				subscribe: vi.fn(() => {
					value = 1;
					return unsubscribe;
				}),
			}),
		);
		const { container, dispose } = mount(() => {
			const snapshot = createExternalStoreAccessor(createStore, { serverSnapshot: -1 });
			return <span>{snapshot()}</span>;
		});

		expect(createStore).toHaveBeenCalledTimes(1);
		expect(container.textContent).toBe('1');
		dispose();
		disposers.pop();
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it('uses snapshot identity by default and supports explicit equality', () => {
		const listeners = new Set<() => void>();
		let snapshot = { value: 1 };
		let defaultRuns = 0;
		let equalRuns = 0;
		const store: ExternalStore<{ value: number }> = {
			getSnapshot: () => snapshot,
			subscribe: (listener) => {
				listeners.add(listener);
				return () => listeners.delete(listener);
			},
		};
		mount(() => {
			const defaultSnapshot = createExternalStoreAccessor(() => store, { serverSnapshot: snapshot });
			const equalSnapshot = createExternalStoreAccessor(() => store, {
				serverSnapshot: snapshot,
				equals: (previous, next) => previous.value === next.value,
			});
			createEffect(() => {
				defaultSnapshot();
				defaultRuns += 1;
			});
			createEffect(() => {
				equalSnapshot();
				equalRuns += 1;
			});
			return null;
		});

		expect(defaultRuns).toBe(1);
		expect(equalRuns).toBe(1);
		snapshot = { value: 1 };
		for (const listener of listeners) listener();
		expect(defaultRuns).toBe(2);
		expect(equalRuns).toBe(1);
	});

	it('adopts the first client snapshot even when custom equality matches the server value', () => {
		const serverSnapshot = { value: 1, source: 'server' };
		const clientSnapshot = { value: 1, source: 'client' };
		let accessor!: () => typeof serverSnapshot;
		mount(() => {
			accessor = createExternalStoreAccessor(() => ({ getSnapshot: () => clientSnapshot, subscribe: () => vi.fn() }), {
				serverSnapshot,
				equals: (previous, next) => previous.value === next.value,
			});
			return null;
		});

		expect(accessor()).toBe(clientSnapshot);
	});

	it('uses captured versions to observe mutations of a stable snapshot reference', () => {
		let listener: (() => void) | undefined;
		const snapshot = { value: 0, version: 0 };
		let runs = 0;
		const { container } = mount(() => {
			const value = createExternalStoreAccessor(
				() => ({
					getSnapshot: () => snapshot,
					subscribe: (next) => {
						listener = next;
						return vi.fn();
					},
				}),
				{ serverSnapshot: snapshot, getVersion: (next) => next.version },
			);
			createEffect(() => {
				value();
				runs += 1;
			});
			return <span>{value().value}</span>;
		});

		expect(runs).toBe(1);
		snapshot.value = 1;
		listener?.();
		expect(runs).toBe(1);
		snapshot.version = 1;
		listener?.();
		expect(runs).toBe(2);
		expect(container.textContent).toBe('1');
	});

	it('keeps subscriptions independent across owners', () => {
		const listeners = new Set<() => void>();
		const unsubscribe = vi.fn((listener: () => void) => listeners.delete(listener));
		const store: ExternalStore<number> = {
			getSnapshot: () => 0,
			subscribe: (listener) => {
				listeners.add(listener);
				return () => unsubscribe(listener);
			},
		};
		const first = mount(() => createExternalStoreAccessor(() => store, { serverSnapshot: 0 })());
		const second = mount(() => createExternalStoreAccessor(() => store, { serverSnapshot: 0 })());

		expect(listeners.size).toBe(2);
		first.dispose();
		disposers.splice(disposers.indexOf(first.dispose), 1);
		expect(listeners.size).toBe(1);
		second.dispose();
		disposers.splice(disposers.indexOf(second.dispose), 1);
		expect(listeners.size).toBe(0);
		expect(unsubscribe).toHaveBeenCalledTimes(2);
	});
});
