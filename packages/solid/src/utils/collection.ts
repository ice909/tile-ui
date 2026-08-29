import { isElementEffectivelyVisible } from './dom';

export type CollectionMoveIntent = 'first' | 'last' | 'next' | 'previous';

export interface CollectionItem<T extends HTMLElement> {
	element: T;
	disabled?: () => boolean;
	hidden?: () => boolean;
	textValue?: () => string;
}

export interface CollectionRegistryOptions {
	loop?: boolean;
	typeaheadTimeout?: number;
	setTimeout?: typeof globalThis.setTimeout;
	clearTimeout?: typeof globalThis.clearTimeout;
}

export interface CollectionRegistry<T extends HTMLElement> {
	register: (item: CollectionItem<T>) => () => void;
	items: () => CollectionItem<T>[];
	enabledItems: () => CollectionItem<T>[];
	move: (current: T | null, intent: CollectionMoveIntent) => CollectionItem<T> | undefined;
	typeahead: (key: string, current?: T | null) => CollectionItem<T> | undefined;
	resetTypeahead: () => void;
	destroy: () => void;
}

function compareDomOrder<T extends HTMLElement>(left: CollectionItem<T>, right: CollectionItem<T>): number {
	if (left.element === right.element) return 0;
	return left.element.compareDocumentPosition(right.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

/** 创建按实时 DOM 顺序读取的集合注册表，含 roving 移动与可选 typeahead。 */
export function createCollectionRegistry<T extends HTMLElement>(options: CollectionRegistryOptions = {}): CollectionRegistry<T> {
	const entries = new Set<CollectionItem<T>>();
	const schedule = options.setTimeout ?? globalThis.setTimeout;
	const cancel = options.clearTimeout ?? globalThis.clearTimeout;
	let search = '';
	let timer: ReturnType<typeof setTimeout> | undefined;
	const items = () => [...entries].filter((item) => item.element.isConnected).sort(compareDomOrder);
	const enabledItems = () => items().filter((item) => !item.disabled?.() && !item.hidden?.() && isElementEffectivelyVisible(item.element));
	const resetTypeahead = () => {
		search = '';
		if (timer !== undefined) cancel(timer);
		timer = undefined;
	};
	return {
		register(item) {
			entries.add(item);
			return () => entries.delete(item);
		},
		items,
		enabledItems,
		move(current, intent) {
			const enabled = enabledItems();
			if (enabled.length === 0) return undefined;
			if (intent === 'first') return enabled[0];
			if (intent === 'last') return enabled.at(-1);
			const currentIndex = enabled.findIndex((item) => item.element === current);
			const step = intent === 'next' ? 1 : -1;
			const nextIndex = currentIndex === -1 ? (step === 1 ? 0 : enabled.length - 1) : currentIndex + step;
			if (options.loop === false) return enabled[nextIndex];
			return enabled[(nextIndex + enabled.length) % enabled.length];
		},
		typeahead(key, current = null) {
			if (key.length !== 1 || key.trim() === '') return undefined;
			if (timer !== undefined) cancel(timer);
			search += key.toLocaleLowerCase();
			const repeated = [...search].every((character) => character === search[0]);
			const query = repeated ? search[0] : search;
			const enabled = enabledItems();
			const currentIndex = enabled.findIndex((item) => item.element === current);
			const ordered = [...enabled.slice(currentIndex + 1), ...enabled.slice(0, currentIndex + 1)];
			const match = ordered.find((item) => (item.textValue?.() ?? item.element.textContent ?? '').trim().toLocaleLowerCase().startsWith(query));
			timer = schedule(resetTypeahead, options.typeaheadTimeout ?? 700);
			return match;
		},
		resetTypeahead,
		destroy() {
			resetTypeahead();
			entries.clear();
		},
	};
}
