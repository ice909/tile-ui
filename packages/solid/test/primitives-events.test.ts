import { createRoot, createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createClickOutside, createCopyToClipboard, createKeyPress } from '../src/primitives';

function setClipboard(clipboard: Pick<Clipboard, 'writeText'> | undefined) {
	Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
}

function deferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});
	return { promise, resolve, reject };
}

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('Solid event primitives', () => {
	it('handles clipboard success, failure, and unavailable environments', async () => {
		const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce('denied');
		setClipboard({ writeText });
		let clipboard!: ReturnType<typeof createCopyToClipboard>;
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			clipboard = createCopyToClipboard({ timeout: 0 });
		});

		await expect(clipboard.copy('first')).resolves.toBe(true);
		expect(writeText).toHaveBeenCalledWith('first');
		expect(clipboard.copied()).toBe(true);
		expect(clipboard.error()).toBeNull();
		await expect(clipboard.copy('second')).resolves.toBe(false);
		expect(clipboard.copied()).toBe(false);
		expect(clipboard.error()).toEqual(new Error('Failed to copy'));
		setClipboard(undefined);
		await expect(clipboard.copy('third')).resolves.toBe(false);
		expect(clipboard.error()?.message).toBe('Clipboard API not available');
		dispose();
	});

	it('replaces repeated clipboard timers, supports timeout zero, and clears timers on disposal', async () => {
		vi.useFakeTimers();
		setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
		let timed!: ReturnType<typeof createCopyToClipboard>;
		let persistent!: ReturnType<typeof createCopyToClipboard>;
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			timed = createCopyToClipboard({ timeout: 100 });
			persistent = createCopyToClipboard({ timeout: 0 });
		});

		await timed.copy('first');
		vi.advanceTimersByTime(60);
		await timed.copy('second');
		vi.advanceTimersByTime(50);
		expect(timed.copied()).toBe(true);
		vi.advanceTimersByTime(50);
		expect(timed.copied()).toBe(false);
		await persistent.copy('persistent');
		vi.runAllTimers();
		expect(persistent.copied()).toBe(true);
		await timed.copy('cleanup');
		dispose();
		dispose();
		vi.runAllTimers();
		expect(timed.copied()).toBe(true);
	});

	it('does not commit or schedule clipboard state after owner disposal', async () => {
		vi.useFakeTimers();
		const pending = deferred<void>();
		setClipboard({ writeText: vi.fn(() => pending.promise) });
		let clipboard!: ReturnType<typeof createCopyToClipboard>;
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			clipboard = createCopyToClipboard({ timeout: 100 });
		});

		const result = clipboard.copy('pending');
		dispose();
		pending.resolve();
		await expect(result).resolves.toBe(true);
		expect(clipboard.copied()).toBe(false);
		expect(clipboard.error()).toBeNull();
		expect(vi.getTimerCount()).toBe(0);
	});

	it('allows only the latest clipboard operation to commit when promises settle out of order', async () => {
		const first = deferred<void>();
		const second = deferred<void>();
		const third = deferred<void>();
		const fourth = deferred<void>();
		setClipboard({
			writeText: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise).mockReturnValueOnce(fourth.promise),
		});
		let clipboard!: ReturnType<typeof createCopyToClipboard>;
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			clipboard = createCopyToClipboard({ timeout: 0 });
		});

		const firstResult = clipboard.copy('first');
		const secondResult = clipboard.copy('second');
		second.reject(new Error('latest failed'));
		await expect(secondResult).resolves.toBe(false);
		expect(clipboard.copied()).toBe(false);
		expect(clipboard.error()).toEqual(new Error('latest failed'));
		first.resolve();
		await expect(firstResult).resolves.toBe(true);
		expect(clipboard.copied()).toBe(false);
		expect(clipboard.error()).toEqual(new Error('latest failed'));

		const thirdResult = clipboard.copy('third');
		const fourthResult = clipboard.copy('fourth');
		fourth.resolve();
		await expect(fourthResult).resolves.toBe(true);
		expect(clipboard.copied()).toBe(true);
		expect(clipboard.error()).toBeNull();
		third.reject(new Error('stale failed'));
		await expect(thirdResult).resolves.toBe(false);
		expect(clipboard.copied()).toBe(true);
		expect(clipboard.error()).toBeNull();
		dispose();
	});

	it('invokes once for touch and mouse pointers and respects inside and composed paths', () => {
		const inside = document.createElement('div');
		const child = document.createElement('button');
		const outside = document.createElement('button');
		inside.appendChild(child);
		document.body.append(inside, outside);
		const callback = vi.fn();
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			createClickOutside(() => inside, callback);
		});

		child.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerType: 'mouse' }));
		expect(callback).not.toHaveBeenCalled();
		const touch = new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerType: 'touch' });
		outside.dispatchEvent(touch);
		outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenLastCalledWith(touch);
		expect(callback.mock.calls[0][0].pointerType).toBe('touch');
		const mouse = new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerType: 'mouse' });
		outside.dispatchEvent(mouse);
		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith(mouse);
		expect(callback.mock.calls[1][0].pointerType).toBe('mouse');
		const retargeted = new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerType: 'pen' });
		Object.defineProperty(retargeted, 'composedPath', { value: () => [child, inside, document.body, document, window] });
		outside.dispatchEvent(retargeted);
		expect(callback).toHaveBeenCalledTimes(2);
		dispose();
	});

	it('rebinds click-outside listeners when the element ownerDocument changes and cleans up', () => {
		const frame = document.createElement('iframe');
		document.body.appendChild(frame);
		const iframeDocument = frame.contentDocument!;
		const mainElement = document.createElement('div');
		const mainOutside = document.createElement('button');
		const frameElement = iframeDocument.createElement('div');
		const frameOutside = iframeDocument.createElement('button');
		document.body.append(mainElement, mainOutside);
		iframeDocument.body.append(frameElement, frameOutside);
		const [element, setElement] = createSignal<Element>(mainElement);
		const callback = vi.fn();
		const mainRemove = vi.spyOn(document, 'removeEventListener');
		const frameAdd = vi.spyOn(iframeDocument, 'addEventListener');
		const frameRemove = vi.spyOn(iframeDocument, 'removeEventListener');
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			createClickOutside(element, callback);
		});

		mainOutside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
		expect(callback).toHaveBeenCalledOnce();
		setElement(frameElement);
		expect(mainRemove).toHaveBeenCalledWith('pointerdown', expect.any(Function));
		expect(frameAdd).toHaveBeenCalledWith('pointerdown', expect.any(Function));
		mainOutside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
		expect(callback).toHaveBeenCalledOnce();
		const frameEvent = new iframeDocument.defaultView!.PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' });
		frameOutside.dispatchEvent(frameEvent);
		expect(callback).toHaveBeenLastCalledWith(frameEvent);
		dispose();
		dispose();
		expect(frameRemove).toHaveBeenCalledWith('pointerdown', expect.any(Function));
		frameOutside.dispatchEvent(new iframeDocument.defaultView!.PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
		expect(callback).toHaveBeenCalledTimes(2);
	});

	it('matches reactive keys exactly and preserves repeat and editable-target parity', () => {
		const [key, setKey] = createSignal('Enter');
		const callback = vi.fn();
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			createKeyPress(key, callback);
		});

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'enter' }));
		expect(callback).not.toHaveBeenCalled();
		const repeated = new KeyboardEvent('keydown', { key: 'Enter', repeat: true });
		window.dispatchEvent(repeated);
		expect(callback).toHaveBeenCalledWith(repeated);
		const input = document.createElement('input');
		document.body.appendChild(input);
		const editable = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
		input.dispatchEvent(editable);
		expect(callback).toHaveBeenLastCalledWith(editable);
		setKey('Escape');
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
		expect(callback).toHaveBeenCalledTimes(2);
		const escape = new KeyboardEvent('keydown', { key: 'Escape' });
		window.dispatchEvent(escape);
		expect(callback).toHaveBeenLastCalledWith(escape);
		dispose();
		dispose();
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(callback).toHaveBeenCalledTimes(3);
	});
});
