import { getFocusableElements, isEffectivelyFocusable, isHTMLElementNode, isNodeValue } from './dom';
import type { PortalScope } from './portal-scope';

export interface ModalFocusScopeOptions {
	container: () => HTMLElement | null | undefined;
	branches?: () => Iterable<HTMLElement>;
	portalScope?: PortalScope;
	initialFocus?: () => HTMLElement | null | undefined;
	restoreFocus?: boolean | (() => HTMLElement | null | undefined);
	trapFocus?: boolean;
	lockScroll?: boolean;
}

export interface ModalFocusScopeController {
	update: () => void;
	destroy: () => void;
}

interface FocusScopeEntry {
	id: symbol;
	options: ModalFocusScopeOptions;
	document?: Document;
	restoreTarget: HTMLElement | null;
	locked: boolean;
}

interface ScrollLockState {
	count: number;
	overflow: string;
}

const focusStacks = new WeakMap<Document, FocusScopeEntry[]>();
const scrollLocks = new WeakMap<Document, ScrollLockState>();

function lockScroll(document: Document) {
	const state = scrollLocks.get(document) ?? { count: 0, overflow: document.body.style.overflow };
	if (state.count === 0) {
		state.overflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}
	state.count += 1;
	scrollLocks.set(document, state);
}

function unlockScroll(document: Document) {
	const state = scrollLocks.get(document);
	if (!state) return;
	state.count -= 1;
	if (state.count === 0) {
		document.body.style.overflow = state.overflow;
		scrollLocks.delete(document);
	}
}

function getFocusScopeRoots(entry: FocusScopeEntry): HTMLElement[] {
	const container = entry.options.container();
	const document = container?.ownerDocument ?? entry.document;
	const branches = [...(entry.options.branches?.() ?? []), ...(entry.options.portalScope?.getBranches() ?? [])].filter(
		(node): node is HTMLElement => isHTMLElementNode(node) && node.ownerDocument === document,
	);
	return [...new Set([...(container ? [container] : []), ...branches])].filter((root) => root.isConnected);
}

function focusScopeContains(entry: FocusScopeEntry, node: Node | null | undefined): boolean {
	return !!node && getFocusScopeRoots(entry).some((root) => root === node || root.contains(node));
}

function getFocusScopeFocusableElements(entry: FocusScopeEntry): HTMLElement[] {
	const values = getFocusScopeRoots(entry)
		.flatMap((root) => [root, ...getFocusableElements(root)])
		.filter((element) => isEffectivelyFocusable(element));
	return [...new Set(values)];
}

function focusFallback(entry: FocusScopeEntry) {
	const requested = entry.options.initialFocus?.();
	const target =
		requested && focusScopeContains(entry, requested) && isEffectivelyFocusable(requested)
			? requested
			: (getFocusScopeFocusableElements(entry)[0] ?? entry.options.container());
	target?.focus({ preventScroll: true });
}

function topScope(document: Document): FocusScopeEntry | undefined {
	return focusStacks.get(document)?.at(-1);
}

function removeFocusScopeEntry(entry: FocusScopeEntry, restore: boolean) {
	const document = entry.document;
	if (!document) return;
	const stack = focusStacks.get(document);
	const wasTop = stack?.at(-1)?.id === entry.id;
	const index = stack?.findIndex((scope) => scope.id === entry.id) ?? -1;
	if (index !== -1) {
		const nextScope = stack![index + 1];
		if (nextScope) nextScope.restoreTarget = entry.restoreTarget;
		stack!.splice(index, 1);
	}
	if (entry.locked) {
		unlockScroll(document);
		entry.locked = false;
	}
	if (restore && wasTop && entry.options.restoreFocus !== false) {
		const exposed = stack?.at(-1);
		if (entry.restoreTarget?.isConnected && (!exposed || focusScopeContains(exposed, entry.restoreTarget))) entry.restoreTarget.focus({ preventScroll: true });
		else if (exposed) focusFallback(exposed);
		else if (entry.restoreTarget?.isConnected) entry.restoreTarget.focus({ preventScroll: true });
	}
	if (stack?.length === 0) focusStacks.delete(document);
	entry.document = undefined;
}

/** 创建惰性模态焦点控制器；调用 update 绑定晚到或替换后的边界节点。 */
export function activateModalFocusScope(options: ModalFocusScopeOptions): ModalFocusScopeController {
	const entry: FocusScopeEntry = { id: Symbol('focus-scope'), options, restoreTarget: null, locked: false };
	let destroyed = false;
	const onKeyDown = (event: KeyboardEvent) => {
		if (entry.document && topScope(entry.document)?.id === entry.id && options.trapFocus !== false && event.key === 'Tab') {
			const values = getFocusScopeFocusableElements(entry);
			if (values.length === 0) {
				event.preventDefault();
				options.container()?.focus({ preventScroll: true });
				return;
			}
			const first = values[0];
			const last = values.at(-1)!;
			const active = entry.document.activeElement;
			if (event.shiftKey && (active === first || !focusScopeContains(entry, active))) {
				event.preventDefault();
				last.focus({ preventScroll: true });
			} else if (!event.shiftKey && (active === last || !focusScopeContains(entry, active))) {
				event.preventDefault();
				first.focus({ preventScroll: true });
			}
		}
	};
	const onFocusIn = (event: FocusEvent) => {
		if (entry.document && topScope(entry.document)?.id === entry.id && options.trapFocus !== false && isNodeValue(event.target) && !focusScopeContains(entry, event.target))
			focusFallback(entry);
	};
	const update = () => {
		if (destroyed || typeof document === 'undefined') return;
		const nextDocument = options.container()?.ownerDocument;
		if (nextDocument === entry.document) {
			if (nextDocument && topScope(nextDocument)?.id === entry.id && options.trapFocus !== false && !focusScopeContains(entry, nextDocument.activeElement))
				focusFallback(entry);
			return;
		}
		entry.document?.removeEventListener('keydown', onKeyDown);
		entry.document?.removeEventListener('focusin', onFocusIn);
		removeFocusScopeEntry(entry, false);
		if (!nextDocument) return;
		const configuredRestoreTarget = typeof options.restoreFocus === 'function' ? options.restoreFocus() : undefined;
		entry.restoreTarget =
			configuredRestoreTarget && isHTMLElementNode(configuredRestoreTarget) && configuredRestoreTarget.ownerDocument === nextDocument
				? configuredRestoreTarget
				: isHTMLElementNode(nextDocument.activeElement)
					? nextDocument.activeElement
					: null;
		entry.document = nextDocument;
		const stack = focusStacks.get(nextDocument) ?? [];
		stack.push(entry);
		focusStacks.set(nextDocument, stack);
		nextDocument.addEventListener('keydown', onKeyDown);
		nextDocument.addEventListener('focusin', onFocusIn);
		if (options.lockScroll !== false) {
			lockScroll(nextDocument);
			entry.locked = true;
		}
		queueMicrotask(() => {
			if (!destroyed && entry.document === nextDocument && topScope(nextDocument)?.id === entry.id) focusFallback(entry);
		});
	};
	queueMicrotask(update);
	return {
		update,
		destroy() {
			if (destroyed) return;
			destroyed = true;
			entry.document?.removeEventListener('keydown', onKeyDown);
			entry.document?.removeEventListener('focusin', onFocusIn);
			removeFocusScopeEntry(entry, true);
		},
	};
}
