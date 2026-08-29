export interface AnchoredPositionMeasure {
	anchorRect: DOMRect;
	contentRect: DOMRect;
	containerRect: DOMRect;
	direction: 'ltr' | 'rtl';
}

export interface AnchoredPositionOptions {
	anchor: () => HTMLElement | null | undefined;
	content: () => HTMLElement | null | undefined;
	container?: () => Element | null | undefined;
	open?: () => boolean;
	onPosition: (measure: AnchoredPositionMeasure) => void;
}

export interface AnchoredPositionController {
	recompute: () => void;
	destroy: () => void;
}

function viewportRect(document: Document): DOMRect {
	const view = document.defaultView;
	const Rect = view?.DOMRect ?? DOMRect;
	return new Rect(0, 0, view?.innerWidth ?? 0, view?.innerHeight ?? 0);
}

function hasHiddenAncestor(element: HTMLElement): boolean {
	for (let current: HTMLElement | null = element; current; current = current.parentElement) {
		const style = current.ownerDocument.defaultView?.getComputedStyle(current);
		if (!style) return true;
		if (current.hidden || style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return true;
	}
	return false;
}

function measureContent(content: HTMLElement): DOMRect {
	if (!hasHiddenAncestor(content)) return content.getBoundingClientRect();
	const clone = content.cloneNode(true) as HTMLElement;
	for (const element of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
		for (const attribute of [
			'id',
			'name',
			'for',
			'form',
			'list',
			'headers',
			'aria-labelledby',
			'aria-describedby',
			'aria-controls',
			'aria-activedescendant',
			'aria-details',
			'aria-errormessage',
			'aria-owns',
			'aria-flowto',
			'itemref',
			'usemap',
			'popovertarget',
			'commandfor',
			'anchor',
		])
			element.removeAttribute(attribute);
	}
	Object.assign(clone.style, {
		display: 'block',
		position: 'fixed',
		left: '-100000px',
		top: '0',
		visibility: 'hidden',
		pointerEvents: 'none',
	});
	const host = content.ownerDocument.body;
	try {
		host.appendChild(clone);
		return clone.getBoundingClientRect();
	} finally {
		clone.remove();
	}
}

/** 绑定可迁移的锚点定位生命周期；每次 recompute 都核对节点身份与 ownerDocument。 */
export function createAnchoredPosition(options: AnchoredPositionOptions): AnchoredPositionController {
	if (typeof document === 'undefined') return { recompute: () => undefined, destroy: () => undefined };
	let ownerDocument: Document | undefined;
	let view: Window | null | undefined;
	let frame = 0;
	let destroyed = false;
	let observer: ResizeObserver | undefined;
	let observed: Element[] = [];
	const disconnectObserver = () => {
		try {
			observer?.disconnect();
		} catch {}
		observer = undefined;
	};

	const cancelFrame = () => {
		if (frame && view?.cancelAnimationFrame) view.cancelAnimationFrame(frame);
		frame = 0;
	};
	const detach = () => {
		cancelFrame();
		disconnectObserver();
		observed = [];
		view?.removeEventListener('resize', recompute);
		ownerDocument?.removeEventListener('scroll', recompute, true);
		view = undefined;
		ownerDocument = undefined;
	};
	const reconcile = () => {
		const anchor = options.anchor();
		const content = options.content();
		const container = options.container?.();
		const nextDocument = anchor?.ownerDocument;
		const compatible = !!anchor && !!content && content.ownerDocument === nextDocument && (!container || container.ownerDocument === nextDocument);
		if (!compatible) {
			if (ownerDocument || observed.length > 0) detach();
			return;
		}
		const nextObserved = [anchor, content, container].filter((node): node is Element => !!node);
		const identityChanged = nextDocument !== ownerDocument || nextObserved.length !== observed.length || nextObserved.some((node, index) => node !== observed[index]);
		if (!identityChanged) return;
		detach();
		if (!nextDocument) return;
		ownerDocument = nextDocument;
		view = nextDocument.defaultView;
		const ResizeObserverConstructor = view ? (view as Window & typeof globalThis).ResizeObserver : undefined;
		try {
			observer = ResizeObserverConstructor ? new ResizeObserverConstructor(recompute) : undefined;
		} catch {
			observer = undefined;
		}
		observed = nextObserved;
		if (observer) {
			try {
				for (const node of observed) observer.observe(node);
			} catch {
				disconnectObserver();
			}
		}
		view?.addEventListener('resize', recompute);
		nextDocument.addEventListener('scroll', recompute, true);
	};
	const measure = () => {
		frame = 0;
		if (destroyed) return;
		reconcile();
		if (options.open?.() === false) return;
		const anchor = options.anchor();
		const content = options.content();
		if (!anchor?.isConnected || !content?.isConnected || anchor.ownerDocument !== content.ownerDocument) return;
		const container = options.container?.();
		if (container && container.ownerDocument !== anchor.ownerDocument) return;
		options.onPosition({
			anchorRect: anchor.getBoundingClientRect(),
			contentRect: measureContent(content),
			containerRect: container?.getBoundingClientRect() ?? viewportRect(anchor.ownerDocument),
			direction: anchor.ownerDocument.defaultView?.getComputedStyle(anchor).direction === 'rtl' ? 'rtl' : 'ltr',
		});
	};
	function recompute() {
		if (destroyed) return;
		reconcile();
		cancelFrame();
		if (view?.requestAnimationFrame) frame = view.requestAnimationFrame(measure);
		else measure();
	}
	queueMicrotask(recompute);
	return {
		recompute,
		destroy() {
			if (destroyed) return;
			destroyed = true;
			detach();
		},
	};
}
