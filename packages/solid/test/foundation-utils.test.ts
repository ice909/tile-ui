import { createRoot } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	activateModalFocusScope,
	composeRefs,
	createAnchoredPosition,
	createCollectionRegistry,
	createCompositeIdRegistry,
	createHoverIntent,
	createPortalScope,
	registerDismissableLayer,
	resolvePortalContainer,
} from '../src/utils';

afterEach(() => {
	document.body.innerHTML = '';
	document.body.style.overflow = '';
	vi.useRealTimers();
	vi.restoreAllMocks();
});

function pointerDown(target: Element) {
	target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true, cancelable: true }));
}

describe('Stage 3 shared foundation', () => {
	it('inherits containers and propagates descendant branches only toward ancestors', () => {
		const outer = document.createElement('div');
		const inner = document.createElement('div');
		const parentBranch = document.createElement('div');
		const childBranch = document.createElement('div');
		const parent = createPortalScope(() => outer);
		const child = createPortalScope(() => undefined, parent);
		const cleanupParent = parent.addBranch(parentBranch);
		const cleanupChildFirst = child.addBranch(childBranch);
		const cleanupChildSecond = child.addBranch(childBranch);
		expect(resolvePortalContainer(child)).toBe(outer);
		expect(resolvePortalContainer(child, inner)).toBe(inner);
		expect(parent.getBranches()).toEqual([parentBranch, childBranch]);
		expect(child.getBranches()).toEqual([childBranch]);
		cleanupChildFirst();
		expect(parent.getBranches()).toContain(childBranch);
		cleanupChildSecond();
		expect(parent.getBranches()).toEqual([parentBranch]);
		cleanupParent();
		expect(parent.getBranches()).toEqual([]);
		expect(child.getBranches()).toEqual([]);
	});

	it('dismisses only the top layer for Escape and outside pointer paths', () => {
		const outside = document.createElement('button');
		const lower = document.createElement('div');
		const upper = document.createElement('div');
		document.body.append(outside, lower, upper);
		const lowerDismiss = vi.fn();
		const upperDismiss = vi.fn();
		const cleanupLower = registerDismissableLayer({ element: () => lower, onDismiss: lowerDismiss });
		const cleanupUpper = registerDismissableLayer({ element: () => upper, onDismiss: upperDismiss });
		cleanupLower.update();
		cleanupUpper.update();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
		expect(upperDismiss).toHaveBeenCalledOnce();
		expect(lowerDismiss).not.toHaveBeenCalled();
		cleanupUpper.destroy();
		pointerDown(outside);
		expect(lowerDismiss).toHaveBeenCalledOnce();
		cleanupLower.destroy();
	});

	it('treats nested portal branches as inside and honors preventDefault', () => {
		const layer = document.createElement('div');
		const branch = document.createElement('div');
		const branchChild = document.createElement('button');
		const outside = document.createElement('button');
		branch.appendChild(branchChild);
		document.body.append(layer, branch, outside);
		const dismiss = vi.fn();
		const onOutside = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
		const cleanup = registerDismissableLayer({ element: () => layer, branches: () => [branch], modal: true, onPointerDownOutside: onOutside, onDismiss: dismiss });
		cleanup.update();
		pointerDown(branchChild);
		expect(onOutside).not.toHaveBeenCalled();
		pointerDown(outside);
		expect(onOutside).toHaveBeenCalledOnce();
		expect(dismiss).not.toHaveBeenCalled();
		cleanup.destroy();
		pointerDown(outside);
		expect(onOutside).toHaveBeenCalledOnce();
	});

	it('gives ancestor layers descendant portal ownership without leaking ancestor branches to child layers', () => {
		const parentElement = document.createElement('div');
		const childElement = document.createElement('div');
		const parentBranch = document.createElement('button');
		const childBranch = document.createElement('button');
		document.body.append(parentElement, childElement, parentBranch, childBranch);
		const parentScope = createPortalScope();
		const childScope = createPortalScope(() => undefined, parentScope);
		parentScope.addBranch(parentBranch);
		childScope.addBranch(childBranch);
		const parentDismiss = vi.fn();
		const childDismiss = vi.fn();
		const parentLayer = registerDismissableLayer({ element: () => parentElement, portalScope: parentScope, onDismiss: parentDismiss });
		parentLayer.update();
		const childLayer = registerDismissableLayer({ element: () => childElement, portalScope: childScope, onDismiss: childDismiss });
		childLayer.update();
		pointerDown(childBranch);
		expect(childDismiss).not.toHaveBeenCalled();
		pointerDown(parentBranch);
		expect(childDismiss).toHaveBeenCalledOnce();
		childLayer.destroy();
		pointerDown(childBranch);
		expect(parentDismiss).not.toHaveBeenCalled();
		parentLayer.destroy();
	});

	it('supports focus outside contracts, preventDefault, and pointer/focus single dismissal ordering', async () => {
		const layer = document.createElement('div');
		const outside = document.createElement('button');
		document.body.append(layer, outside);
		const dismiss = vi.fn();
		const interactions: string[] = [];
		const controller = registerDismissableLayer({
			element: () => layer,
			onFocusOutside: (event) => {
				interactions.push('focus');
				event.preventDefault();
			},
			onInteractOutside: (event) => interactions.push(event.originalEvent.type),
			onDismiss: dismiss,
		});
		controller.update();
		outside.focus();
		expect(interactions).toEqual(['focus', 'focusin']);
		expect(dismiss).not.toHaveBeenCalled();
		pointerDown(outside);
		outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		expect(dismiss).toHaveBeenCalledOnce();
		await Promise.resolve();
		outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		expect(dismiss).toHaveBeenCalledTimes(1);
		controller.destroy();
	});

	it('suppresses focus dismissal when outside pointer interaction is prevented', async () => {
		const layer = document.createElement('div');
		const outside = document.createElement('button');
		document.body.append(layer, outside);
		const dismiss = vi.fn();
		const focusOutside = vi.fn();
		const controller = registerDismissableLayer({
			element: () => layer,
			onPointerDownOutside: (event) => event.preventDefault(),
			onFocusOutside: focusOutside,
			onDismiss: dismiss,
		});
		controller.update();
		pointerDown(outside);
		outside.focus();
		expect(dismiss).not.toHaveBeenCalled();
		expect(focusOutside).not.toHaveBeenCalled();
		await Promise.resolve();
		controller.destroy();
	});

	it('binds dismissable layers after late refs and reads replaced elements and branches live', async () => {
		let element: HTMLElement | undefined;
		let branches: Node[] = [];
		const outside = document.createElement('button');
		document.body.appendChild(outside);
		const dismiss = vi.fn();
		const controller = registerDismissableLayer({ element: () => element, branches: () => branches, onDismiss: dismiss });
		element = document.createElement('div');
		const branch = document.createElement('button');
		document.body.append(element, branch);
		branches = [branch];
		await Promise.resolve();
		pointerDown(branch);
		expect(dismiss).not.toHaveBeenCalled();
		const replacement = document.createElement('div');
		document.body.replaceChild(replacement, element);
		element = replacement;
		branches = [];
		controller.update();
		pointerDown(branch);
		expect(dismiss).toHaveBeenCalledOnce();
		controller.destroy();
	});

	it('traps effective focus, reference-counts scroll lock, and restores nested focus', async () => {
		const trigger = document.createElement('button');
		const first = document.createElement('div');
		const firstButton = document.createElement('button');
		const hidden = document.createElement('button');
		hidden.hidden = true;
		first.tabIndex = -1;
		first.append(hidden, firstButton);
		const second = document.createElement('div');
		const secondButton = document.createElement('button');
		second.tabIndex = -1;
		second.appendChild(secondButton);
		document.body.append(trigger, first, second);
		trigger.focus();
		const cleanupFirst = activateModalFocusScope({ container: () => first });
		cleanupFirst.update();
		await Promise.resolve();
		expect(document.activeElement).toBe(firstButton);
		expect(document.body.style.overflow).toBe('hidden');
		const cleanupSecond = activateModalFocusScope({ container: () => second });
		cleanupSecond.update();
		await Promise.resolve();
		expect(document.activeElement).toBe(secondButton);
		cleanupFirst.destroy();
		expect(document.body.style.overflow).toBe('hidden');
		cleanupSecond.destroy();
		expect(document.body.style.overflow).toBe('');
		expect(document.activeElement).toBe(trigger);
	});

	it('cycles Tab within the top modal and redirects escaped focus', async () => {
		const outside = document.createElement('button');
		const scope = document.createElement('div');
		const first = document.createElement('button');
		const last = document.createElement('button');
		scope.tabIndex = -1;
		scope.append(first, last);
		document.body.append(outside, scope);
		const cleanup = activateModalFocusScope({ container: () => scope, lockScroll: false });
		cleanup.update();
		await Promise.resolve();
		last.focus();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
		expect(document.activeElement).toBe(first);
		outside.focus();
		expect(document.activeElement).toBe(first);
		cleanup.destroy();
	});

	it('treats reactive portal branches as focus boundary and restores exact targets top-first', async () => {
		const trigger = document.createElement('button');
		const lower = document.createElement('div');
		const lowerBranch = document.createElement('div');
		const branchButton = document.createElement('button');
		const upper = document.createElement('div');
		const upperButton = document.createElement('button');
		lower.tabIndex = -1;
		upper.tabIndex = -1;
		lowerBranch.appendChild(branchButton);
		upper.appendChild(upperButton);
		document.body.append(trigger, lower, lowerBranch, upper);
		const scope = createPortalScope();
		scope.addBranch(lowerBranch);
		trigger.focus();
		const lowerController = activateModalFocusScope({ container: () => lower, portalScope: scope, initialFocus: () => branchButton });
		lowerController.update();
		await Promise.resolve();
		expect(document.activeElement).toBe(branchButton);
		const upperController = activateModalFocusScope({ container: () => upper });
		upperController.update();
		await Promise.resolve();
		expect(document.activeElement).toBe(upperButton);
		upperController.destroy();
		expect(document.activeElement).toBe(branchButton);
		lowerController.destroy();
		expect(document.activeElement).toBe(trigger);
	});

	it('transfers restoration through lower-first close and supports late/replaced focus refs', async () => {
		const trigger = document.createElement('button');
		let lower: HTMLElement | undefined;
		let lowerButton: HTMLButtonElement | undefined;
		const upper = document.createElement('div');
		const upperButton = document.createElement('button');
		upper.tabIndex = -1;
		upper.appendChild(upperButton);
		document.body.append(trigger, upper);
		trigger.focus();
		const lowerController = activateModalFocusScope({ container: () => lower, initialFocus: () => lowerButton });
		lower = document.createElement('div');
		lower.tabIndex = -1;
		lowerButton = document.createElement('button');
		lower.appendChild(lowerButton);
		document.body.insertBefore(lower, upper);
		lowerController.update();
		await Promise.resolve();
		expect(document.activeElement).toBe(lowerButton);
		const upperController = activateModalFocusScope({ container: () => upper });
		upperController.update();
		await Promise.resolve();
		const replacement = document.createElement('div');
		const replacementButton = document.createElement('button');
		replacement.tabIndex = -1;
		replacement.appendChild(replacementButton);
		document.body.replaceChild(replacement, upper);
		upperController.destroy();
		expect(document.activeElement).toBe(lowerButton);
		const replacementController = activateModalFocusScope({ container: () => replacement, initialFocus: () => replacementButton });
		replacementController.update();
		await Promise.resolve();
		lowerController.destroy();
		expect(document.body.style.overflow).toBe('hidden');
		replacementController.destroy();
		expect(document.activeElement).toBe(trigger);
		expect(document.body.style.overflow).toBe('');
	});

	it('reconciles a replaced active focus boundary in the same document', async () => {
		let scope = document.createElement('div');
		let button = document.createElement('button');
		scope.tabIndex = -1;
		scope.appendChild(button);
		document.body.appendChild(scope);
		const controller = activateModalFocusScope({ container: () => scope });
		controller.update();
		await Promise.resolve();
		expect(document.activeElement).toBe(button);
		const replacement = document.createElement('div');
		const replacementButton = document.createElement('button');
		replacement.tabIndex = -1;
		replacement.appendChild(replacementButton);
		document.body.replaceChild(replacement, scope);
		scope = replacement;
		button = replacementButton;
		controller.update();
		expect(document.activeElement).toBe(button);
		controller.destroy();
	});

	it('traps iframe-realm branches and restores the exact iframe focus target after migration', async () => {
		const frame = document.createElement('iframe');
		document.body.appendChild(frame);
		const iframeDocument = frame.contentDocument!;
		const restoreTarget = iframeDocument.createElement('button');
		const scope = iframeDocument.createElement('div');
		const scopeButton = iframeDocument.createElement('button');
		const branch = iframeDocument.createElement('div');
		const branchButton = iframeDocument.createElement('button');
		scope.tabIndex = -1;
		scope.appendChild(scopeButton);
		branch.appendChild(branchButton);
		iframeDocument.body.append(restoreTarget, scope, branch);
		restoreTarget.focus();
		const controller = activateModalFocusScope({ container: () => scope, branches: () => [branch], initialFocus: () => branchButton });
		controller.update();
		await Promise.resolve();
		expect(iframeDocument.activeElement).toBe(branchButton);
		branchButton.focus();
		iframeDocument.dispatchEvent(new iframeDocument.defaultView!.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
		expect(iframeDocument.activeElement).toBe(scopeButton);
		controller.destroy();
		expect(iframeDocument.activeElement).toBe(restoreTarget);
	});

	it('premeasures hidden anchored content and cleans resize/scroll observers', async () => {
		const anchor = document.createElement('button');
		const content = document.createElement('div');
		const container = document.createElement('div');
		anchor.style.direction = 'rtl';
		document.body.append(anchor, content, container);
		vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 20, 30, 40));
		vi.spyOn(content, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 60));
		vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(new DOMRect(5, 5, 300, 200));
		const observed: Element[] = [];
		const disconnect = vi.fn();
		class TestResizeObserver {
			observe(element: Element) {
				observed.push(element);
			}
			disconnect = disconnect;
		}
		vi.stubGlobal('ResizeObserver', TestResizeObserver);
		const addDocument = vi.spyOn(document, 'addEventListener');
		const removeDocument = vi.spyOn(document, 'removeEventListener');
		const addWindow = vi.spyOn(window, 'addEventListener');
		const removeWindow = vi.spyOn(window, 'removeEventListener');
		const onPosition = vi.fn();
		const position = createAnchoredPosition({ anchor: () => anchor, content: () => content, container: () => container, onPosition });
		await Promise.resolve();
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(observed).toEqual([anchor, content, container]);
		expect(onPosition).toHaveBeenCalledWith(
			expect.objectContaining({ direction: 'rtl', anchorRect: expect.objectContaining({ width: 30 }), contentRect: expect.objectContaining({ width: 100 }) }),
		);
		position.destroy();
		expect(disconnect).toHaveBeenCalledOnce();
		expect(addDocument).toHaveBeenCalledWith('scroll', expect.any(Function), true);
		expect(removeDocument).toHaveBeenCalledWith('scroll', expect.any(Function), true);
		expect(addWindow).toHaveBeenCalledWith('resize', expect.any(Function));
		expect(removeWindow).toHaveBeenCalledWith('resize', expect.any(Function));
	});

	it('binds anchored positioning after late mount and supports open recompute', async () => {
		let anchor: HTMLElement | undefined;
		let content: HTMLElement | undefined;
		let open = false;
		const onPosition = vi.fn();
		const position = createAnchoredPosition({ anchor: () => anchor, content: () => content, open: () => open, onPosition });
		anchor = document.createElement('button');
		content = document.createElement('div');
		document.body.append(anchor, content);
		await Promise.resolve();
		expect(onPosition).not.toHaveBeenCalled();
		open = true;
		position.recompute();
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(onPosition).toHaveBeenCalledOnce();
		position.destroy();
	});

	it('reconciles replaced positioning nodes, observes containers, and migrates owner documents', async () => {
		const frame = document.createElement('iframe');
		document.body.appendChild(frame);
		const otherDocument = frame.contentDocument!;
		let anchor = document.createElement('button');
		let content = document.createElement('div');
		let container = document.createElement('div');
		document.body.append(anchor, content, container);
		const observed: Element[] = [];
		const unobserved: Element[] = [];
		const disconnect = vi.fn();
		class TestResizeObserver {
			observe(element: Element) {
				observed.push(element);
			}
			unobserve(element: Element) {
				unobserved.push(element);
			}
			disconnect = disconnect;
		}
		vi.stubGlobal('ResizeObserver', TestResizeObserver);
		const removeMain = vi.spyOn(document, 'removeEventListener');
		const addOther = vi.spyOn(otherDocument, 'addEventListener');
		const onPosition = vi.fn();
		const position = createAnchoredPosition({ anchor: () => anchor, content: () => content, container: () => container, onPosition });
		await Promise.resolve();
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(observed).toEqual([anchor, content, container]);
		anchor = otherDocument.createElement('button');
		content = otherDocument.createElement('div');
		container = otherDocument.createElement('div');
		otherDocument.body.append(anchor, content, container);
		position.recompute();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(disconnect).toHaveBeenCalled();
		expect(removeMain).toHaveBeenCalledWith('scroll', expect.any(Function), true);
		expect(addOther).toHaveBeenCalledWith('scroll', expect.any(Function), true);
		position.destroy();
		expect(unobserved).toEqual([]);
	});

	it('defers mixed-document positioning and binds only after every node shares one document', async () => {
		const frame = document.createElement('iframe');
		document.body.appendChild(frame);
		const iframeDocument = frame.contentDocument!;
		let anchor = document.createElement('button');
		let content = iframeDocument.createElement('div');
		let container = document.createElement('div');
		document.body.append(anchor, container);
		iframeDocument.body.appendChild(content);
		const observe = vi.fn();
		const disconnect = vi.fn();
		class TestResizeObserver {
			observe = observe;
			disconnect = disconnect;
		}
		vi.stubGlobal('ResizeObserver', TestResizeObserver);
		Object.defineProperty(iframeDocument.defaultView, 'ResizeObserver', { configurable: true, value: TestResizeObserver });
		const onPosition = vi.fn();
		const position = createAnchoredPosition({ anchor: () => anchor, content: () => content, container: () => container, onPosition });
		await Promise.resolve();
		expect(observe).not.toHaveBeenCalled();
		expect(onPosition).not.toHaveBeenCalled();
		anchor = iframeDocument.createElement('button');
		container = iframeDocument.createElement('div');
		iframeDocument.body.append(anchor, container);
		position.recompute();
		await new Promise((resolve) => iframeDocument.defaultView!.requestAnimationFrame(resolve));
		expect(observe).toHaveBeenCalledTimes(3);
		expect(onPosition).toHaveBeenCalledOnce();
		position.destroy();
	});

	it('contains ResizeObserver construction and observe failures and still cleans listeners', async () => {
		const anchor = document.createElement('button');
		const content = document.createElement('div');
		document.body.append(anchor, content);
		class ThrowingResizeObserver {
			constructor() {
				throw new Error('observer failed');
			}
		}
		vi.stubGlobal('ResizeObserver', ThrowingResizeObserver);
		const removeDocument = vi.spyOn(document, 'removeEventListener');
		const onPosition = vi.fn();
		const position = createAnchoredPosition({ anchor: () => anchor, content: () => content, onPosition });
		await Promise.resolve();
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(onPosition).toHaveBeenCalledOnce();
		position.destroy();
		expect(removeDocument).toHaveBeenCalledWith('scroll', expect.any(Function), true);
	});

	it('premeasures content hidden by an ancestor using a cleaned clone host', async () => {
		const anchor = document.createElement('button');
		const hidden = document.createElement('div');
		const content = document.createElement('div');
		content.id = 'content-id';
		const label = document.createElement('label');
		label.id = 'label-id';
		label.htmlFor = 'input-id';
		const input = document.createElement('input');
		input.id = 'input-id';
		input.name = 'field';
		input.setAttribute('aria-labelledby', 'label-id');
		input.setAttribute('aria-activedescendant', 'option-id');
		input.setAttribute('aria-details', 'details-id');
		input.setAttribute('aria-errormessage', 'error-id');
		input.setAttribute('aria-owns', 'owned-id');
		input.setAttribute('aria-flowto', 'next-id');
		input.setAttribute('form', 'form-id');
		input.setAttribute('list', 'list-id');
		input.setAttribute('headers', 'header-id');
		input.setAttribute('itemref', 'item-id');
		input.setAttribute('usemap', '#map-id');
		input.setAttribute('popovertarget', 'popover-id');
		input.setAttribute('commandfor', 'command-id');
		input.setAttribute('anchor', 'anchor-id');
		content.append(label, input);
		hidden.style.display = 'none';
		hidden.appendChild(content);
		document.body.append(anchor, hidden);
		const originalClone = content.cloneNode.bind(content);
		vi.spyOn(content, 'cloneNode').mockImplementation((deep) => {
			const clone = originalClone(deep) as HTMLElement;
			vi.spyOn(clone, 'getBoundingClientRect').mockImplementation(() => {
				expect(clone.querySelector('[id]')).toBeNull();
				expect(clone.querySelector('[name]')).toBeNull();
				expect(clone.querySelector('[for]')).toBeNull();
				expect(clone.querySelector('[aria-labelledby]')).toBeNull();
				expect(clone.querySelector('[aria-activedescendant]')).toBeNull();
				expect(clone.querySelector('[aria-details]')).toBeNull();
				expect(clone.querySelector('[aria-errormessage]')).toBeNull();
				expect(clone.querySelector('[aria-owns]')).toBeNull();
				expect(clone.querySelector('[aria-flowto]')).toBeNull();
				expect(clone.querySelector('[form]')).toBeNull();
				expect(clone.querySelector('[list]')).toBeNull();
				expect(clone.querySelector('[headers]')).toBeNull();
				expect(clone.querySelector('[itemref]')).toBeNull();
				expect(clone.querySelector('[usemap]')).toBeNull();
				expect(clone.querySelector('[popovertarget]')).toBeNull();
				expect(clone.querySelector('[commandfor]')).toBeNull();
				expect(clone.querySelector('[anchor]')).toBeNull();
				return new DOMRect(0, 0, 120, 80);
			});
			return clone;
		});
		const onPosition = vi.fn();
		const position = createAnchoredPosition({ anchor: () => anchor, content: () => content, onPosition });
		await Promise.resolve();
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(onPosition).toHaveBeenCalledWith(expect.objectContaining({ contentRect: expect.objectContaining({ width: 120, height: 80 }) }));
		expect(document.body.querySelector('[style*="-100000px"]')).toBeNull();
		position.destroy();
	});

	it('orders collections by DOM and filters disabled or hidden items', () => {
		const first = document.createElement('button');
		const disabled = document.createElement('button');
		const hidden = document.createElement('button');
		const last = document.createElement('button');
		hidden.hidden = true;
		document.body.append(last, disabled, hidden, first);
		const collection = createCollectionRegistry<HTMLButtonElement>();
		collection.register({ element: first, textValue: () => 'Alpha' });
		collection.register({ element: disabled, disabled: () => true, textValue: () => 'Beta' });
		collection.register({ element: hidden, textValue: () => 'Hidden' });
		collection.register({ element: last, textValue: () => 'Zulu' });
		expect(collection.items().map((item) => item.element)).toEqual([last, disabled, hidden, first]);
		expect(collection.enabledItems().map((item) => item.element)).toEqual([last, first]);
		expect(collection.move(last, 'next')?.element).toBe(first);
		expect(collection.move(first, 'next')?.element).toBe(last);
	});

	it('supports timed and repeated-character typeahead with cleanup', () => {
		vi.useFakeTimers();
		const alpha = document.createElement('button');
		const apricot = document.createElement('button');
		const beta = document.createElement('button');
		document.body.append(alpha, apricot, beta);
		const collection = createCollectionRegistry<HTMLButtonElement>({ typeaheadTimeout: 500 });
		collection.register({ element: alpha, textValue: () => 'Alpha' });
		collection.register({ element: apricot, textValue: () => 'Apricot' });
		collection.register({ element: beta, textValue: () => 'Beta' });
		expect(collection.typeahead('a', alpha)?.element).toBe(apricot);
		expect(collection.typeahead('a', apricot)?.element).toBe(alpha);
		vi.advanceTimersByTime(500);
		expect(collection.typeahead('b', alpha)?.element).toBe(beta);
		collection.destroy();
		expect(vi.getTimerCount()).toBe(0);
	});

	it('shares hover ownership between trigger/content and clears pending timers', () => {
		vi.useFakeTimers();
		const changes: boolean[] = [];
		let open = false;
		const hover = createHoverIntent({
			open: () => open,
			openDelay: 100,
			closeDelay: 200,
			onOpenChange: (nextOpen) => {
				open = nextOpen;
				changes.push(nextOpen);
			},
		});
		hover.enter('trigger');
		vi.advanceTimersByTime(100);
		expect(changes).toEqual([true]);
		hover.leave('trigger');
		hover.enter('content');
		vi.advanceTimersByTime(200);
		expect(changes).toEqual([true]);
		hover.leave('content');
		vi.advanceTimersByTime(200);
		expect(changes).toEqual([true, false]);
		hover.enter('trigger');
		hover.destroy();
		vi.runAllTimers();
		expect(changes).toEqual([true, false]);
	});

	it('synchronizes controlled hover state and can reopen after an external close while hovered', () => {
		vi.useFakeTimers();
		let open = true;
		const changes: boolean[] = [];
		const hover = createHoverIntent({
			open: () => open,
			openDelay: 100,
			closeDelay: 200,
			onOpenChange: (nextOpen) => changes.push(nextOpen),
		});
		hover.enter('trigger');
		expect(vi.getTimerCount()).toBe(0);
		open = false;
		hover.sync();
		vi.advanceTimersByTime(100);
		expect(changes).toEqual([true]);
		open = true;
		hover.sync();
		hover.leave('trigger');
		vi.advanceTimersByTime(200);
		expect(changes).toEqual([true, false]);
		hover.destroy();
		expect(vi.getTimerCount()).toBe(0);
	});

	it('registers deterministic part ids and composes callback-only refs', () => {
		createRoot((dispose) => {
			const ids = createCompositeIdRegistry('menu');
			expect(ids.id('trigger')()).toBe('menu-trigger');
			expect(ids.id('content')()).toBe('menu-content');
			const cleanupFirst = ids.register('title', 'first-title');
			const cleanupSecond = ids.register('title', 'second-title');
			expect(ids.id('title')()).toBe('second-title');
			cleanupSecond();
			expect(ids.id('title')()).toBe('first-title');
			cleanupFirst();
			expect(ids.id('title')()).toBeUndefined();
			const calls: HTMLElement[] = [];
			const element = document.createElement('div');
			composeRefs<HTMLElement>(
				(value) => calls.push(value),
				undefined,
				(value) => calls.push(value),
			)(element);
			expect(calls).toEqual([element, element]);
			dispose();
		});
	});
});
