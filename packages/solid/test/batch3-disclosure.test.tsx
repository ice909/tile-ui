import { execFileSync } from 'node:child_process';
import { createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	type AccordionContentProps,
	type AccordionItemProps,
	type AccordionProps,
	type AccordionTriggerProps,
} from '../src/components/accordion/accordion';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	type CollapsibleContentProps,
	type CollapsibleProps,
	type CollapsibleTriggerProps,
} from '../src/components/collapsible/collapsible';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function click(element: Element) {
	element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

function key(element: Element, value: string) {
	element.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
});

describe('Solid Accordion disclosure lane', () => {
	function items() {
		return (
			<>
				<AccordionItem value="one">
					<AccordionTrigger data-id="one">One</AccordionTrigger>
					<AccordionContent data-id="one-content">First</AccordionContent>
				</AccordionItem>
				<AccordionItem value="two" disabled>
					<AccordionTrigger data-id="two">Two</AccordionTrigger>
					<AccordionContent data-id="two-content">Second</AccordionContent>
				</AccordionItem>
				<AccordionItem value="three">
					<AccordionTrigger data-id="three">Three</AccordionTrigger>
					<AccordionContent data-id="three-content">Third</AccordionContent>
				</AccordionItem>
			</>
		);
	}

	it('normalizes single defaults, keeps content mounted and hidden, and only collapses when allowed', () => {
		const changes: Array<string | string[]> = [];
		const container = mount(() => (
			<Accordion defaultValue={['wrong-shape']} onValueChange={(value) => changes.push(value)} class="consumer" data-native="root">
				{items()}
			</Accordion>
		));
		const root = container.querySelector('[data-slot="accordion"]') as HTMLDivElement;
		const one = container.querySelector('[data-id="one"]') as HTMLButtonElement;
		const three = container.querySelector('[data-id="three"]') as HTMLButtonElement;
		const first = container.querySelector('[data-id="one-content"]') as HTMLDivElement;
		expect(root.dataset.native).toBe('root');
		expect(root.className).toContain('consumer');
		expect(first.hidden).toBe(true);
		expect(one.getAttribute('aria-controls')).toBe(first.id);
		expect(first.getAttribute('aria-labelledby')).toBe(one.id);
		click(one);
		expect(one.getAttribute('aria-expanded')).toBe('true');
		expect(first.hidden).toBe(false);
		click(one);
		expect(one.getAttribute('aria-expanded')).toBe('true');
		click(three);
		expect(one.getAttribute('aria-expanded')).toBe('false');
		expect(first.hidden).toBe(true);
		expect(changes).toEqual(['one', 'three']);
	});

	it('normalizes multiple controlled values and emits array requests without mutating external state', () => {
		let setValue!: (value: string | string[]) => void;
		const changes: Array<string | string[]> = [];
		const container = mount(() => {
			const [value, update] = createSignal<string | string[]>('wrong-shape');
			setValue = update;
			return (
				<Accordion type="multiple" value={value()} onValueChange={(next) => changes.push(next)}>
					{items()}
				</Accordion>
			);
		});
		const one = container.querySelector('[data-id="one"]') as HTMLButtonElement;
		const three = container.querySelector('[data-id="three"]') as HTMLButtonElement;
		click(one);
		expect(changes).toEqual([['one']]);
		expect(one.getAttribute('aria-expanded')).toBe('false');
		setValue(['one', 'three']);
		expect(one.getAttribute('aria-expanded')).toBe('true');
		expect(three.getAttribute('aria-expanded')).toBe('true');
		click(one);
		expect(changes).toEqual([['one'], ['three']]);
	});

	it('runs tuple handlers first, honors preventDefault, and suppresses disabled items', () => {
		const calls: string[] = [];
		const cancel = (label: string, event: Event) => {
			calls.push(label);
			event.preventDefault();
		};
		const changes: Array<string | string[]> = [];
		const container = mount(() => (
			<Accordion collapsible onValueChange={(value) => changes.push(value)}>
				<AccordionItem value="one">
					<AccordionTrigger onClick={[cancel, 'click']} onKeyDown={[cancel, 'key']}>
						One
					</AccordionTrigger>
					<AccordionContent>First</AccordionContent>
				</AccordionItem>
				<AccordionItem value="two" disabled>
					<AccordionTrigger>Two</AccordionTrigger>
					<AccordionContent>Second</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		const triggers = container.querySelectorAll('button');
		click(triggers[0]);
		key(triggers[0], 'ArrowDown');
		click(triggers[1]);
		expect(calls).toEqual(['click', 'key']);
		expect(changes).toEqual([]);
		expect(triggers[1].disabled).toBe(true);
		expect(triggers[1].tabIndex).toBe(-1);
	});

	it('provides one tab stop and wraps ArrowUp/Down/Home/End around disabled triggers', () => {
		const container = mount(() => <Accordion>{items()}</Accordion>);
		const one = container.querySelector('[data-id="one"]') as HTMLButtonElement;
		const two = container.querySelector('[data-id="two"]') as HTMLButtonElement;
		const three = container.querySelector('[data-id="three"]') as HTMLButtonElement;
		expect([one.tabIndex, two.tabIndex, three.tabIndex]).toEqual([0, -1, -1]);
		one.focus();
		key(one, 'ArrowDown');
		expect(document.activeElement).toBe(three);
		expect([one.tabIndex, two.tabIndex, three.tabIndex]).toEqual([-1, -1, 0]);
		key(three, 'ArrowDown');
		expect(document.activeElement).toBe(one);
		key(one, 'ArrowUp');
		expect(document.activeElement).toBe(three);
		key(three, 'Home');
		expect(document.activeElement).toBe(one);
		key(one, 'End');
		expect(document.activeElement).toBe(three);
	});

	it('forwards native attributes, custom IDs, classes, and refs through each public DOM component', () => {
		let root: HTMLDivElement | undefined;
		let item: HTMLDivElement | undefined;
		let trigger: HTMLButtonElement | undefined;
		let content: HTMLDivElement | undefined;
		const rootProps: AccordionProps = { ref: (element) => (root = element), 'aria-label': 'Questions' };
		const itemProps: AccordionItemProps = {
			ref: (element) => (item = element),
			value: 'one',
			triggerId: 'custom-trigger',
			contentId: 'custom-content',
			title: 'item',
		};
		const triggerProps: AccordionTriggerProps = { ref: (element) => (trigger = element), name: 'toggle', class: 'trigger-class' };
		const contentProps: AccordionContentProps = { ref: (element) => (content = element), class: 'content-class', title: 'content' };
		const container = mount(() => (
			<Accordion {...rootProps}>
				<AccordionItem {...itemProps}>
					<AccordionTrigger {...triggerProps}>One</AccordionTrigger>
					<AccordionContent {...contentProps}>First</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		expect(root).toBe(container.firstElementChild);
		expect(item?.title).toBe('item');
		expect(trigger?.name).toBe('toggle');
		expect(trigger?.className).toContain('trigger-class');
		expect(trigger?.getAttribute('aria-controls')).toBe('custom-content');
		expect(content?.getAttribute('aria-labelledby')).toBe('custom-trigger');
		expect(content?.className).toContain('content-class');
	});

	it('rejects element-valued refs in props-spread component APIs', () => {
		const div = document.createElement('div');
		const button = document.createElement('button');
		// @ts-expect-error Wrapper refs must be assignable callbacks, not Solid intrinsic element targets.
		const accordionProps: AccordionProps = { ref: div };
		// @ts-expect-error Wrapper refs must be assignable callbacks, not Solid intrinsic element targets.
		const itemProps: AccordionItemProps = { value: 'one', ref: div };
		// @ts-expect-error Wrapper refs must be assignable callbacks, not Solid intrinsic element targets.
		const triggerProps: AccordionTriggerProps = { ref: button };
		// @ts-expect-error Wrapper refs must be assignable callbacks, not Solid intrinsic element targets.
		const contentProps: AccordionContentProps = { ref: div };
		expect([accordionProps, itemProps, triggerProps, contentProps]).toHaveLength(4);
	});
});

describe('Solid Collapsible disclosure lane', () => {
	it('uses captured uncontrolled defaults, toggles mounted hidden content, and emits changes', () => {
		let setDefault!: (value: boolean) => void;
		const changes: boolean[] = [];
		const container = mount(() => {
			const [defaultOpen, updateDefault] = createSignal(true);
			setDefault = updateDefault;
			return (
				<Collapsible defaultOpen={defaultOpen()} onOpenChange={(open) => changes.push(open)}>
					<CollapsibleTrigger>Toggle</CollapsibleTrigger>
					<CollapsibleContent>Details</CollapsibleContent>
				</Collapsible>
			);
		});
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = container.querySelector('[data-slot="collapsible-content"]') as HTMLDivElement;
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(content.hidden).toBe(false);
		setDefault(false);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		click(trigger);
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(content.hidden).toBe(true);
		expect(changes).toEqual([false]);
	});

	it('keeps controlled state external and applies disabled and cancellable tuple rules', () => {
		let setOpen!: (value: boolean) => void;
		const calls: string[] = [];
		const changes: boolean[] = [];
		const cancel = (label: string, event: MouseEvent) => {
			calls.push(label);
			event.preventDefault();
		};
		const container = mount(() => {
			const [open, update] = createSignal(false);
			setOpen = update;
			return (
				<>
					<Collapsible open={open()} onOpenChange={(next) => changes.push(next)}>
						<CollapsibleTrigger onClick={[cancel, 'cancelled']}>Controlled</CollapsibleTrigger>
						<CollapsibleContent>Controlled content</CollapsibleContent>
					</Collapsible>
					<Collapsible disabled onOpenChange={(next) => changes.push(next)}>
						<CollapsibleTrigger>Disabled</CollapsibleTrigger>
						<CollapsibleContent>Disabled content</CollapsibleContent>
					</Collapsible>
				</>
			);
		});
		const triggers = container.querySelectorAll('button');
		click(triggers[0]);
		expect(calls).toEqual(['cancelled']);
		expect(changes).toEqual([]);
		setOpen(true);
		expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
		click(triggers[1]);
		expect(triggers[1].disabled).toBe(true);
		expect(changes).toEqual([]);
	});

	it('forwards native attrs/classes/refs and keeps custom ARIA IDs synchronized', () => {
		let root: HTMLDivElement | undefined;
		let trigger: HTMLButtonElement | undefined;
		let content: HTMLDivElement | undefined;
		const rootProps: CollapsibleProps = {
			ref: (element) => (root = element),
			triggerId: 'details-trigger',
			contentId: 'details-content',
			class: 'root-class',
			title: 'root',
		};
		const triggerProps: CollapsibleTriggerProps = { ref: (element) => (trigger = element), name: 'details', class: 'trigger-class' };
		const contentProps: CollapsibleContentProps = { ref: (element) => (content = element), class: 'content-class', title: 'content' };
		const container = mount(() => (
			<Collapsible {...rootProps}>
				<CollapsibleTrigger {...triggerProps}>Details</CollapsibleTrigger>
				<CollapsibleContent {...contentProps}>Body</CollapsibleContent>
			</Collapsible>
		));
		expect(root).toBe(container.firstElementChild);
		expect(root?.title).toBe('root');
		expect(root?.className).toContain('root-class');
		expect(trigger?.name).toBe('details');
		expect(trigger?.className).toContain('trigger-class');
		expect(trigger?.getAttribute('aria-controls')).toBe('details-content');
		expect(content?.getAttribute('aria-labelledby')).toBe('details-trigger');
		expect(content?.className).toContain('content-class');
	});

	it('rejects element-valued refs in props-spread component APIs', () => {
		const div = document.createElement('div');
		const button = document.createElement('button');
		// @ts-expect-error Wrapper refs must be assignable callbacks, not Solid intrinsic element targets.
		const rootProps: CollapsibleProps = { ref: div };
		// @ts-expect-error Wrapper refs must be assignable callbacks, not Solid intrinsic element targets.
		const triggerProps: CollapsibleTriggerProps = { ref: button };
		// @ts-expect-error Wrapper refs must be assignable callbacks, not Solid intrinsic element targets.
		const contentProps: CollapsibleContentProps = { ref: div };
		expect([rootProps, triggerProps, contentProps]).toHaveLength(3);
	});
});

describe('Solid disclosure SSR hydration lane', () => {
	it('preserves deterministic IDs, hidden state, node identity, and hydrated interaction', () => {
		expect(() => execFileSync(process.execPath, ['test/batch3-disclosure-ssr.mjs'], { cwd: process.cwd(), stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 })).not.toThrow();
	});
});
