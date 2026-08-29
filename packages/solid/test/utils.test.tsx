import { createContext, createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	HIDDEN_FORM_CONTROL_STYLE,
	HIDDEN_FORM_CONTROL_PROPS,
	composeEventHandlers,
	createControllableSignal,
	createFormResetBinding,
	createFormStoreSnapshot,
	getPointerAxisRatio,
	getRovingFocusTarget,
	listenToFormReset,
	moveRovingFocus,
	setInitialNativeChecked,
	setInitialNativeValue,
	setNativeChecked,
	setNativeValue,
	useRequiredContext,
} from '../src/utils';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	const dispose = render(node, container);
	disposers.push(dispose);
	return container;
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('Solid shared utilities', () => {
	it('supports null, latest-controlled fallback, and silent uncontrolled reset', () => {
		let setDefault!: (value: string) => void;
		let setControlled!: (value: string | null | undefined) => void;
		let setValue!: (value: string | null | ((previous: string | null) => string | null)) => string | null;
		let reset!: () => string | null;
		const changes: Array<string | null> = [];
		const container = mount(() => {
			const [defaultValue, updateDefault] = createSignal('initial');
			const [controlled, updateControlled] = createSignal<string | null>();
			setDefault = updateDefault;
			setControlled = updateControlled;
			const [value, updateValue, resetValue] = createControllableSignal<string | null>({ value: controlled, defaultValue, onChange: (next) => changes.push(next) });
			setValue = updateValue;
			reset = resetValue;
			return <span>{String(value())}</span>;
		});

		setDefault('changed-default');
		setValue((previous) => `${previous}-local`);
		expect(container.textContent).toBe('initial-local');
		setControlled('controlled');
		setValue('requested');
		expect(container.textContent).toBe('controlled');
		setControlled(null);
		expect(container.textContent).toBe('null');
		setControlled('latest');
		setControlled(undefined);
		expect(container.textContent).toBe('latest');
		reset();
		expect(container.textContent).toBe('initial');
		setControlled('controlled-again');
		expect(reset()).toBe('controlled-again');
		expect(container.textContent).toBe('controlled-again');
		expect(changes).toEqual(['initial-local', 'requested']);
	});

	it('guards required contexts', () => {
		const Context = createContext<string>();
		expect(() => mount(() => <span>{useRequiredContext(Context, 'FieldContext')}</span>)).toThrow('FieldContext must be used within its provider.');
		const container = mount(() => <Context.Provider value="ready">{useRequiredContext(Context, 'FieldContext')}</Context.Provider>);
		expect(container.textContent).toBe('ready');
	});

	it('composes function and tuple handlers and stops after preventDefault', () => {
		const calls: string[] = [];
		const tuple = (label: string, event: Event) => calls.push(`${label}:${event.type}`);
		const event = new Event('click', { cancelable: true });
		composeEventHandlers<Event>(
			(current: Event) => calls.push(current.type),
			[tuple, 'tuple'],
			(current: Event) => current.preventDefault(),
			() => calls.push('cancelled'),
		)(event);
		expect(calls).toEqual(['click', 'tuple:click']);
		expect(event.defaultPrevented).toBe(true);
	});

	it('sets native reset defaults, dispatches native events, and cleans reset listeners', () => {
		const form = document.createElement('form');
		const input = document.createElement('input');
		const textarea = document.createElement('textarea');
		const select = document.createElement('select');
		select.innerHTML = '<option value="a">A</option><option value="b">B</option>';
		form.append(input, textarea, select);
		document.body.appendChild(form);
		setInitialNativeValue(input, 'initial');
		setInitialNativeValue(select, 'b');
		setInitialNativeChecked(input, true);
		expect(input.defaultValue).toBe('initial');
		expect(input.defaultChecked).toBe(true);
		expect(select.options[1].defaultSelected).toBe(true);

		const events: string[] = [];
		input.addEventListener('input', (event) => events.push(`${event.constructor.name}:${event.type}:${input.value}:${input.checked}`));
		input.addEventListener('change', (event) => events.push(`${event.constructor.name}:${event.type}:${input.value}:${input.checked}`));
		textarea.addEventListener('input', (event) => events.push(`${event.constructor.name}:${event.type}:${textarea.value}`));
		setNativeValue(input, 'next', 'change');
		setNativeChecked(input, false, true);
		setNativeValue(textarea, 'text', 'input');
		expect(events).toEqual(['Event:change:next:true', 'InputEvent:input:next:false', 'Event:change:next:false', 'InputEvent:input:text']);
		expect(events.every((event) => !event.includes('click'))).toBe(true);

		const reset = vi.fn();
		const cleanup = listenToFormReset(input, reset);
		form.reset();
		expect(reset).toHaveBeenCalledTimes(1);
		expect(input.value).toBe('initial');
		expect(input.checked).toBe(true);
		cleanup();
		form.reset();
		expect(reset).toHaveBeenCalledTimes(1);
		expect(listenToFormReset(undefined, reset)).toBeTypeOf('function');
		expect(HIDDEN_FORM_CONTROL_STYLE.position).toBe('absolute');
		expect(HIDDEN_FORM_CONTROL_STYLE['pointer-events']).toBe('none');
		expect(HIDDEN_FORM_CONTROL_PROPS).toMatchObject({ tabIndex: -1, 'aria-hidden': 'true', style: HIDDEN_FORM_CONTROL_STYLE });
	});

	it('rebinds form reset listeners when the native association changes', () => {
		const firstForm = document.createElement('form');
		const secondForm = document.createElement('form');
		const first = document.createElement('input');
		const second = document.createElement('input');
		firstForm.appendChild(first);
		secondForm.appendChild(second);
		document.body.append(firstForm, secondForm);
		const reset = vi.fn();
		const binding = createFormResetBinding(reset);
		binding.bind(first);
		firstForm.reset();
		expect(reset).toHaveBeenCalledTimes(1);
		binding.bind(second);
		firstForm.reset();
		secondForm.reset();
		expect(reset).toHaveBeenCalledTimes(2);
		binding.cleanup();
		secondForm.reset();
		expect(reset).toHaveBeenCalledTimes(2);
	});

	it('moves roving focus while skipping disabled items and respecting boundaries', () => {
		const first = document.createElement('button');
		const disabled = document.createElement('button');
		const ariaDisabled = document.createElement('div');
		const last = document.createElement('button');
		disabled.disabled = true;
		ariaDisabled.setAttribute('aria-disabled', 'true');
		document.body.append(first, disabled, ariaDisabled, last);
		const elements = [first, disabled, ariaDisabled, last];
		expect(getRovingFocusTarget(elements, first, 'next')).toBe(last);
		expect(getRovingFocusTarget(elements, last, 'next')).toBe(first);
		expect(getRovingFocusTarget(elements, last, 'next', false)).toBeUndefined();
		expect(moveRovingFocus(elements, last, 'previous')).toBe(first);
		expect(document.activeElement).toBe(first);
	});

	it('filters disabled form controls, hidden inputs, hidden ancestors, and disconnected candidates', () => {
		const first = document.createElement('input');
		first.type = 'radio';
		const fieldset = document.createElement('fieldset');
		fieldset.disabled = true;
		const fieldsetRadio = document.createElement('input');
		fieldsetRadio.type = 'radio';
		fieldset.appendChild(fieldsetRadio);
		const disabledSelect = document.createElement('select');
		disabledSelect.disabled = true;
		const disabledTextarea = document.createElement('textarea');
		disabledTextarea.disabled = true;
		const hiddenInput = document.createElement('input');
		hiddenInput.type = 'hidden';
		const hiddenParent = document.createElement('div');
		hiddenParent.hidden = true;
		const hiddenButton = document.createElement('button');
		hiddenParent.appendChild(hiddenButton);
		const last = document.createElement('input');
		last.type = 'radio';
		const disconnected = document.createElement('button');
		document.body.append(first, fieldset, disabledSelect, disabledTextarea, hiddenInput, hiddenParent, last);
		const elements = [first, fieldsetRadio, disabledSelect, disabledTextarea, hiddenInput, hiddenButton, disconnected, last];
		expect(getRovingFocusTarget(elements, first, 'next')).toBe(last);
		expect(getRovingFocusTarget([fieldsetRadio, hiddenInput, disconnected], null, 'first')).toBeUndefined();
	});

	it('maps pointer geometry, including inversion and zero-size bounds', () => {
		const rect = { left: 10, top: 20, width: 100, height: 200 };
		expect(getPointerAxisRatio(60, 0, rect, 'horizontal')).toBe(0.5);
		expect(getPointerAxisRatio(60, 0, rect, 'horizontal', true)).toBe(0.5);
		expect(getPointerAxisRatio(0, 20, rect, 'vertical')).toBe(1);
		expect(getPointerAxisRatio(0, 220, rect, 'vertical')).toBe(0);
		expect(getPointerAxisRatio(0, 70, { ...rect, height: 0 }, 'vertical')).toBe(0);
	});

	it('bridges FormStore snapshots on mount and unsubscribes on cleanup', () => {
		let listener: (() => void) | undefined;
		const unsubscribe = vi.fn();
		let version = 0;
		const store = {
			getSnapshot: () => ({ version }),
			subscribe: vi.fn((next: () => void) => {
				listener = next;
				return unsubscribe;
			}),
		};
		const container = mount(() => {
			const snapshot = createFormStoreSnapshot(store);
			return <span>{snapshot().version}</span>;
		});
		expect(store.subscribe).toHaveBeenCalledTimes(1);
		version = 1;
		listener?.();
		expect(container.textContent).toBe('1');
		disposers.pop()?.();
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it('re-reads the FormStore snapshot after subscribe closes the mount race', () => {
		let version = 0;
		const unsubscribe = vi.fn();
		const store = {
			getSnapshot: () => ({ version }),
			subscribe: vi.fn(() => {
				version = 1;
				return unsubscribe;
			}),
		};
		const container = mount(() => {
			const snapshot = createFormStoreSnapshot(store);
			return <span>{snapshot().version}</span>;
		});
		expect(container.textContent).toBe('1');
		disposers.pop()?.();
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});
});
