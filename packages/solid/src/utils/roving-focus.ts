export type RovingFocusIntent = 'first' | 'last' | 'next' | 'previous';

function hasExcludedAncestor(element: HTMLElement): boolean {
	for (let current: HTMLElement | null = element; current; current = current.parentElement) {
		if (current.hidden || current.hasAttribute('inert') || current.getAttribute('aria-hidden') === 'true') {
			return true;
		}
		const style = getComputedStyle(current);
		if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') {
			return true;
		}
	}
	return false;
}

/** 判断元素是否可作为 roving focus 目标。 */
export function isRovingFocusCandidate(element: HTMLElement): boolean {
	if (!element.isConnected || hasExcludedAncestor(element) || element.getAttribute('aria-disabled') === 'true') {
		return false;
	}
	if (element.matches(':disabled') || (element instanceof HTMLInputElement && element.type === 'hidden')) {
		return false;
	}
	if (element.hasAttribute('tabindex')) {
		return element.tabIndex >= -1;
	}
	if (element instanceof HTMLAnchorElement) {
		return element.hasAttribute('href');
	}
	return (
		element instanceof HTMLButtonElement ||
		element instanceof HTMLInputElement ||
		element instanceof HTMLSelectElement ||
		element instanceof HTMLTextAreaElement ||
		element.isContentEditable
	);
}

/** 查找跳过 disabled/aria-disabled 元素后的 roving focus 目标。 */
export function getRovingFocusTarget(elements: readonly HTMLElement[], current: HTMLElement | null, intent: RovingFocusIntent, loop: boolean = true): HTMLElement | undefined {
	const enabled = elements.filter(isRovingFocusCandidate);
	if (enabled.length === 0) {
		return undefined;
	}
	if (intent === 'first') {
		return enabled[0];
	}
	if (intent === 'last') {
		return enabled.at(-1);
	}

	const currentIndex = current ? enabled.indexOf(current) : -1;
	const step = intent === 'next' ? 1 : -1;
	const nextIndex = currentIndex === -1 ? (step === 1 ? 0 : enabled.length - 1) : currentIndex + step;
	if (loop) {
		return enabled[(nextIndex + enabled.length) % enabled.length];
	}
	return enabled[nextIndex];
}

/** 聚焦 roving focus 目标并返回该元素。 */
export function moveRovingFocus(elements: readonly HTMLElement[], current: HTMLElement | null, intent: RovingFocusIntent, loop: boolean = true): HTMLElement | undefined {
	const target = getRovingFocusTarget(elements, current, intent, loop);
	target?.focus();
	return target;
}
