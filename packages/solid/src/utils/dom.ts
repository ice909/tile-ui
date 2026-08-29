const FOCUSABLE_SELECTOR = ['a[href]', 'area[href]', 'button', 'input', 'select', 'textarea', 'iframe', '[contenteditable="true"]', '[tabindex]'].join(',');

function isDisabledByFieldset(element: HTMLElement): boolean {
	const fieldset = element.closest('fieldset[disabled]');
	if (!fieldset) return false;
	const firstLegend = fieldset.querySelector(':scope > legend');
	return !firstLegend?.contains(element);
}

/** 使用节点自身 realm 判断 HTMLElement，避免跨 iframe instanceof 失败。 */
export function isHTMLElementNode(value: unknown): value is HTMLElement {
	if (!value || typeof value !== 'object') return false;
	const node = value as { nodeType?: number; ownerDocument?: Document | null };
	const HTMLElementConstructor = node.ownerDocument?.defaultView?.HTMLElement;
	return node.nodeType === 1 && !!HTMLElementConstructor && value instanceof HTMLElementConstructor;
}

/** 使用节点自身 realm 判断 Node。 */
export function isNodeValue(value: unknown): value is Node {
	if (!value || typeof value !== 'object') return false;
	const node = value as { nodeType?: number; ownerDocument?: Document | null };
	const NodeConstructor = node.ownerDocument?.defaultView?.Node;
	return typeof node.nodeType === 'number' && (!NodeConstructor || value instanceof NodeConstructor);
}

/** 判断元素及其祖先是否可见且未被 inert/aria-hidden 排除。 */
export function isElementEffectivelyVisible(element: HTMLElement, boundary?: HTMLElement): boolean {
	if (!element.isConnected) return false;
	for (let current: HTMLElement | null = element; current; current = current.parentElement) {
		if (current.hidden || current.hasAttribute('inert') || current.getAttribute('aria-hidden') === 'true') return false;
		const style = current.ownerDocument.defaultView?.getComputedStyle(current);
		if (!style) return false;
		if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
		if (current === boundary) return true;
	}
	return boundary === undefined;
}

/** 判断元素是否是可实际聚焦的交互目标。 */
export function isEffectivelyFocusable(element: HTMLElement, boundary?: HTMLElement): boolean {
	if (!element.matches(FOCUSABLE_SELECTOR) || !isElementEffectivelyVisible(element, boundary)) return false;
	if (element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true' || isDisabledByFieldset(element)) return false;
	if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'hidden') return false;
	return element.tabIndex >= 0 || element.isContentEditable;
}

/** 按 DOM 顺序返回容器内可实际聚焦的元素。 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => isEffectivelyFocusable(element, container));
}

/** 获取事件的 composedPath，并为不支持 composedPath 的环境提供回退。 */
export function getEventPath(event: Event): EventTarget[] {
	if (typeof event.composedPath === 'function') return event.composedPath();
	const path: EventTarget[] = [];
	let current = isNodeValue(event.target) ? event.target : null;
	while (current) {
		path.push(current);
		current = current.parentNode;
	}
	return path;
}

/** 判断事件路径是否命中节点本身或其后代。 */
export function eventPathContains(path: readonly EventTarget[], node: Node | null | undefined): boolean {
	if (!node) return false;
	return path.some((entry) => entry === node || (isNodeValue(entry) && node.contains(entry)));
}
