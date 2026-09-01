import { createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../src/components/input-otp/input-otp';
import { Slider, SliderRange, SliderThumb, SliderTrack } from '../src/components/slider/slider';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	const dispose = render(node, container);
	disposers.push(dispose);
	return container;
}

function pointer(type: string, init: PointerEventInit) {
	const event = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent;
	Object.defineProperties(event, {
		pointerId: { value: init.pointerId ?? 1 },
		clientX: { value: init.clientX ?? 0 },
		clientY: { value: init.clientY ?? 0 },
		button: { value: init.button ?? 0 },
		isPrimary: { value: init.isPrimary ?? true },
	});
	return event;
}

function input(element: HTMLInputElement, value: string) {
	element.value = value;
	element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
}

function otpSlots(container: HTMLElement) {
	return Array.from(container.querySelectorAll('[data-slot="input-otp-slot"] input')) as HTMLInputElement[];
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('Solid Slider interaction lane', () => {
	it('snaps uncontrolled scalar values and exposes deterministic range, thumb, and ARIA geometry', () => {
		const changes: number[] = [];
		const container = mount(() => (
			<Slider defaultValue={2.4} min={0} max={10} step={0.5} onValueChange={(value) => changes.push(value)}>
				<SliderTrack>
					<SliderRange />
				</SliderTrack>
				<SliderThumb aria-label="Volume" />
			</Slider>
		));
		const thumb = container.querySelector('[role="slider"]') as HTMLElement;
		const range = container.querySelector('[data-slot="slider-range"]') as HTMLElement;
		expect(thumb.getAttribute('aria-valuenow')).toBe('2.5');
		expect(thumb.getAttribute('aria-valuemin')).toBe('0');
		expect(thumb.getAttribute('aria-valuemax')).toBe('10');
		expect(thumb.style.left).toBe('25%');
		expect(range.style.width).toBe('25%');
		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('3');
		expect(changes).toEqual([3]);
	});

	it('keeps controlled values external while emitting stepped keyboard requests for arrows, pages, Home, and End', () => {
		let setValue!: (value: number) => void;
		const changes: number[] = [];
		const container = mount(() => {
			const [value, update] = createSignal(40);
			setValue = update;
			return (
				<Slider value={value()} step={5} onValueChange={(next) => changes.push(next)}>
					<SliderThumb />
				</Slider>
			);
		});
		const thumb = container.querySelector('[role="slider"]') as HTMLElement;
		for (const key of ['PageUp', 'End', 'Home', 'ArrowDown']) thumb.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
		expect(changes).toEqual([90, 100, 0, 35]);
		expect(thumb.getAttribute('aria-valuenow')).toBe('40');
		setValue(65);
		expect(thumb.getAttribute('aria-valuenow')).toBe('65');
	});

	it('keeps nonaligned endpoints exact while snapping only interior values and follows vertical ARIA keys', () => {
		const changes: number[] = [];
		const container = mount(() => (
			<Slider orientation="vertical" min={2} max={10} step={3} defaultValue={6.9} onValueChange={(value) => changes.push(value)}>
				<SliderThumb />
			</Slider>
		));
		const thumb = container.querySelector('[role="slider"]') as HTMLElement;
		expect(thumb.getAttribute('aria-valuenow')).toBe('8');
		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('10');
		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('2');
		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('5');
		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('2');
		const horizontal = mount(() => (
			<Slider min={2} max={10} step={3} defaultValue={5}>
				<SliderThumb />
			</Slider>
		));
		const horizontalRoot = horizontal.querySelector('[data-slot="slider"]') as HTMLDivElement;
		const horizontalThumb = horizontal.querySelector('[role="slider"]') as HTMLElement;
		vi.spyOn(horizontalRoot, 'getBoundingClientRect').mockReturnValue({ left: 20, top: 0, width: 100, height: 20 } as DOMRect);
		horizontalRoot.dispatchEvent(pointer('pointerdown', { pointerId: 7, clientX: 120 }));
		expect(horizontalThumb.getAttribute('aria-valuenow')).toBe('10');
		horizontalRoot.dispatchEvent(pointer('pointerdown', { pointerId: 8, clientX: 20 }));
		expect(horizontalThumb.getAttribute('aria-valuenow')).toBe('2');
		expect(changes).toEqual([10, 2, 5, 2]);
	});

	it('maps horizontal pointers, requires capture for moves, and guards capture APIs', () => {
		const horizontal = mount(() => (
			<Slider defaultValue={0}>
				<SliderThumb />
			</Slider>
		));
		const root = horizontal.querySelector('[data-slot="slider"]') as HTMLDivElement;
		vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20, width: 200, height: 100 } as DOMRect);
		const captured = new Set<number>();
		Object.defineProperties(root, {
			setPointerCapture: { value: (id: number) => captured.add(id), configurable: true },
			hasPointerCapture: { value: (id: number) => captured.has(id), configurable: true },
			releasePointerCapture: { value: (id: number) => captured.delete(id), configurable: true },
		});
		root.dispatchEvent(pointer('pointermove', { pointerId: 1, clientX: 210 }));
		expect(root.querySelector('[role="slider"]')?.getAttribute('aria-valuenow')).toBe('0');
		root.dispatchEvent(pointer('pointerdown', { pointerId: 1, clientX: 110 }));
		expect(root.querySelector('[role="slider"]')?.getAttribute('aria-valuenow')).toBe('50');
		root.dispatchEvent(pointer('pointermove', { pointerId: 1, clientX: 210 }));
		expect(root.querySelector('[role="slider"]')?.getAttribute('aria-valuenow')).toBe('100');
		root.dispatchEvent(pointer('pointerup', { pointerId: 1 }));
		expect(captured.size).toBe(0);
	});

	it('continues dragging on the owner document when pointer capture is unavailable', () => {
		const moves = vi.fn();
		const moveTargets: EventTarget[] = [];
		const container = mount(() => (
			<Slider
				defaultValue={0}
				onPointerMove={(event) => {
					moves();
					moveTargets.push(event.currentTarget);
				}}>
				<SliderThumb />
			</Slider>
		));
		const root = container.querySelector('[data-slot="slider"]') as HTMLDivElement;
		const thumb = root.querySelector('[role="slider"]') as HTMLElement;
		vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 20 } as DOMRect);
		Object.defineProperty(root, 'setPointerCapture', {
			configurable: true,
			value: () => {
				throw new DOMException('unsupported');
			},
		});

		root.dispatchEvent(pointer('pointerdown', { pointerId: 9, clientX: 10 }));
		thumb.dispatchEvent(pointer('pointermove', { pointerId: 9, clientX: 60 }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('60');
		expect(moveTargets).toEqual([root]);
		document.dispatchEvent(pointer('pointermove', { pointerId: 9, clientX: 80 }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('80');
		expect(moves).toHaveBeenCalledOnce();
		document.dispatchEvent(pointer('pointerup', { pointerId: 9 }));
		document.dispatchEvent(pointer('pointermove', { pointerId: 9, clientX: 20 }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('80');
		expect(moves).toHaveBeenCalledOnce();
	});

	it('ends an active drag when pointer capture is lost', () => {
		const container = mount(() => (
			<Slider defaultValue={0}>
				<SliderThumb />
			</Slider>
		));
		const root = container.querySelector('[data-slot="slider"]') as HTMLDivElement;
		const thumb = root.querySelector('[role="slider"]') as HTMLElement;
		const captured = new Set<number>();
		vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 20 } as DOMRect);
		Object.defineProperties(root, {
			setPointerCapture: { configurable: true, value: (id: number) => captured.add(id) },
			hasPointerCapture: { configurable: true, value: (id: number) => captured.has(id) },
			releasePointerCapture: { configurable: true, value: (id: number) => captured.delete(id) },
		});

		root.dispatchEvent(pointer('pointerdown', { pointerId: 10, clientX: 20 }));
		captured.delete(10);
		root.dispatchEvent(pointer('lostpointercapture', { pointerId: 10 }));
		root.dispatchEvent(pointer('pointermove', { pointerId: 10, clientX: 90 }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('20');
	});

	it('keeps vertical pointer, thumb, range, and ARIA keys consistently increasing upward', () => {
		const container = mount(() => (
			<Slider orientation="vertical" min={0} max={100} step={25} defaultValue={0}>
				<SliderRange />
				<SliderThumb />
			</Slider>
		));
		const root = container.querySelector('[data-slot="slider"]') as HTMLDivElement;
		const thumb = container.querySelector('[role="slider"]') as HTMLElement;
		const range = container.querySelector('[data-slot="slider-range"]') as HTMLElement;
		vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 20, width: 20, height: 200 } as DOMRect);

		root.dispatchEvent(pointer('pointerdown', { pointerId: 2, clientY: 220 }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('0');
		expect(thumb.style.top).toBe('100%');
		expect(range.style.top).toBe('auto');
		expect(range.style.bottom).toBe('0px');
		expect(range.style.height).toBe('0%');

		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('25');
		expect(thumb.style.top).toBe('75%');
		expect(range.style.height).toBe('25%');
		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('0');
		expect(thumb.style.top).toBe('100%');

		root.dispatchEvent(pointer('pointerdown', { pointerId: 3, clientY: 20 }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('100');
		expect(thumb.style.top).toBe('0%');
		expect(range.style.height).toBe('100%');
	});

	it('always releases pointer capture on up/cancel even when user handlers cancel state behavior', () => {
		const container = mount(() => (
			<Slider onPointerUp={(event) => event.preventDefault()} onPointerCancel={(event) => event.preventDefault()}>
				<SliderThumb />
			</Slider>
		));
		const root = container.querySelector('[data-slot="slider"]') as HTMLDivElement;
		const captured = new Set<number>();
		Object.defineProperties(root, {
			setPointerCapture: { value: (id: number) => captured.add(id), configurable: true },
			hasPointerCapture: { value: (id: number) => captured.has(id), configurable: true },
			releasePointerCapture: { value: (id: number) => captured.delete(id), configurable: true },
		});
		root.dispatchEvent(pointer('pointerdown', { pointerId: 4 }));
		expect(captured.has(4)).toBe(true);
		root.dispatchEvent(pointer('pointerup', { pointerId: 4 }));
		expect(captured.has(4)).toBe(false);
		root.dispatchEvent(pointer('pointerdown', { pointerId: 5 }));
		root.dispatchEvent(pointer('pointercancel', { pointerId: 5 }));
		expect(captured.has(5)).toBe(false);
		Object.defineProperty(root, 'hasPointerCapture', {
			value: () => {
				throw new DOMException('detached');
			},
		});
		expect(() => root.dispatchEvent(pointer('pointermove', { pointerId: 6 }))).not.toThrow();
	});

	it('supports cancellable tuple handlers and suppresses all interaction while disabled', () => {
		const calls: string[] = [];
		const cancel = (label: string, event: Event) => {
			calls.push(label);
			event.preventDefault();
		};
		const container = mount(() => (
			<Slider defaultValue={20} onPointerDown={[cancel, 'pointer']}>
				<SliderThumb onKeyDown={[cancel, 'key']} />
			</Slider>
		));
		const root = container.querySelector('[data-slot="slider"]') as HTMLElement;
		const thumb = container.querySelector('[role="slider"]') as HTMLElement;
		root.dispatchEvent(pointer('pointerdown', { clientX: 100 }));
		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('20');
		expect(calls).toEqual(['pointer', 'key']);

		const disabled = mount(() => (
			<Slider disabled defaultValue={30} name="level">
				<SliderThumb />
			</Slider>
		));
		const disabledThumb = disabled.querySelector('[role="slider"]') as HTMLElement;
		disabledThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
		expect(disabledThumb.tabIndex).toBe(-1);
		expect(disabledThumb.getAttribute('aria-valuenow')).toBe('30');
		expect((disabled.querySelector('input[type="hidden"]') as HTMLInputElement).disabled).toBe(true);
	});

	it('submits exactly one hidden scalar and restores the initial uncontrolled value on form reset', () => {
		const changes: number[] = [];
		const container = mount(() => (
			<form>
				<Slider name="level" defaultValue={20} onValueChange={(value) => changes.push(value)}>
					<SliderThumb />
				</Slider>
			</form>
		));
		const form = container.querySelector('form') as HTMLFormElement;
		const thumb = container.querySelector('[role="slider"]') as HTMLElement;
		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
		expect(new FormData(form).getAll('level')).toEqual(['100']);
		form.reset();
		expect(thumb.getAttribute('aria-valuenow')).toBe('20');
		expect(new FormData(form).getAll('level')).toEqual(['20']);
		expect(changes).toEqual([100]);
	});

	it('renormalizes the captured uncontrolled Slider default under current reactive constraints on silent reset', () => {
		let setMin!: (value: number) => void;
		let setMax!: (value: number) => void;
		let setStep!: (value: number) => void;
		let setDefault!: (value: number) => void;
		const changes: number[] = [];
		const container = mount(() => {
			const [min, updateMin] = createSignal(0);
			const [max, updateMax] = createSignal(10);
			const [step, updateStep] = createSignal(4);
			const [defaultValue, updateDefault] = createSignal(7);
			setMin = updateMin;
			setMax = updateMax;
			setStep = updateStep;
			setDefault = updateDefault;
			return (
				<form>
					<Slider name="level" min={min()} max={max()} step={step()} defaultValue={defaultValue()} onValueChange={(value) => changes.push(value)}>
						<SliderThumb />
					</Slider>
				</form>
			);
		});
		const form = container.querySelector('form') as HTMLFormElement;
		const thumb = container.querySelector('[role="slider"]') as HTMLElement;
		expect(thumb.getAttribute('aria-valuenow')).toBe('8');
		setMin(1);
		setMax(6);
		setStep(2);
		setDefault(3);
		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
		expect(thumb.getAttribute('aria-valuenow')).toBe('1');
		form.reset();
		expect(thumb.getAttribute('aria-valuenow')).toBe('6');
		expect(new FormData(form).get('level')).toBe('6');
		expect(changes).toEqual([1]);
	});

	it('preserves the current normalized controlled Slider value when constraints change before reset', () => {
		let setMax!: (value: number) => void;
		const container = mount(() => {
			const [max, updateMax] = createSignal(10);
			setMax = updateMax;
			return (
				<form>
					<Slider name="level" value={9} min={1} max={max()} step={4}>
						<SliderThumb />
					</Slider>
				</form>
			);
		});
		const form = container.querySelector('form') as HTMLFormElement;
		const thumb = container.querySelector('[role="slider"]') as HTMLElement;
		expect(thumb.getAttribute('aria-valuenow')).toBe('9');
		setMax(6);
		expect(thumb.getAttribute('aria-valuenow')).toBe('6');
		form.reset();
		expect(thumb.getAttribute('aria-valuenow')).toBe('6');
		expect(new FormData(form).get('level')).toBe('6');
	});

	it('keeps controlled form values synchronized on reset and rebinds reactive name/form associations', () => {
		let setValue!: (value: number) => void;
		let setForm!: (value: string) => void;
		let setName!: (value: string | undefined) => void;
		const changes: number[] = [];
		const container = mount(() => {
			const [value, updateValue] = createSignal(35);
			const [form, updateForm] = createSignal('first-slider-form');
			const [name, updateName] = createSignal<string | undefined>('level');
			setValue = updateValue;
			setForm = updateForm;
			setName = updateName;
			return (
				<>
					<form id="first-slider-form" />
					<form id="second-slider-form" />
					<Slider value={value()} name={name()} form={form()} onValueChange={(next) => changes.push(next)}>
						<SliderThumb />
					</Slider>
				</>
			);
		});
		const thumb = container.querySelector('[role="slider"]') as HTMLElement;
		const control = container.querySelector('input[type="hidden"]') as HTMLInputElement;
		const first = container.querySelector('#first-slider-form') as HTMLFormElement;
		const second = container.querySelector('#second-slider-form') as HTMLFormElement;
		thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
		expect(changes).toEqual([100]);
		expect(new FormData(first).get('level')).toBe('35');
		first.reset();
		expect(thumb.getAttribute('aria-valuenow')).toBe('35');
		expect(new FormData(first).get('level')).toBe('35');
		setValue(47);
		expect(control.value).toBe('47');
		setForm('second-slider-form');
		setName('amount');
		expect(control.form).toBe(second);
		expect(new FormData(first).getAll('level')).toEqual([]);
		expect(new FormData(second).get('amount')).toBe('47');
		second.reset();
		expect(control.value).toBe('47');
		setName(undefined);
		expect(new FormData(second).getAll('amount')).toEqual([]);
	});
});

describe('Solid InputOTP interaction lane', () => {
	function otp(props: Parameters<typeof InputOTP>[0] = {}) {
		return (
			<InputOTP {...props}>
				<InputOTPGroup>
					{[0, 1, 2, 3].map((index) => (
						<InputOTPSlot index={index} />
					))}
				</InputOTPGroup>
			</InputOTP>
		);
	}

	it('filters by core mode, advances stable labelled slots, and completes only on incomplete-to-complete transitions', () => {
		const changes: string[] = [];
		const completions: string[] = [];
		const container = mount(() => otp({ mode: 'numeric', onChange: (value) => changes.push(value), onComplete: (value) => completions.push(value) }));
		const slots = otpSlots(container);
		expect(slots.map((slot) => slot.id)).toEqual(slots.map((_, index) => `${container.querySelector('[data-slot="input-otp"]')?.id}-slot-${index}`));
		expect(slots[0].getAttribute('aria-label')).toBe('One-time password character 1 of 4');
		input(slots[0], 'a1');
		input(slots[1], '2');
		input(slots[2], '3');
		input(slots[3], '4');
		expect(slots.map((slot) => slot.value)).toEqual(['1', '2', '3', '4']);
		expect(changes).toEqual(['1', '12', '123', '1234']);
		expect(completions).toEqual(['1234']);
		input(slots[3], '4');
		expect(completions).toEqual(['1234']);
		input(slots[3], '');
		input(slots[3], '5');
		expect(completions).toEqual(['1234', '1235']);
	});

	it('deduplicates rejected controlled completion requests until the request or rendered value changes', () => {
		let setValue!: (value: string) => void;
		const completions: string[] = [];
		const container = mount(() => {
			const [value, update] = createSignal('123');
			setValue = update;
			return (
				<InputOTP value={value()} onComplete={(next) => completions.push(next)}>
					<InputOTPGroup>
						{[0, 1, 2, 3].map((index) => (
							<InputOTPSlot index={index} />
						))}
					</InputOTPGroup>
				</InputOTP>
			);
		});
		const slots = otpSlots(container);
		input(slots[3], '4');
		input(slots[3], '4');
		expect(completions).toEqual(['1234']);
		input(slots[3], '5');
		expect(completions).toEqual(['1234', '1235']);
		setValue('12');
		input(slots[2], '3');
		setValue('123');
		input(slots[3], '4');
		expect(completions).toEqual(['1234', '1235', '1234']);
	});

	it('keeps controlled display external while emitting requests and accepting external updates', () => {
		let setValue!: (value: string) => void;
		const changes: string[] = [];
		const container = mount(() => {
			const [value, update] = createSignal('12');
			setValue = update;
			return (
				<InputOTP value={value()} onChange={(next) => changes.push(next)}>
					<InputOTPGroup>
						{[0, 1, 2, 3].map((index) => (
							<InputOTPSlot index={index} />
						))}
					</InputOTPGroup>
				</InputOTP>
			);
		});
		const slots = otpSlots(container);
		input(slots[2], '3');
		expect(changes).toEqual(['123']);
		expect(slots.map((slot) => slot.value)).toEqual(['1', '2', '', '']);
		setValue('9876');
		expect(slots.map((slot) => slot.value)).toEqual(['9', '8', '7', '6']);
	});

	it('always exits composition after a cancelled compositionend and restores rejected controlled DOM', () => {
		const changes: string[] = [];
		const container = mount(() => (
			<InputOTP value="" mode="text" onChange={(value) => changes.push(value)}>
				<InputOTPGroup>
					<InputOTPSlot index={0} inputProps={{ onCompositionEnd: (event) => event.preventDefault() }} />
					{[1, 2, 3].map((index) => (
						<InputOTPSlot index={index} />
					))}
				</InputOTPGroup>
			</InputOTP>
		));
		const slots = otpSlots(container);
		slots[0].dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '界' }));
		input(slots[0], '界');
		slots[0].dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true, data: '界' }));
		expect(slots[0].value).toBe('');
		input(slots[0], 'A');
		expect(changes).toEqual(['A']);
		expect(slots[0].value).toBe('');
	});

	it('handles navigation, backspace deletion, and cancellable tuple keyboard handlers', () => {
		const calls: string[] = [];
		const tuple = (label: string, event: KeyboardEvent) => {
			calls.push(label);
			if (event.key === 'End') event.preventDefault();
		};
		const container = mount(() => (
			<InputOTP defaultValue="1234">
				<InputOTPGroup>
					{[0, 1, 2, 3].map((index) => (
						<InputOTPSlot index={index} inputProps={{ onKeyDown: [tuple, `slot-${index}`] }} />
					))}
				</InputOTPGroup>
			</InputOTP>
		));
		const slots = otpSlots(container);
		slots[2].focus();
		slots[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
		expect(document.activeElement).toBe(slots[1]);
		slots[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
		expect(document.activeElement).toBe(slots[0]);
		slots[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
		expect(document.activeElement).toBe(slots[0]);
		slots[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
		expect(slots.map((slot) => slot.value)).toEqual(['1', '2', '4', '']);
		expect(calls).toEqual(['slot-2', 'slot-1', 'slot-0', 'slot-2']);
	});

	it('pastes only when allowed, sanitizes from the active slot, and accepts autofill-sized input', () => {
		const allowed = mount(() => otp({ mode: 'numeric', defaultValue: '1' }));
		const allowedSlots = otpSlots(allowed);
		const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
		Object.defineProperty(paste, 'clipboardData', { value: { getData: () => 'a2345' } });
		allowedSlots[1].dispatchEvent(paste);
		expect(allowedSlots.map((slot) => slot.value)).toEqual(['1', '2', '3', '4']);

		const blocked = mount(() => otp({ allowPaste: false }));
		const blockedSlots = otpSlots(blocked);
		const blockedPaste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
		Object.defineProperty(blockedPaste, 'clipboardData', { value: { getData: () => '9876' } });
		blockedSlots[0].dispatchEvent(blockedPaste);
		expect(blockedPaste.defaultPrevented).toBe(true);
		expect(blockedSlots.map((slot) => slot.value)).toEqual(['', '', '', '']);

		input(blockedSlots[0], 'AB12');
		expect(blockedSlots.map((slot) => slot.value)).toEqual(['A', 'B', '1', '2']);
	});

	it('defers composition until completion and ignores all mutation while disabled', () => {
		const container = mount(() => otp({ mode: 'text' }));
		const slots = otpSlots(container);
		slots[0].dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '界' }));
		input(slots[0], '界');
		expect(slots[0].value).toBe('界');
		slots[0].dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '界' }));
		expect(slots[0].value).toBe('界');
		expect(document.activeElement).toBe(slots[1]);

		const disabled = mount(() => otp({ disabled: true, defaultValue: '12', name: 'code' }));
		const disabledSlots = otpSlots(disabled);
		disabledSlots[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
		expect(disabledSlots.every((slot) => slot.disabled)).toBe(true);
		expect(disabledSlots.map((slot) => slot.value)).toEqual(['1', '2', '', '']);
		expect((disabled.querySelector('input[type="hidden"]') as HTMLInputElement).disabled).toBe(true);
	});

	it('submits one hidden value and restores the initial uncontrolled OTP on native reset', async () => {
		const changes: string[] = [];
		const container = mount(() => <form>{otp({ name: 'code', defaultValue: '12', onChange: (value) => changes.push(value) })}</form>);
		const form = container.querySelector('form') as HTMLFormElement;
		const slots = otpSlots(container);
		input(slots[2], '3');
		expect(form.querySelectorAll('[name="code"]')).toHaveLength(1);
		expect(new FormData(form).getAll('code')).toEqual(['123']);
		form.reset();
		await Promise.resolve();
		expect(slots.map((slot) => slot.value)).toEqual(['1', '2', '', '']);
		expect(new FormData(form).getAll('code')).toEqual(['12']);
		expect(changes).toEqual(['123']);
	});

	it('renormalizes the captured uncontrolled OTP default under current reactive constraints on silent reset', async () => {
		let setMode!: (value: 'numeric' | 'alphanumeric') => void;
		let setLength!: (value: number) => void;
		let setDefault!: (value: string) => void;
		const changes: string[] = [];
		const container = mount(() => {
			const [mode, updateMode] = createSignal<'numeric' | 'alphanumeric'>('alphanumeric');
			const [maxLength, updateLength] = createSignal(4);
			const [defaultValue, updateDefault] = createSignal('A1B2');
			setMode = updateMode;
			setLength = updateLength;
			setDefault = updateDefault;
			return (
				<form>
					<InputOTP name="code" mode={mode()} maxLength={maxLength()} defaultValue={defaultValue()} onChange={(value) => changes.push(value)}>
						<InputOTPGroup>
							{[0, 1, 2, 3].map((index) => (
								<InputOTPSlot index={index} />
							))}
						</InputOTPGroup>
					</InputOTP>
				</form>
			);
		});
		const form = container.querySelector('form') as HTMLFormElement;
		const slots = otpSlots(container);
		expect(new FormData(form).get('code')).toBe('A1B2');
		setMode('numeric');
		setLength(3);
		setDefault('999');
		input(slots[0], '3');
		input(slots[1], '4');
		expect(new FormData(form).get('code')).toBe('34');
		form.reset();
		await Promise.resolve();
		expect(slots.slice(0, 3).map((slot) => slot.value)).toEqual(['1', '2', '']);
		expect(new FormData(form).get('code')).toBe('12');
		expect(changes).toEqual(['32', '34']);
	});

	it('preserves the current normalized controlled OTP value when constraints change before reset', () => {
		let setMode!: (value: 'numeric' | 'alphanumeric') => void;
		let setLength!: (value: number) => void;
		const container = mount(() => {
			const [mode, updateMode] = createSignal<'numeric' | 'alphanumeric'>('alphanumeric');
			const [maxLength, updateLength] = createSignal(4);
			setMode = updateMode;
			setLength = updateLength;
			return (
				<form>
					<InputOTP name="code" value="A1B2" mode={mode()} maxLength={maxLength()}>
						<InputOTPGroup>
							{[0, 1, 2, 3].map((index) => (
								<InputOTPSlot index={index} />
							))}
						</InputOTPGroup>
					</InputOTP>
				</form>
			);
		});
		const form = container.querySelector('form') as HTMLFormElement;
		setMode('numeric');
		setLength(3);
		expect(new FormData(form).get('code')).toBe('12');
		form.reset();
		expect(new FormData(form).get('code')).toBe('12');
		expect(
			otpSlots(container)
				.slice(0, 3)
				.map((slot) => slot.value),
		).toEqual(['1', '2', '']);
	});

	it('keeps declared slot identity unique and inert across reactive maxLength shrink and expansion', async () => {
		let setLength!: (value: number) => void;
		const changes: string[] = [];
		const container = mount(() => {
			const [maxLength, updateLength] = createSignal(4);
			setLength = updateLength;
			return (
				<form>
					<InputOTP name="code" maxLength={maxLength()} defaultValue="1234" onChange={(value) => changes.push(value)}>
						<InputOTPGroup>
							{[0, 1, 2, 3].map((index) => (
								<InputOTPSlot index={index} />
							))}
						</InputOTPGroup>
					</InputOTP>
				</form>
			);
		});
		const form = container.querySelector('form') as HTMLFormElement;
		const root = container.querySelector('[data-slot="input-otp"]') as HTMLElement;
		const slots = otpSlots(container);
		const ids = slots.map((slot) => slot.id);
		expect(new Set(ids).size).toBe(4);
		expect(ids).toEqual([0, 1, 2, 3].map((index) => `${root.id}-slot-${index}`));
		slots[3].focus();
		expect(document.activeElement).toBe(slots[3]);

		setLength(2);
		await Promise.resolve();
		expect(slots.map((slot) => slot.id)).toEqual(ids);
		expect(slots.slice(0, 2).map((slot) => slot.disabled)).toEqual([false, false]);
		expect(slots.slice(2).map((slot) => slot.disabled)).toEqual([true, true]);
		expect(slots.slice(2).map((slot) => slot.closest('[data-slot="input-otp-slot"]')?.hasAttribute('hidden'))).toEqual([true, true]);
		expect(slots.slice(2).map((slot) => slot.getAttribute('aria-label'))).toEqual([null, null]);
		expect(document.activeElement).toBe(slots[1]);
		expect(container.querySelectorAll('[data-active="true"]')).toHaveLength(1);
		expect(container.querySelector('[data-active="true"] input')).toBe(slots[1]);
		expect(slots.map((slot) => slot.value)).toEqual(['1', '2', '', '']);
		expect(new FormData(form).get('code')).toBe('12');
		slots[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		expect(document.activeElement).toBe(slots[1]);
		input(slots[2], '9');
		expect(changes).toEqual([]);
		expect(new FormData(form).get('code')).toBe('12');

		setLength(4);
		expect(slots.map((slot) => slot.id)).toEqual(ids);
		expect(slots.every((slot) => !slot.disabled)).toBe(true);
		expect(slots.slice(2).map((slot) => slot.closest('[data-slot="input-otp-slot"]')?.hasAttribute('hidden'))).toEqual([false, false]);
		expect(slots[2].getAttribute('aria-label')).toBe('One-time password character 3 of 4');
		expect(slots.map((slot) => slot.value)).toEqual(['1', '2', '3', '4']);
		expect(new FormData(form).get('code')).toBe('1234');
		slots[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		expect(document.activeElement).toBe(slots[2]);
		input(slots[2], '9');
		expect(changes).toEqual(['1294']);
		expect(slots.map((slot) => slot.value)).toEqual(['1', '2', '9', '4']);
		expect(new FormData(form).get('code')).toBe('1294');
	});

	it('keeps controlled reset values immediate and rebinds reactive OTP form/name associations', () => {
		let setValue!: (value: string) => void;
		let setForm!: (value: string) => void;
		let setName!: (value: string | undefined) => void;
		const container = mount(() => {
			const [value, updateValue] = createSignal('1234');
			const [form, updateForm] = createSignal('first-otp-form');
			const [name, updateName] = createSignal<string | undefined>('code');
			setValue = updateValue;
			setForm = updateForm;
			setName = updateName;
			return (
				<>
					<form id="first-otp-form" />
					<form id="second-otp-form" />
					<InputOTP value={value()} name={name()} form={form()}>
						<InputOTPGroup>
							{[0, 1, 2, 3].map((index) => (
								<InputOTPSlot index={index} />
							))}
						</InputOTPGroup>
					</InputOTP>
				</>
			);
		});
		const slots = otpSlots(container);
		const control = container.querySelector('input[type="hidden"]') as HTMLInputElement;
		const first = container.querySelector('#first-otp-form') as HTMLFormElement;
		const second = container.querySelector('#second-otp-form') as HTMLFormElement;
		setValue('9876');
		expect(slots.map((slot) => slot.value)).toEqual(['9', '8', '7', '6']);
		first.reset();
		expect(slots.map((slot) => slot.value)).toEqual(['9', '8', '7', '6']);
		expect(new FormData(first).get('code')).toBe('9876');
		setForm('second-otp-form');
		setName('token');
		expect(control.form).toBe(second);
		expect(new FormData(second).get('token')).toBe('9876');
		second.reset();
		expect(control.value).toBe('9876');
		setName(undefined);
		expect(new FormData(second).getAll('token')).toEqual([]);
	});
});
