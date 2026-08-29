import { eventPathContains, getEventPath } from './dom';
import type { PortalScope } from './portal-scope';

export type DismissableLayerOutsideEvent = PointerEvent | FocusEvent;

export interface DismissableLayerEvent<E extends Event> {
	originalEvent: E;
	target: EventTarget | null;
	defaultPrevented: boolean;
	preventDefault: () => void;
}

export interface DismissableLayerOptions {
	element: () => HTMLElement | null | undefined;
	branches?: () => Iterable<Node>;
	portalScope?: PortalScope;
	modal?: boolean;
	onEscapeKeyDown?: (event: DismissableLayerEvent<KeyboardEvent>) => void;
	onPointerDownOutside?: (event: DismissableLayerEvent<PointerEvent>) => void;
	onFocusOutside?: (event: DismissableLayerEvent<FocusEvent>) => void;
	onInteractOutside?: (event: DismissableLayerEvent<DismissableLayerOutsideEvent>) => void;
	onDismiss: () => void;
}

export interface DismissableLayerController {
	update: () => void;
	destroy: () => void;
}

interface LayerEntry {
	id: symbol;
	options: DismissableLayerOptions;
	document?: Document;
	suppressFocusOutside: boolean;
}

const layerStacks = new WeakMap<Document, LayerEntry[]>();
const layerCleanups = new WeakMap<Document, () => void>();
const suppressedFocusDocuments = new WeakSet<Document>();

function createLayerEvent<E extends Event>(originalEvent: E): DismissableLayerEvent<E> {
	let defaultPrevented = false;
	return {
		originalEvent,
		target: originalEvent.target,
		get defaultPrevented() {
			return defaultPrevented;
		},
		preventDefault() {
			defaultPrevented = true;
		},
	};
}

function isInside(entry: LayerEntry, event: Event): boolean {
	const path = getEventPath(event);
	const branches = [...(entry.options.branches?.() ?? []), ...(entry.options.portalScope?.getBranches() ?? [])];
	return eventPathContains(path, entry.options.element()) || branches.some((branch) => eventPathContains(path, branch));
}

function topLayer(document: Document): LayerEntry | undefined {
	return layerStacks.get(document)?.at(-1);
}

function installDocumentListeners(document: Document): () => void {
	const onKeyDown = (originalEvent: KeyboardEvent) => {
		if (originalEvent.key !== 'Escape') return;
		const layer = topLayer(document);
		if (!layer) return;
		const event = createLayerEvent(originalEvent);
		layer.options.onEscapeKeyDown?.(event);
		if (event.defaultPrevented) return;
		originalEvent.preventDefault();
		layer.options.onDismiss();
	};
	const onPointerDown = (originalEvent: PointerEvent) => {
		const layer = topLayer(document);
		if (!layer || isInside(layer, originalEvent)) return;
		const event = createLayerEvent(originalEvent);
		layer.suppressFocusOutside = true;
		suppressedFocusDocuments.add(document);
		queueMicrotask(() => {
			layer.suppressFocusOutside = false;
			suppressedFocusDocuments.delete(document);
		});
		layer.options.onPointerDownOutside?.(event);
		layer.options.onInteractOutside?.(event);
		if (event.defaultPrevented) return;
		if (layer.options.modal) originalEvent.preventDefault();
		layer.options.onDismiss();
	};
	const onFocusIn = (originalEvent: FocusEvent) => {
		const layer = topLayer(document);
		if (!layer || layer.suppressFocusOutside || suppressedFocusDocuments.has(document) || isInside(layer, originalEvent)) return;
		const event = createLayerEvent(originalEvent);
		layer.options.onFocusOutside?.(event);
		layer.options.onInteractOutside?.(event);
		if (!event.defaultPrevented) layer.options.onDismiss();
	};
	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('pointerdown', onPointerDown, true);
	document.addEventListener('focusin', onFocusIn);
	return () => {
		document.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('pointerdown', onPointerDown, true);
		document.removeEventListener('focusin', onFocusIn);
	};
}

function removeDismissableLayerEntry(entry: LayerEntry) {
	const document = entry.document;
	if (!document) return;
	const stack = layerStacks.get(document);
	const index = stack?.findIndex((layer) => layer.id === entry.id) ?? -1;
	if (index !== -1) stack!.splice(index, 1);
	if (stack?.length === 0) {
		layerCleanups.get(document)?.();
		layerCleanups.delete(document);
		layerStacks.delete(document);
	}
	entry.document = undefined;
}

/** 创建惰性可关闭层控制器；调用 update 绑定晚到或替换后的节点。 */
export function registerDismissableLayer(options: DismissableLayerOptions): DismissableLayerController {
	const entry: LayerEntry = { id: Symbol('dismissable-layer'), options, suppressFocusOutside: false };
	let destroyed = false;
	const update = () => {
		if (destroyed || typeof document === 'undefined') return;
		const nextDocument = options.element()?.ownerDocument;
		if (nextDocument === entry.document) return;
		removeDismissableLayerEntry(entry);
		if (!nextDocument) return;
		const stack = layerStacks.get(nextDocument) ?? [];
		stack.push(entry);
		entry.document = nextDocument;
		layerStacks.set(nextDocument, stack);
		if (!layerCleanups.has(nextDocument)) layerCleanups.set(nextDocument, installDocumentListeners(nextDocument));
	};
	queueMicrotask(update);
	return {
		update,
		destroy() {
			if (destroyed) return;
			destroyed = true;
			removeDismissableLayerEntry(entry);
		},
	};
}
