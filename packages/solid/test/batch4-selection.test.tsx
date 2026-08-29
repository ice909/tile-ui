import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createSignal, type JSX } from 'solid-js';
import { delegateEvents, render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Combobox } from '../src/components/combobox/combobox';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '../src/components/command/command';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from '../src/components/select/select';

const disposers: Array<() => void> = [];
function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}
function mountInDocument(document: Document, node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}
function keydown(element: HTMLElement, key: string) {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}
function tab(element: HTMLElement, options: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {}) {
	const KeyboardEventConstructor = element.ownerDocument.defaultView?.KeyboardEvent ?? KeyboardEvent;
	const event = new KeyboardEventConstructor('keydown', { key: 'Tab', bubbles: true, cancelable: true, ...options });
	element.dispatchEvent(event);
	return event;
}
async function tick() {
	await Promise.resolve();
	await Promise.resolve();
}
afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('Batch 4 selection lane', () => {
	it('Select and Combobox use iframe portal scopes for focus, branches, positioning, and dismissal', async () => {
		const iframe = document.createElement('iframe');
		document.body.appendChild(iframe);
		const iframeDocument = iframe.contentDocument!;
		const iframeView = iframe.contentWindow!;
		const realm = iframeView as Window & typeof globalThis;
		delegateEvents(['click', 'pointerdown'], iframeDocument);
		const portal = iframeDocument.createElement('div');
		iframeDocument.body.appendChild(portal);
		const outside = iframeDocument.createElement('button');
		iframeDocument.body.appendChild(outside);
		const container = mountInDocument(iframeDocument, () => (
			<Select defaultOpen>
				<SelectTrigger>Select</SelectTrigger>
				<SelectContent container={portal}>
					<SelectItem value="a">Alpha</SelectItem>
				</SelectContent>
			</Select>
		));
		await tick();
		const selectTrigger = container.querySelector('[role="combobox"]') as HTMLButtonElement;
		const selectContent = portal.querySelector('[data-slot="select-content"]') as HTMLDivElement;
		expect(iframeDocument.activeElement).toBe(selectContent.querySelector('[role="option"]'));
		outside.dispatchEvent(new realm.MouseEvent('pointerdown', { bubbles: true, cancelable: true, view: iframeView }));
		expect(selectContent.hidden).toBe(true);
		expect(iframeDocument.activeElement).toBe(selectTrigger);
		await tick();
		disposers.pop()?.();
		container.remove();
		portal.innerHTML = '';

		const comboContainer = mountInDocument(iframeDocument, () => <Combobox items={[{ value: 'a', label: 'Alpha' }]} container={portal} />);
		const comboTrigger = comboContainer.querySelector('[data-slot="combobox"] button') as HTMLButtonElement;
		comboTrigger.dispatchEvent(new realm.MouseEvent('click', { bubbles: true, cancelable: true, view: iframeView }));
		await tick();
		const comboContent = portal.querySelector('[data-slot="combobox-content"]') as HTMLDivElement;
		const comboInput = comboContent.querySelector('input') as HTMLInputElement;
		expect(iframeDocument.activeElement).toBe(comboInput);
		comboContent.dispatchEvent(new realm.MouseEvent('pointerdown', { bubbles: true, cancelable: true, view: iframeView }));
		expect(comboContent.hidden).toBe(false);
		outside.dispatchEvent(new realm.MouseEvent('pointerdown', { bubbles: true, cancelable: true, view: iframeView }));
		expect(comboContent.hidden).toBe(true);
		expect(iframeDocument.activeElement).toBe(comboTrigger);
	});

	it('Select exposes the full family, selected text, controlled state, groups, disabled options, IDs, refs, and ARIA', async () => {
		let setOpen!: (value: boolean) => void;
		let setValue!: (value: string) => void;
		const opens: boolean[] = [];
		const values: string[] = [];
		const refs: Element[] = [];
		mount(() => {
			const [open, updateOpen] = createSignal(false);
			const [value, updateValue] = createSignal('b');
			setOpen = updateOpen;
			setValue = updateValue;
			return (
				<Select
					open={open()}
					value={value()}
					onOpenChange={(next) => opens.push(next)}
					onValueChange={(next) => values.push(next)}
					triggerId="custom-trigger"
					contentId="custom-list"
					ref={(element) => refs.push(element)}>
					<SelectTrigger id="custom-trigger" ref={(element) => refs.push(element)}>
						<SelectValue ref={(element) => refs.push(element)} placeholder="Choose" />
					</SelectTrigger>
					<SelectContent ref={(element) => refs.push(element)}>
						<SelectScrollUpButton />
						<SelectGroup>
							<SelectLabel>Letters</SelectLabel>
							<SelectItem value="a">Alpha</SelectItem>
							<SelectItem value="b">Beta</SelectItem>
							<SelectItem value="c" disabled>
								Charlie
							</SelectItem>
						</SelectGroup>
						<SelectSeparator />
						<SelectScrollDownButton />
					</SelectContent>
				</Select>
			);
		});
		const trigger = document.querySelector('#custom-trigger') as HTMLButtonElement;
		expect(trigger.getAttribute('role')).toBe('combobox');
		expect(trigger.getAttribute('aria-controls')).toBe('custom-list');
		expect(trigger.textContent).toContain('Beta');
		trigger.click();
		expect(opens).toEqual([true]);
		expect((document.querySelector('#custom-list') as HTMLDivElement).hidden).toBe(true);
		setOpen(true);
		await tick();
		const list = document.querySelector('#custom-list') as HTMLDivElement;
		const options = list.querySelectorAll<HTMLElement>('[role="option"]');
		const group = list.querySelector('[role="group"]') as HTMLElement;
		const label = list.querySelector('[data-slot="select-label"]') as HTMLElement;
		expect(refs).toHaveLength(4);
		expect(list.getAttribute('role')).toBe('listbox');
		expect(group.getAttribute('aria-labelledby')).toBe(label.id);
		expect(list.querySelector('[role="separator"]')).not.toBeNull();
		expect(options[1].getAttribute('aria-selected')).toBe('true');
		expect(options[1].dataset.highlighted).toBe('true');
		expect(options[2].getAttribute('aria-disabled')).toBe('true');
		options[0].click();
		expect(values).toEqual(['a']);
		expect(trigger.textContent).toContain('Beta');
		setValue('a');
		expect(trigger.textContent).toContain('Alpha');
	});

	it('Select handles arrows, Home/End, typeahead, activation, prevention, outside/Escape restore, and cleanup', async () => {
		const values: string[] = [];
		const cancel = (_data: string, event: KeyboardEvent) => event.preventDefault();
		const _container = mount(() => (
			<>
				<button data-id="before">Before</button>
				<Select defaultOpen defaultValue="a" onValueChange={(value) => values.push(value)}>
					<SelectTrigger>
						Pick <SelectValue />
					</SelectTrigger>
					<SelectContent onKeyDown={[cancel, 'cancel']}>
						<SelectItem value="a">Alpha</SelectItem>
						<SelectItem value="b">Beta</SelectItem>
					</SelectContent>
				</Select>
				<button data-id="outside">Outside</button>
			</>
		));
		await tick();
		let list = document.querySelector('[role="listbox"]') as HTMLDivElement;
		const first = list.querySelector('[role="option"]') as HTMLElement;
		keydown(list, 'ArrowDown');
		expect(first.dataset.highlighted).toBe('true');
		keydown(list, 'Enter');
		expect(values).toEqual([]);
		list.removeAttribute('onkeydown');
		// Reopen without the prevented handler in a separate instance for behavior coverage.
		disposers.pop()?.();
		document.body.innerHTML = '';
		mount(() => (
			<>
				<Select defaultOpen defaultValue="a" onValueChange={(value) => values.push(value)}>
					<SelectTrigger>
						Pick <SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="a">Alpha</SelectItem>
						<SelectItem value="b">Beta</SelectItem>
						<SelectItem value="g">Gamma</SelectItem>
					</SelectContent>
				</Select>
				<button data-id="outside">Outside</button>
			</>
		));
		await tick();
		list = document.querySelector('[role="listbox"]') as HTMLDivElement;
		const options = list.querySelectorAll<HTMLElement>('[role="option"]');
		keydown(list, 'End');
		expect(options[2].dataset.highlighted).toBe('true');
		keydown(list, 'a');
		expect(options[0].dataset.highlighted).toBe('true');
		keydown(list, 'ArrowDown');
		expect(options[1].dataset.highlighted).toBe('true');
		keydown(list, 'Enter');
		expect(values).toEqual(['b']);
		await tick();
		const currentTrigger = document.querySelector('[role="combobox"]') as HTMLButtonElement;
		expect(document.activeElement).toBe(currentTrigger);
		currentTrigger.click();
		await tick();
		keydown(document.querySelector('[role="listbox"]') as HTMLElement, 'Escape');
		expect(document.activeElement).toBe(currentTrigger);
		currentTrigger.click();
		await tick();
		document.querySelector<HTMLElement>('[data-id="outside"]')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		await tick();
		expect(document.activeElement).toBe(currentTrigger);
	});

	it('Combobox supports controlled/default values, keyword filtering, paste/input navigation, disabled items, no-results, ARIA, outside and Escape', async () => {
		let setValue!: (value: string) => void;
		const changes: string[] = [];
		const items = [
			{ value: 'alpha', label: 'Alpha', keywords: ['first'] },
			{ value: 'beta', label: 'Beta', keywords: ['second'] },
			{ value: 'blocked', label: 'Blocked', disabled: true },
		];
		const container = mount(() => {
			const [value, update] = createSignal('alpha');
			setValue = update;
			return (
				<Combobox
					items={items}
					value={value()}
					onValueChange={(next) => changes.push(next)}
					placeholder="Choose"
					searchPlaceholder="Find"
					notFoundText="Missing"
					triggerId="combo-trigger"
					contentId="combo-list"
					inputId="combo-input"
				/>
			);
		});
		const trigger = container.querySelector('#combo-trigger') as HTMLButtonElement;
		expect(trigger.getAttribute('role')).toBe('combobox');
		expect(trigger.getAttribute('aria-label')).toBe('Alpha');
		expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(trigger.getAttribute('aria-controls')).toBe('combo-list');
		expect([...document.querySelectorAll('[role="combobox"]')].filter((element) => !element.closest('[hidden]'))).toHaveLength(1);
		expect(trigger.textContent).toContain('Alpha');
		trigger.click();
		await tick();
		const input = document.querySelector('#combo-input') as HTMLInputElement;
		const list = document.querySelector('#combo-list') as HTMLDivElement;
		const popup = document.querySelector('#combo-list-popup') as HTMLDivElement;
		expect(trigger.getAttribute('role')).toBeNull();
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(input.getAttribute('role')).toBe('combobox');
		expect(input.getAttribute('aria-controls')).toBe('combo-list');
		expect(document.querySelectorAll('[role="combobox"]')).toHaveLength(1);
		expect(popup.getAttribute('role')).toBeNull();
		expect(popup.contains(input)).toBe(true);
		expect(popup.contains(list)).toBe(true);
		expect(list.contains(input)).toBe(false);
		expect(list.getAttribute('role')).toBe('listbox');
		expect(Array.from(list.children, (element) => element.getAttribute('role'))).toEqual(['option', 'option', 'option']);
		input.value = 'second';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		await tick();
		expect(list.querySelectorAll('[role="option"]')).toHaveLength(1);
		expect(input.getAttribute('aria-activedescendant')).toContain('beta');
		keydown(input, 'Enter');
		expect(changes).toEqual(['beta']);
		expect(trigger.textContent).toContain('Alpha');
		setValue('beta');
		expect(trigger.textContent).toContain('Beta');
		trigger.click();
		await tick();
		const nextInput = document.querySelector('#combo-input') as HTMLInputElement;
		nextInput.value = 'zzz';
		nextInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
		nextInput.dispatchEvent(new Event('paste', { bubbles: true }));
		await tick();
		const empty = document.querySelector('[data-slot="combobox-empty"]') as HTMLElement;
		expect(empty.textContent).toBe('Missing');
		expect(empty.getAttribute('role')).toBe('status');
		expect(list.contains(empty)).toBe(false);
		expect(list.children).toHaveLength(0);
		expect(nextInput.getAttribute('aria-describedby')).toBe('combo-list-empty');
		keydown(nextInput, 'Escape');
		expect(document.activeElement).toBe(trigger);
	});

	it('Command exposes filtering, groups, empty state, roles, selection, looping, Enter activation, and user prevention', () => {
		const selected: string[] = [];
		const cancel = (_data: string, event: KeyboardEvent) => event.preventDefault();
		const container = mount(() => (
			<Command defaultSearch="">
				<CommandInput placeholder="Search" />
				<CommandList>
					<CommandEmpty>Nothing</CommandEmpty>
					<CommandGroup heading="Actions">
						<CommandItem value="alpha" keywords={['first']} onSelect={(value) => selected.push(value)}>
							Alpha<CommandShortcut>⌘A</CommandShortcut>
						</CommandItem>
						<CommandItem value="beta" onSelect={(value) => selected.push(value)}>
							Beta
						</CommandItem>
						<CommandItem value="blocked" disabled>
							Blocked
						</CommandItem>
					</CommandGroup>
					<CommandSeparator />
				</CommandList>
			</Command>
		));
		const input = container.querySelector('input') as HTMLInputElement;
		const list = container.querySelector('[role="listbox"]') as HTMLElement;
		expect(container.querySelector('[role="group"]')).not.toBeNull();
		expect(container.querySelector('[data-slot="command-separator"]')).not.toBeNull();
		expect(container.querySelector('[role="separator"]')).toBeNull();
		keydown(input, 'ArrowUp');
		expect(container.querySelector('[data-selected="true"]')?.textContent).toContain('Beta');
		keydown(input, 'ArrowDown');
		expect(container.querySelector('[data-selected="true"]')?.textContent).toContain('Alpha');
		keydown(input, 'Enter');
		expect(selected).toEqual(['alpha']);
		input.value = 'first';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		expect(list.querySelectorAll('[role="option"]:not([hidden])')).toHaveLength(1);
		input.value = 'none';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		expect(container.querySelector('[data-slot="command-empty"]')?.textContent).toBe('Nothing');

		const prevented = mount(() => (
			<Command>
				<CommandInput onKeyDown={[cancel, 'x']} />
				<CommandList>
					<CommandItem value="one" onSelect={(value) => selected.push(value)}>
						One
					</CommandItem>
				</CommandList>
			</Command>
		));
		const preventedInput = prevented.querySelector('input') as HTMLInputElement;
		keydown(preventedInput, 'ArrowDown');
		keydown(preventedInput, 'Enter');
		expect(selected).toEqual(['alpha']);
	});

	it('Command matches data labels and declarative text, resets selection on external search, and synchronizes custom list IDs', () => {
		let setSearch!: (value: string) => void;
		const data = mount(() => (
			<Command defaultSearch="settings" items={[{ value: 'settings-code', label: 'Project Settings' }]}>
				<CommandInput />
				<CommandList />
			</Command>
		));
		expect((data.querySelector('[role="option"]') as HTMLElement).hidden).toBe(false);

		const container = mount(() => {
			const [search, updateSearch] = createSignal('');
			setSearch = updateSearch;
			return (
				<Command search={search()} listId="custom-command-list">
					<CommandInput />
					<CommandList>
						<CommandEmpty>Nothing</CommandEmpty>
						<CommandItem value="docs-code">Open Documentation</CommandItem>
					</CommandList>
				</Command>
			);
		});
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('aria-controls')).toBe('custom-command-list');
		setSearch('documentation');
		expect((container.querySelector('[role="option"]') as HTMLElement).hidden).toBe(false);
		keydown(input, 'ArrowDown');
		expect(input.getAttribute('aria-activedescendant')).toBe('custom-command-list-item-docs-code');
		setSearch('missing');
		expect(input.hasAttribute('aria-activedescendant')).toBe(false);
	});

	it('controlled Select waits for parent state before restoring focus and re-highlights external value changes', async () => {
		let acceptOpen!: () => void;
		let rejectOpen!: () => void;
		let setValue!: (value: string) => void;
		const requests: boolean[] = [];
		const container = mount(() => {
			const [open, setOpen] = createSignal(true);
			const [value, updateValue] = createSignal('a');
			acceptOpen = () => setOpen(false);
			rejectOpen = () => setOpen(true);
			setValue = updateValue;
			return (
				<Select open={open()} value={value()} onOpenChange={(next) => requests.push(next)}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="a">Alpha</SelectItem>
						<SelectItem value="b">Beta</SelectItem>
					</SelectContent>
				</Select>
			);
		});
		await tick();
		const trigger = container.querySelector('[role="combobox"]') as HTMLButtonElement;
		const options = document.querySelectorAll<HTMLElement>('[role="option"]');
		options[1].click();
		expect(requests).toEqual([false]);
		expect(document.activeElement).not.toBe(trigger);
		rejectOpen();
		expect(document.activeElement).not.toBe(trigger);
		setValue('b');
		await tick();
		expect(options[1].dataset.highlighted).toBe('true');
		acceptOpen();
		expect(document.activeElement).toBe(trigger);
	});

	it('ArrowDown opens on first enabled while ArrowUp prefers selected then last enabled for Select and Combobox', async () => {
		const container = mount(() => (
			<>
				<Select defaultValue="selected">
					<SelectTrigger data-id="select-selected">Selected</SelectTrigger>
					<SelectContent>
						<SelectItem value="disabled" disabled>
							Disabled
						</SelectItem>
						<SelectItem value="first">First</SelectItem>
						<SelectItem value="selected">Selected</SelectItem>
						<SelectItem value="last">Last</SelectItem>
					</SelectContent>
				</Select>
				<Select>
					<SelectTrigger data-id="select-empty">Empty</SelectTrigger>
					<SelectContent>
						<SelectItem value="disabled" disabled>
							Disabled
						</SelectItem>
						<SelectItem value="first">First</SelectItem>
						<SelectItem value="last">Last</SelectItem>
					</SelectContent>
				</Select>
				<Combobox
					items={[
						{ value: 'disabled', label: 'Disabled', disabled: true },
						{ value: 'first', label: 'First' },
						{ value: 'selected', label: 'Selected' },
						{ value: 'last', label: 'Last' },
					]}
					defaultValue="selected"
					data-id="combo-selected"
				/>
				<Combobox
					items={[
						{ value: 'disabled', label: 'Disabled', disabled: true },
						{ value: 'first', label: 'First' },
						{ value: 'last', label: 'Last' },
					]}
					data-id="combo-empty"
				/>
			</>
		));
		const selectSelected = container.querySelector('[data-id="select-selected"]') as HTMLButtonElement;
		keydown(selectSelected, 'ArrowUp');
		await tick();
		expect(document.activeElement?.textContent).toContain('Selected');
		keydown(document.activeElement as HTMLElement, 'Escape');
		keydown(selectSelected, 'ArrowDown');
		await tick();
		expect(document.activeElement?.textContent).toContain('First');
		keydown(document.activeElement as HTMLElement, 'Escape');

		const selectEmpty = container.querySelector('[data-id="select-empty"]') as HTMLButtonElement;
		keydown(selectEmpty, 'ArrowUp');
		await tick();
		expect(document.activeElement?.textContent).toContain('Last');
		keydown(document.activeElement as HTMLElement, 'Escape');

		const comboSelected = container.querySelector('[data-id="combo-selected"] button') as HTMLButtonElement;
		keydown(comboSelected, 'ArrowUp');
		await tick();
		expect((document.activeElement as HTMLInputElement).getAttribute('aria-activedescendant')).toContain('selected');
		keydown(document.activeElement as HTMLElement, 'Escape');
		keydown(comboSelected, 'ArrowDown');
		await tick();
		expect((document.activeElement as HTMLInputElement).getAttribute('aria-activedescendant')).toContain('first');
		keydown(document.activeElement as HTMLElement, 'Escape');

		const comboEmpty = container.querySelector('[data-id="combo-empty"] button') as HTMLButtonElement;
		keydown(comboEmpty, 'ArrowUp');
		await tick();
		expect((document.activeElement as HTMLInputElement).getAttribute('aria-activedescendant')).toContain('last');
	});

	it('SelectGroup only labels declared groups and synchronizes custom label IDs', async () => {
		const container = mount(() => (
			<Select defaultOpen contentId="groups-list">
				<SelectTrigger>Open</SelectTrigger>
				<SelectContent>
					<SelectGroup id="custom-group" labelId="declared-label">
						<SelectLabel id="custom-label">Custom</SelectLabel>
						<SelectItem value="one">One</SelectItem>
					</SelectGroup>
					<SelectGroup id="plain-group">
						<SelectItem value="two">Two</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		));
		await tick();
		const labelled = document.querySelector('#custom-group') as HTMLElement;
		const plain = document.querySelector('#plain-group') as HTMLElement;
		expect(labelled.getAttribute('aria-labelledby')).toBe('custom-label');
		expect(document.querySelector('#custom-label')?.textContent).toBe('Custom');
		expect(plain.hasAttribute('aria-labelledby')).toBe(false);
		expect(container.querySelector('#plain-group')).toBeNull();
	});

	it('logical Tab uses native tabindex ordering, filters unavailable targets, and ignores modifiers', async () => {
		const container = mount(() => (
			<>
				<button data-id="positive-one" tabIndex={1}>
					Positive one
				</button>
				<button data-id="positive-two" tabIndex={2}>
					Positive two
				</button>
				<button data-id="hidden" hidden>
					Hidden
				</button>
				<div inert>
					<button data-id="inert">Inert</button>
				</div>
				<button data-id="disabled" disabled>
					Disabled
				</button>
				<Select defaultOpen>
					<SelectTrigger tabIndex={3}>Select</SelectTrigger>
					<SelectContent>
						<SelectItem value="a">Alpha</SelectItem>
					</SelectContent>
				</Select>
				<Combobox items={[{ value: 'a', label: 'Alpha' }]} />
				<button data-id="positive-six" tabIndex={6}>
					Positive six
				</button>
				<button data-id="zero-after">Zero after</button>
			</>
		));
		await tick();
		const selectTrigger = container.querySelector('[role="combobox"]') as HTMLButtonElement;
		const comboTrigger = container.querySelector('[data-slot="combobox"] button') as HTMLButtonElement;
		comboTrigger.tabIndex = 5;
		const selectOption = document.querySelector('[data-slot="select-item"]') as HTMLElement;
		for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true, ctrlKey: true }]) {
			selectOption.focus();
			const event = tab(selectOption, modifiers);
			expect(event.defaultPrevented).toBe(false);
			expect(selectTrigger.getAttribute('aria-expanded')).toBe('true');
			expect(document.activeElement).toBe(selectOption);
		}
		tab(selectOption);
		expect(selectTrigger.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(container.querySelector('[data-slot="combobox"] button'));
		comboTrigger.click();
		await tick();
		const comboInput = document.querySelector('[data-slot="combobox-content"] input') as HTMLInputElement;
		for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
			const event = tab(comboInput, modifiers);
			expect(event.defaultPrevented).toBe(false);
			expect(comboTrigger.getAttribute('aria-expanded')).toBe('true');
			expect(document.activeElement).toBe(comboInput);
		}
		tab(comboInput, { shiftKey: true });
		expect(comboTrigger.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(selectTrigger);

		selectTrigger.click();
		await tick();
		const reopenedOption = document.querySelector('[data-slot="select-item"]') as HTMLElement;
		tab(reopenedOption, { shiftKey: true });
		expect(document.activeElement).toBe(container.querySelector('[data-id="positive-two"]'));
		expect(document.activeElement).not.toBe(container.querySelector('[data-id="hidden"]'));
		expect(document.activeElement).not.toBe(container.querySelector('[data-id="inert"]'));
		expect(document.activeElement).not.toBe(container.querySelector('[data-id="disabled"]'));
	});

	it('logical Tab resolves targets in the trigger ownerDocument inside an iframe', async () => {
		const frame = document.createElement('iframe');
		document.body.appendChild(frame);
		const frameDocument = frame.contentDocument as Document;
		const host = frameDocument.createElement('div');
		frameDocument.body.appendChild(host);
		const dispose = render(
			() => (
				<>
					<button data-id="frame-before" tabIndex={1}>
						Before
					</button>
					<Select defaultOpen>
						<SelectTrigger tabIndex={2}>Select</SelectTrigger>
						<SelectContent container={document.body}>
							<SelectItem value="a">Alpha</SelectItem>
						</SelectContent>
					</Select>
					<Combobox items={[{ value: 'a', label: 'Alpha' }]} container={document.body} />
					<button data-id="frame-after" tabIndex={4}>
						After
					</button>
				</>
			),
			host,
		);
		disposers.push(dispose);
		await tick();
		const selectOption = document.querySelector('[data-slot="select-item"]') as HTMLElement;
		const comboTrigger = frameDocument.querySelector('[data-slot="combobox"] button') as HTMLButtonElement;
		comboTrigger.tabIndex = 3;
		tab(selectOption);
		expect(frameDocument.activeElement).toBe(comboTrigger);
		comboTrigger.click();
		await tick();
		const comboInput = document.querySelector('[data-slot="combobox-content"] input') as HTMLInputElement;
		tab(comboInput);
		expect(frameDocument.activeElement).toBe(frameDocument.querySelector('[data-id="frame-after"]'));
	});

	it('Command groups and separators follow filtered visibility and expose labeled group relationships', () => {
		const container = mount(() => (
			<Command defaultSearch="alpha" listId="group-list">
				<CommandInput />
				<CommandList>
					<CommandEmpty>Nothing</CommandEmpty>
					<CommandGroup id="alpha-group" heading="Alpha actions" headingId="alpha-heading">
						<CommandItem value="alpha">Alpha</CommandItem>
					</CommandGroup>
					<CommandGroup id="beta-group" heading="Beta actions">
						<CommandItem value="beta">Beta</CommandItem>
					</CommandGroup>
					<CommandSeparator />
				</CommandList>
			</Command>
		));
		const groups = container.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
		expect(groups[0].hidden).toBe(false);
		expect(groups[0].getAttribute('aria-labelledby')).toBe('alpha-heading');
		expect(container.querySelector('#alpha-heading')?.textContent).toBe('Alpha actions');
		expect(groups[1].hidden).toBe(true);
		const separator = container.querySelector('[data-slot="command-separator"]') as HTMLElement;
		expect(separator.hidden).toBe(false);
		expect(separator.hasAttribute('role')).toBe(false);
		const input = container.querySelector('input') as HTMLInputElement;
		input.value = 'missing';
		input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		expect(Array.from(groups, (group) => group.hidden)).toEqual([true, true]);
		expect((container.querySelector('[data-slot="command-separator"]') as HTMLElement).hidden).toBe(true);
		expect(container.querySelector('[data-slot="command-empty"]')?.textContent).toBe('Nothing');
	});

	it('CommandDialog uses modal foundations for Escape/outside dismissal, focus trap, scroll lock, restore, and custom refs', async () => {
		let setOpen!: (value: boolean) => void;
		let dialogRef!: HTMLDivElement;
		const changes: boolean[] = [];
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const container = mount(() => {
			const [open, update] = createSignal(false);
			setOpen = update;
			return (
				<>
					<button data-id="launcher">Launch</button>
					<CommandDialog
						open={open()}
						onOpenChange={(next) => {
							changes.push(next);
							update(next);
						}}
						title="Palette"
						description="Choose"
						container={portal}
						ref={(element) => (dialogRef = element)}>
						<Command>
							<CommandInput />
							<CommandList>
								<CommandItem value="one">One</CommandItem>
							</CommandList>
						</Command>
					</CommandDialog>
				</>
			);
		});
		const launcher = container.querySelector('[data-id="launcher"]') as HTMLButtonElement;
		launcher.focus();
		setOpen(true);
		await tick();
		await tick();
		await new Promise((resolve) => setTimeout(resolve, 0));
		dialogRef ??= document.querySelector('[data-slot="command-dialog-content"]') as HTMLDivElement;
		expect(dialogRef.getAttribute('role')).toBe('dialog');
		expect(dialogRef.ownerDocument.body.style.overflow).toBe('hidden');
		expect(document.activeElement).toBe(dialogRef.querySelector('input'));
		keydown(dialogRef, 'Escape');
		expect(changes).toEqual([false]);
		await tick();
		expect(dialogRef.ownerDocument.body.style.overflow).toBe('');
		expect(document.activeElement).toBe(launcher);

		let bodyDialogRef!: HTMLDivElement;
		const bodyDialog = mount(() => (
			<CommandDialog open ref={(element) => (bodyDialogRef = element)}>
				<Command>
					<CommandInput />
				</Command>
			</CommandDialog>
		));
		expect(bodyDialogRef).toBe(document.body.querySelector('[data-slot="command-dialog-content"]'));
		expect(bodyDialog.querySelector('[data-slot="command-dialog-content"]')).toBeNull();
	});

	it('SSR renders closed popups absent, open policy present, deterministic IDs, and hydrates without replacing roots', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch4-selection-'));
		const stylesRoot = path.resolve(import.meta.dirname, '../../styles/scss');
		try {
			execFileSync(
				process.execPath,
				[
					'--input-type=module',
					'-e',
					String.raw`
				import path from 'node:path'; import { build } from 'vite'; import solid from 'vite-plugin-solid';
				const [outputRoot, stylesRoot] = process.argv.slice(1); const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };
				await build({ plugins: [solid({ ssr: true })], logLevel: 'silent', css, ssr: { noExternal: true, resolve: { conditions: ['node'] } }, build: { ssr: 'test/fixtures/batch4-selection-server.tsx', outDir: path.join(outputRoot, 'server'), rollupOptions: { output: { entryFileNames: 'fixture.mjs' } } } });
				await build({ plugins: [solid({ solid: { hydratable: true } })], logLevel: 'silent', css, resolve: { conditions: ['browser'] }, build: { outDir: path.join(outputRoot, 'client'), lib: { entry: 'test/fixtures/batch4-selection-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' }, rollupOptions: { output: { inlineDynamicImports: true } } } });
			`,
					outputRoot,
					stylesRoot,
				],
				{ cwd: process.cwd(), stdio: 'inherit' },
			);
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${Buffer.from(serverCode).toString('base64')}`);
			const first = server.renderBatch4SelectionFixture();
			const second = server.renderBatch4SelectionFixture();
			expect(first.html).toBe(second.html);
			expect(first.html).not.toContain('<img src=x');
			expect(first.html).toContain('fixture-select-trigger');
			const serverContainer = document.createElement('div');
			serverContainer.innerHTML = first.html;
			expect(serverContainer.querySelector('#fixture-select-list')).toBeNull();
			expect(serverContainer.querySelector('#fixture-combobox-list')).toBeNull();
			const serverComboboxTrigger = serverContainer.querySelector('#fixture-combobox-trigger') as HTMLButtonElement;
			expect(serverComboboxTrigger.getAttribute('role')).toBe('combobox');
			expect(serverComboboxTrigger.getAttribute('aria-label')).toBe('Alpha');
			expect(serverComboboxTrigger.getAttribute('aria-expanded')).toBe('false');
			expect(serverComboboxTrigger.getAttribute('aria-controls')).toBe('fixture-combobox-list');
			expect(serverContainer.querySelectorAll('[role="combobox"][aria-controls="fixture-combobox-list"]')).toHaveLength(1);
			expect((serverContainer.querySelector('#fixture-select-trigger [data-slot="select-value"]') as HTMLElement).textContent).toBe('Alpha');
			const maliciousValue = serverContainer.querySelector('#fixture-malicious-trigger [data-slot="select-value"]') as HTMLElement;
			expect(maliciousValue.textContent).toBe('<img src=x onerror=alert(1)> & "quoted"');
			expect(serverContainer.querySelector('#fixture-malicious-trigger img')).toBeNull();
			expect((serverContainer.querySelector('#fixture-labelled-group') as HTMLElement).getAttribute('aria-labelledby')).toBe('fixture-label');
			expect((serverContainer.querySelector('#fixture-unlabelled-group') as HTMLElement).hasAttribute('aria-labelledby')).toBe(false);
			expect(serverContainer.querySelector('[data-slot="command-empty"]')).toBeNull();
			expect(serverContainer.querySelector('[data-slot="command-item"]')?.textContent).toContain('Alpha Label');
			const serverCommandInput = serverContainer.querySelector('[data-slot="command"] input') as HTMLInputElement;
			expect(serverCommandInput.getAttribute('aria-controls')).toBe('fixture-command-list');
			expect((serverContainer.querySelector('#fixture-visible-group') as HTMLElement).getAttribute('aria-labelledby')).toBe('fixture-visible-heading');
			expect((serverContainer.querySelector('#fixture-hidden-group') as HTMLElement).hidden).toBe(true);
			const script = document.createElement('div');
			script.innerHTML = first.hydrationScript;
			new Function(script.textContent ?? '')();
			document.body.innerHTML = `<div id="app">${first.html}</div>`;
			const app = document.querySelector('#app') as HTMLElement;
			const root = app.querySelector('[data-id="batch4-selection-root"]');
			const maliciousValueNode = app.querySelector('#fixture-malicious-trigger [data-slot="select-value"]');
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${Buffer.from(`const _$HY = globalThis._$HY;\n${clientCode}`).toString('base64')}`);
			client.hydrateBatch4SelectionFixture(app, first.renderId);
			(window as typeof window & { _$HY: { fe: () => void } })._$HY.fe();
			await tick();
			expect(app.querySelector('[data-id="batch4-selection-root"]')).toBe(root);
			expect(app.querySelector('#fixture-malicious-trigger [data-slot="select-value"]')).toBe(maliciousValueNode);
			expect(maliciousValueNode?.textContent).toBe('<img src=x onerror=alert(1)> & "quoted"');
			expect((app.querySelector('[data-slot="command"] input') as HTMLInputElement).getAttribute('aria-controls')).toBe('fixture-command-list');
			const hydratedComboboxTrigger = app.querySelector('#fixture-combobox-trigger') as HTMLButtonElement;
			expect(hydratedComboboxTrigger.getAttribute('role')).toBe('combobox');
			expect(hydratedComboboxTrigger.getAttribute('aria-label')).toBe('Alpha');
			expect(hydratedComboboxTrigger.getAttribute('aria-expanded')).toBe('false');
			expect(hydratedComboboxTrigger.getAttribute('aria-controls')).toBe('fixture-combobox-list');
			expect([...document.querySelectorAll('[role="combobox"][aria-controls="fixture-combobox-list"]')].filter((element) => !element.closest('[hidden]'))).toHaveLength(1);
			hydratedComboboxTrigger.click();
			await tick();
			const hydratedComboboxPopup = document.querySelector('#fixture-combobox-list-popup') as HTMLElement;
			const hydratedComboboxList = document.querySelector('#fixture-combobox-list') as HTMLElement;
			const hydratedComboboxInput = hydratedComboboxPopup.querySelector('[role="combobox"]') as HTMLInputElement;
			expect(hydratedComboboxTrigger.getAttribute('role')).toBeNull();
			expect(hydratedComboboxTrigger.getAttribute('aria-expanded')).toBe('true');
			expect(document.querySelectorAll('[role="combobox"][aria-controls="fixture-combobox-list"]')).toHaveLength(1);
			expect(hydratedComboboxInput).toBe(hydratedComboboxPopup.querySelector('input'));
			expect(hydratedComboboxPopup.getAttribute('role')).toBeNull();
			expect(hydratedComboboxList.getAttribute('role')).toBe('listbox');
			expect(hydratedComboboxInput.getAttribute('aria-controls')).toBe('fixture-combobox-list');
			expect(hydratedComboboxList.contains(hydratedComboboxInput)).toBe(false);
			expect(Array.from(hydratedComboboxList.children, (element) => element.getAttribute('role'))).toEqual(['option', 'option']);
			(app.querySelector('[data-id="open-select"]') as HTMLButtonElement).click();
			await tick();
			expect(document.querySelector('#fixture-select-list')).not.toBeNull();
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
		} finally {
			await rm(outputRoot, { recursive: true, force: true });
		}
	}, 30_000);
});
