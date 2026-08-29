import { isEffectivelyFocusable } from '../../utils';

const TAB_CANDIDATE_SELECTOR = 'a[href], area[href], button, input, select, textarea, summary, iframe, [contenteditable="true"], [tabindex]';

/** 按原生 Tab 顺序查找 Trigger 相邻目标，并排除 Portal 内容树。 */
export function getLogicalTabTarget(trigger: HTMLElement | undefined, excluded: HTMLElement | undefined, backwards: boolean): HTMLElement | undefined {
	if (!trigger) return undefined;
	const ownerDocument = trigger.ownerDocument;
	const candidates = Array.from(ownerDocument.querySelectorAll<HTMLElement>(TAB_CANDIDATE_SELECTOR)).filter(
		(element) => (element === trigger || isEffectivelyFocusable(element)) && !excluded?.contains(element),
	);
	if (!candidates.includes(trigger)) candidates.push(trigger);
	candidates.sort((left, right) => {
		if (left === right) return 0;
		const leftOrder = left.tabIndex > 0 ? left.tabIndex : Number.POSITIVE_INFINITY;
		const rightOrder = right.tabIndex > 0 ? right.tabIndex : Number.POSITIVE_INFINITY;
		if (leftOrder !== rightOrder) return leftOrder - rightOrder;
		const following = ownerDocument.defaultView?.Node.DOCUMENT_POSITION_FOLLOWING ?? 4;
		return left.compareDocumentPosition(right) & following ? -1 : 1;
	});
	const index = candidates.indexOf(trigger);
	return candidates[index + (backwards ? -1 : 1)];
}
