import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '../src/components/button-group/button-group';
import { Field, FieldDescription, FieldLabel, FieldMessage, useFieldContext } from '../src/components/field/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from '../src/components/input-group/input-group';
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '../src/components/native-select/native-select';
import { Progress } from '../src/components/progress/progress';
import { Textarea } from '../src/components/textarea/textarea';

const disposers: Array<() => void> = [];
const execFileAsync = promisify(execFile);

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('Batch 2 native/static components', () => {
	it('ButtonGroup preserves native attrs, refs, orientation, text, and decorative separator semantics', () => {
		const refs: HTMLDivElement[] = [];
		const container = mount(() => (
			<ButtonGroup ref={(element) => refs.push(element)} orientation="vertical" class="group-user" aria-label="Actions">
				<ButtonGroupText class="text-user">Tools</ButtonGroupText>
				<ButtonGroupSeparator orientation="horizontal" class="separator-user" />
			</ButtonGroup>
		));
		const group = container.firstElementChild as HTMLDivElement;
		const separator = container.querySelector('[data-slot="button-group-separator"]') as HTMLDivElement;
		expect(refs).toEqual([group]);
		expect(group.getAttribute('role')).toBe('group');
		expect(group.getAttribute('aria-label')).toBe('Actions');
		expect(group.dataset.orientation).toBe('vertical');
		expect(group.className).toContain('group-user');
		expect(container.querySelector('.text-user')?.textContent).toBe('Tools');
		expect(separator.getAttribute('role')).toBe('none');
		expect(separator.getAttribute('aria-hidden')).toBe('true');
		expect(separator.dataset.orientation).toBe('horizontal');
	});

	it('Field exposes explicit context wiring for native controls', () => {
		const container = mount(() => (
			<Field name="email" invalid required class="field-user">
				<FieldControl />
				<FieldLabel>Email</FieldLabel>
				<FieldDescription>Description</FieldDescription>
				<FieldMessage variant="error">Required</FieldMessage>
			</Field>
		));
		const root = container.firstElementChild as HTMLDivElement;
		const input = container.querySelector('input') as HTMLInputElement;
		const label = container.querySelector('[data-slot="field-label"]') as HTMLLabelElement;
		const description = container.querySelector('[data-slot="field-description"]') as HTMLParagraphElement;
		const message = container.querySelector('[data-slot="field-message"]') as HTMLDivElement;
		expect(root.dataset.invalid).toBe('true');
		expect(root.dataset.required).toBe('true');
		expect(root.className).toContain('root');
		expect(root.className).toContain('field-user');
		expect(input.id).toBe('email');
		expect(input.required).toBe(true);
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-labelledby')).toBe('email-label');
		expect(input.getAttribute('aria-describedby')).toBe('email-description email-message');
		expect(label.htmlFor).toBe('email');
		expect(label.className).toContain('label');
		expect(description.className).toContain('description');
		expect(message.id).toBe('email-message');
		expect(message.dataset.variant).toBe('error');
		expect(message.className).toContain('message');
		expect(message.className).toContain('variantError');
		expect(message.className).not.toContain('undefined');
	});

	it('Field context is required and label for can be explicitly overridden', () => {
		expect(() => mount(() => <FieldLabel>Outside</FieldLabel>)).toThrow('FieldContext must be used within its provider.');
		const container = mount(() => (
			<Field name="base">
				<FieldLabel for="custom-control">Custom</FieldLabel>
			</Field>
		));
		expect(container.querySelector('label')?.htmlFor).toBe('custom-control');
	});

	it('InputGroup delegates addon clicks to either input or textarea while ignoring interactive descendants', () => {
		const calls: string[] = [];
		const tuple = (label: string) => calls.push(label);
		const container = mount(() => (
			<>
				<InputGroup variant="outline" class="input-group-user">
					<InputGroupAddon onClick={[tuple, 'addon']}>
						<InputGroupText>$</InputGroupText>
						<a href="#target">Link</a>
						<InputGroupButton onClick={() => calls.push('button')}>Go</InputGroupButton>
					</InputGroupAddon>
					<InputGroupInput aria-label="Amount" class="input-user" />
				</InputGroup>
				<InputGroup>
					<InputGroupAddon data-addon="textarea">Note</InputGroupAddon>
					<InputGroupTextarea aria-label="Note" />
				</InputGroup>
			</>
		));
		const groups = container.querySelectorAll<HTMLDivElement>('[data-slot="input-group"]');
		const addon = groups[0].querySelector('[data-slot="input-group-addon"]') as HTMLDivElement;
		const input = groups[0].querySelector('input') as HTMLInputElement;
		const button = groups[0].querySelector('button') as HTMLButtonElement;
		const link = groups[0].querySelector('a') as HTMLAnchorElement;
		expect(groups[0].dataset.variant).toBe('outline');
		expect(groups[0].className).toContain('inputGroup');
		expect(groups[0].className).toContain('variantOutline');
		expect(groups[0].className).toContain('input-group-user');
		expect(addon.dataset.align).toBe('inline-start');
		expect(addon.className).toContain('addon');
		expect(addon.className).toContain('variantDefault');
		expect(input.className).toContain('input-user');
		expect(input.className).toContain('input');
		expect(Array.from(groups[0].children)).toEqual([addon, input]);
		expect(Array.from(groups[0].querySelectorAll('[data-slot]'), (element) => (element as HTMLElement).dataset.slot)).toEqual([
			'input-group-addon',
			'input-group-text',
			'input-group-control',
		]);
		expect(button.type).toBe('button');
		addon.click();
		expect(document.activeElement).toBe(input);
		expect(calls).toEqual(['addon']);
		button.click();
		expect(calls).toEqual(['addon', 'button', 'addon']);
		input.focus();
		link.click();
		expect(document.activeElement).toBe(input);
		const textareaAddon = groups[1].querySelector('[data-addon="textarea"]') as HTMLDivElement;
		const textarea = groups[1].querySelector('textarea') as HTMLTextAreaElement;
		textareaAddon.click();
		expect(document.activeElement).toBe(textarea);
	});

	it('InputGroup exposes all align variants and block alignments use full wrapped rows', async () => {
		const aligns = ['inline-start', 'inline-end', 'block-start', 'block-end'] as const;
		const container = mount(() => (
			<>
				{aligns.map((align) => (
					<InputGroup data-align-group={align}>
						<InputGroupAddon align={align}>{align}</InputGroupAddon>
						<InputGroupInput />
					</InputGroup>
				))}
			</>
		));
		for (const align of aligns) expect(container.querySelector(`[data-align-group="${align}"] [data-align="${align}"]`)).toBeTruthy();

		const scss = await readFile(path.resolve(import.meta.dirname, '../../styles/scss/components/input-group.module.scss'), 'utf8');
		expect(scss).toContain("&:has(> .addon[data-align='block-start'], > .addon[data-align='block-end'])");
		expect(scss.match(/flex-basis: 100%;/g)).toHaveLength(2);
	});

	it('InputGroup addon respects prevented user clicks before focus delegation', () => {
		const container = mount(() => (
			<InputGroup>
				<InputGroupAddon onClick={(event) => event.preventDefault()}>Prefix</InputGroupAddon>
				<InputGroupInput />
			</InputGroup>
		));
		(container.querySelector('[data-slot="input-group-addon"]') as HTMLDivElement).click();
		expect(document.activeElement).not.toBe(container.querySelector('input'));
	});

	it('NativeSelect preserves uncontrolled native value, initial-only default, state, and form reset', async () => {
		let setDefault!: (value: string) => void;
		const refs: HTMLSelectElement[] = [];
		const changes: string[] = [];
		const tuple = (label: string, event: Event & { currentTarget: HTMLSelectElement }) => changes.push(`${label}:${event.currentTarget.value}`);
		const container = mount(() => {
			const [defaultValue, updateDefault] = createSignal('b');
			setDefault = updateDefault;
			return (
				<form>
					<NativeSelect
						ref={(element) => refs.push(element)}
						name="choice"
						defaultValue={defaultValue()}
						class="select-user"
						onChange={[tuple, 'change']}
						onValueChange={(value) => changes.push(value)}>
						<NativeSelectOption value="">Choose</NativeSelectOption>
						<NativeSelectOptGroup label="Letters">
							<NativeSelectOption value="a">A</NativeSelectOption>
							<NativeSelectOption value="b">B</NativeSelectOption>
						</NativeSelectOptGroup>
					</NativeSelect>
				</form>
			);
		});
		const form = container.querySelector('form') as HTMLFormElement;
		const select = container.querySelector('select') as HTMLSelectElement;
		expect(refs).toEqual([select]);
		expect(select.value).toBe('b');
		expect(select.dataset.state).toBe('selected');
		expect(select.className).toContain('select-user');
		select.value = '';
		select.dispatchEvent(new Event('change', { bubbles: true }));
		expect(select.dataset.state).toBe('empty');
		expect(changes).toEqual(['change:', '']);
		setDefault('a');
		expect(select.value).toBe('');
		form.reset();
		await Promise.resolve();
		expect(select.value).toBe('b');
		expect(select.dataset.state).toBe('selected');
	});

	it('NativeSelect preserves controlled value through updates and form reset', async () => {
		let setValue!: (value: string) => void;
		const onValueChange = vi.fn();
		const container = mount(() => {
			const [value, updateValue] = createSignal('a');
			setValue = updateValue;
			return (
				<form>
					<NativeSelect value={value()} onValueChange={onValueChange}>
						<NativeSelectOption value="a">A</NativeSelectOption>
						<NativeSelectOption value="b">B</NativeSelectOption>
					</NativeSelect>
				</form>
			);
		});
		const form = container.querySelector('form') as HTMLFormElement;
		const select = container.querySelector('select') as HTMLSelectElement;
		select.value = 'b';
		select.dispatchEvent(new Event('change', { bubbles: true }));
		expect(onValueChange).toHaveBeenCalledWith('b');
		expect(select.value).toBe('a');
		setValue('b');
		expect(select.value).toBe('b');
		form.reset();
		await Promise.resolve();
		expect(select.value).toBe('b');
	});

	it('NativeSelect restores controlled changes even when prevented and leaves prevented uncontrolled DOM selection native', () => {
		const controlledChange = vi.fn((event: Event) => event.preventDefault());
		const uncontrolledValueChange = vi.fn();
		const container = mount(() => (
			<>
				<NativeSelect data-id="controlled" value="a" onChange={controlledChange} onValueChange={vi.fn()}>
					<NativeSelectOption value="a">A</NativeSelectOption>
					<NativeSelectOption value="b">B</NativeSelectOption>
				</NativeSelect>
				<NativeSelect data-id="uncontrolled" defaultValue="a" onChange={(event) => event.preventDefault()} onValueChange={uncontrolledValueChange}>
					<NativeSelectOption value="a">A</NativeSelectOption>
					<NativeSelectOption value="b">B</NativeSelectOption>
				</NativeSelect>
			</>
		));
		const controlled = container.querySelector('[data-id="controlled"]') as HTMLSelectElement;
		const uncontrolled = container.querySelector('[data-id="uncontrolled"]') as HTMLSelectElement;
		controlled.value = 'b';
		controlled.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
		expect(controlled.value).toBe('a');
		uncontrolled.value = 'b';
		uncontrolled.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
		expect(uncontrolled.value).toBe('b');
		expect(uncontrolled.dataset.state).toBe('selected');
		expect(uncontrolledValueChange).not.toHaveBeenCalled();
	});

	it('NativeSelect rebinds reset handling when its external form association changes', async () => {
		let setForm!: (form: string) => void;
		const container = mount(() => {
			const [form, updateForm] = createSignal('first-form');
			setForm = updateForm;
			return (
				<>
					<form id="first-form" />
					<form id="second-form" />
					<NativeSelect form={form()} defaultValue="a">
						<NativeSelectOption value="a">A</NativeSelectOption>
						<NativeSelectOption value="b">B</NativeSelectOption>
					</NativeSelect>
				</>
			);
		});
		const select = container.querySelector('select') as HTMLSelectElement;
		select.value = 'b';
		select.dispatchEvent(new Event('change', { bubbles: true }));
		setForm('second-form');
		await Promise.resolve();
		(container.querySelector('#first-form') as HTMLFormElement).reset();
		await Promise.resolve();
		expect(select.value).toBe('b');
		(container.querySelector('#second-form') as HTMLFormElement).reset();
		await Promise.resolve();
		expect(select.value).toBe('a');
	});

	it('Progress clamps both visual offset and announced value to the core contract', () => {
		const container = mount(() => (
			<>
				<Progress value={150} min={20} max={120} aria-label="Upload" class="progress-user" />
				<Progress value={Number.NaN} min={10} max={30} />
			</>
		));
		const progress = container.querySelectorAll<HTMLElement>('[role="progressbar"]');
		expect(progress[0].getAttribute('aria-label')).toBe('Upload');
		expect(progress[0].getAttribute('aria-valuenow')).toBe('120');
		expect(progress[0].className).toContain('progress-user');
		expect((progress[0].firstElementChild as HTMLElement).style.transform).toBe('translateX(-0%)');
		expect(progress[1].getAttribute('aria-valuenow')).toBe('10');
		expect((progress[1].firstElementChild as HTMLElement).style.transform).toBe('translateX(-100%)');
	});

	it('Progress normalizes reversed and non-finite ranges into valid ARIA and offsets', () => {
		const container = mount(() => (
			<>
				<Progress data-id="reversed" min={100} max={0} value={25} />
				<Progress data-id="non-finite" min={Number.NEGATIVE_INFINITY} max={Number.POSITIVE_INFINITY} value={Number.POSITIVE_INFINITY} />
				<Progress data-id="collapsed" min={5} max={5} value={50} />
			</>
		));
		const reversed = container.querySelector('[data-id="reversed"]') as HTMLElement;
		const nonFinite = container.querySelector('[data-id="non-finite"]') as HTMLElement;
		const collapsed = container.querySelector('[data-id="collapsed"]') as HTMLElement;
		expect([reversed.getAttribute('aria-valuemin'), reversed.getAttribute('aria-valuemax'), reversed.getAttribute('aria-valuenow')]).toEqual(['0', '100', '25']);
		expect((reversed.firstElementChild as HTMLElement).style.transform).toBe('translateX(-75%)');
		expect([nonFinite.getAttribute('aria-valuemin'), nonFinite.getAttribute('aria-valuemax'), nonFinite.getAttribute('aria-valuenow')]).toEqual(['0', '100', '0']);
		expect((nonFinite.firstElementChild as HTMLElement).style.transform).toBe('translateX(-100%)');
		expect([collapsed.getAttribute('aria-valuemin'), collapsed.getAttribute('aria-valuemax'), collapsed.getAttribute('aria-valuenow')]).toEqual(['5', '5', '5']);
		expect((collapsed.firstElementChild as HTMLElement).style.transform).toBe('translateX(-100%)');
	});

	it('Textarea mirrors Input IDs, ARIA, native attrs, tuple events, and value callbacks', () => {
		const refs: HTMLTextAreaElement[] = [];
		const calls: string[] = [];
		const tuple = (label: string, event: InputEvent & { currentTarget: HTMLTextAreaElement }) => calls.push(`${label}:${event.currentTarget.value}`);
		const container = mount(() => (
			<Textarea
				ref={(element) => refs.push(element)}
				label="Notes"
				error="Required"
				helperText="Ignored"
				required
				name="notes"
				class="textarea-user"
				defaultValue="initial"
				onInput={[tuple, 'input']}
				onChangeValue={(value) => calls.push(`value:${value}`)}
			/>
		));
		const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
		expect(refs).toEqual([textarea]);
		expect(textarea.value).toBe('initial');
		expect(textarea.required).toBe(true);
		expect(textarea.name).toBe('notes');
		expect(textarea.className).toContain('textarea-user');
		expect(textarea.getAttribute('aria-invalid')).toBe('true');
		expect(textarea.getAttribute('aria-describedby')).toBe(`${textarea.id}-error`);
		expect(container.querySelector(`label[for="${textarea.id}"]`)).toBeTruthy();
		expect(container.textContent).not.toContain('Ignored');
		textarea.value = 'updated';
		textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
		expect(calls).toEqual(['input:updated', 'value:updated']);
	});

	it('Textarea keeps uncontrolled defaults initial-only/resettable and controlled values reactive', () => {
		let setDefault!: (value: string) => void;
		let setValue!: (value: string) => void;
		const container = mount(() => {
			const [defaultValue, updateDefault] = createSignal('initial');
			const [value, updateValue] = createSignal('controlled');
			setDefault = updateDefault;
			setValue = updateValue;
			return (
				<>
					<form>
						<Textarea data-id="uncontrolled" defaultValue={defaultValue()} helperText="Help" />
					</form>
					<Textarea data-id="controlled" value={value()} />
				</>
			);
		});
		const form = container.querySelector('form') as HTMLFormElement;
		const uncontrolled = container.querySelector('[data-id="uncontrolled"]') as HTMLTextAreaElement;
		const controlled = container.querySelector('[data-id="controlled"]') as HTMLTextAreaElement;
		uncontrolled.value = 'edited';
		setDefault('later');
		expect(uncontrolled.value).toBe('edited');
		expect(uncontrolled.defaultValue).toBe('initial');
		form.reset();
		expect(uncontrolled.value).toBe('initial');
		expect(uncontrolled.getAttribute('aria-describedby')).toBe(`${uncontrolled.id}-helper`);
		setValue('next');
		expect(controlled.value).toBe('next');
	});

	it('Textarea merges explicit ARIA and restores controlled rejected edits even when the tuple handler prevents', () => {
		const calls: string[] = [];
		const prevent = (label: string, event: InputEvent) => {
			calls.push(label);
			event.preventDefault();
		};
		const onChangeValue = vi.fn();
		const container = mount(() => (
			<Textarea
				value="fixed"
				error="Generated error"
				aria-describedby="external-description"
				aria-invalid="grammar"
				onInput={[prevent, 'tuple']}
				onChangeValue={onChangeValue}
			/>
		));
		const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
		expect(textarea.getAttribute('aria-describedby')).toBe(`external-description ${textarea.id}-error`);
		expect(textarea.getAttribute('aria-invalid')).toBe('true');
		textarea.value = 'rejected';
		textarea.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
		expect(textarea.value).toBe('fixed');
		expect(calls).toEqual(['tuple']);
		expect(onChangeValue).not.toHaveBeenCalled();
	});

	it('uses distinct createUniqueId-derived fallback IDs for Field and Textarea', () => {
		const container = mount(() => (
			<>
				<Field>
					<FieldControl />
					<FieldLabel>First</FieldLabel>
				</Field>
				<Field>
					<FieldControl />
					<FieldLabel>Second</FieldLabel>
				</Field>
				<Textarea label="First notes" />
				<Textarea label="Second notes" />
			</>
		));
		const inputs = container.querySelectorAll('input');
		const textareas = container.querySelectorAll('textarea');
		expect(inputs[0].id).toMatch(/^tile-solid-field-/);
		expect(inputs[0].id).not.toBe(inputs[1].id);
		expect(textareas[0].id).toMatch(/^tile-solid-textarea-/);
		expect(textareas[0].id).not.toBe(textareas[1].id);
	});

	it('serializes and hydrates Textarea and NativeSelect initial values without replacing native nodes', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch2-native-'));
		const packageRoot = path.resolve(import.meta.dirname, '..');
		const componentRoot = path.resolve(import.meta.dirname, '../src/components');
		const stylesRoot = path.resolve(import.meta.dirname, '../../styles/scss');
		const solidRoot = path.resolve(packageRoot, 'node_modules/solid-js');
		const coreEntry = path.resolve(packageRoot, '../core/src/index.ts');
		const stylesPackageRoot = path.resolve(packageRoot, '../styles');
		const fixtureSource = `
			import { createSignal } from 'solid-js';
			import { Textarea } from ${JSON.stringify(path.join(componentRoot, 'textarea/textarea.tsx'))};
			import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from ${JSON.stringify(path.join(componentRoot, 'native-select/native-select.tsx'))};
			export function Fixture() {
				const [text, setText] = createSignal('controlled text');
				const [choice, setChoice] = createSignal('b');
				return <div>
					<form id="fixture-form">
						<Textarea data-id="default-textarea" defaultValue="default text" />
						<Textarea data-id="controlled-textarea" value={text()} onChangeValue={setText} />
						<NativeSelect data-id="default-select" defaultValue="b">
							<NativeSelectOption value="a">A</NativeSelectOption>
							<NativeSelectOptGroup label="More"><NativeSelectOption value="b">B</NativeSelectOption></NativeSelectOptGroup>
						</NativeSelect>
						<NativeSelect data-id="controlled-select" value={choice()} onValueChange={setChoice}>
							<NativeSelectOption value="a">A</NativeSelectOption><NativeSelectOption value="b">B</NativeSelectOption>
						</NativeSelect>
					</form>
				</div>;
			}`;
		const serverEntry = path.join(outputRoot, 'server-entry.tsx');
		const clientEntry = path.join(outputRoot, 'client-entry.tsx');
		const buildScript = path.join(outputRoot, 'build.mjs');
		const viteUrl = pathToFileURL(path.resolve(import.meta.dirname, '../node_modules/vite/dist/node/index.js')).href;
		const solidPluginUrl = pathToFileURL(path.resolve(import.meta.dirname, '../node_modules/vite-plugin-solid/dist/esm/index.mjs')).href;
		await Promise.all([
			writeFile(
				serverEntry,
				`${fixtureSource}\nimport { generateHydrationScript, renderToString } from 'solid-js/web'; export const renderFixture = () => ({ html: renderToString(() => <Fixture />, { renderId: 'batch2-' }), hydrationScript: generateHydrationScript(), renderId: 'batch2-' });`,
			),
			writeFile(
				clientEntry,
				`${fixtureSource}\nimport { hydrate } from 'solid-js/web'; export const hydrateFixture = (container, renderId) => hydrate(() => <Fixture />, container, { renderId });`,
			),
			writeFile(
				buildScript,
				`import { build } from ${JSON.stringify(viteUrl)};
				import solid from ${JSON.stringify(solidPluginUrl)};
				const root = ${JSON.stringify(packageRoot)};
				const stylesRoot = ${JSON.stringify(stylesRoot)};
				const alias = { 'solid-js': ${JSON.stringify(solidRoot)}, '@tile-ui/core': ${JSON.stringify(coreEntry)}, '@tile-ui/styles': ${JSON.stringify(stylesPackageRoot)} };
				await build({ root, plugins: [solid({ ssr: true })], logLevel: 'silent', css: { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } }, resolve: { alias }, ssr: { noExternal: true, resolve: { conditions: ['node'] } }, build: { ssr: ${JSON.stringify(serverEntry)}, outDir: ${JSON.stringify(path.join(outputRoot, 'server'))}, rollupOptions: { output: { entryFileNames: 'fixture.mjs' } } } });
				await build({ root, plugins: [solid({ solid: { hydratable: true } })], logLevel: 'silent', css: { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } }, resolve: { alias, conditions: ['browser'] }, build: { outDir: ${JSON.stringify(path.join(outputRoot, 'client'))}, lib: { entry: ${JSON.stringify(clientEntry)}, formats: ['es'], fileName: () => 'fixture.mjs' }, rollupOptions: { output: { inlineDynamicImports: true } } } });`,
			),
		]);
		try {
			try {
				await execFileAsync(process.execPath, [buildScript], { cwd: path.resolve(import.meta.dirname, '..') });
			} catch (error) {
				const failure = error as { stderr?: string; stdout?: string };
				throw new Error(failure.stderr || failure.stdout || String(error));
			}
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${btoa(serverCode)}`);
			const fixture = server.renderFixture();
			expect(fixture.html).toContain('>default text</textarea>');
			expect(fixture.html).toContain('>controlled text</textarea>');
			expect(fixture.html).toMatch(/value="b" selected/);

			document.body.innerHTML = `<div id="batch2-app">${fixture.html}</div>`;
			const hydrationCode = fixture.hydrationScript.match(/<script[^>]*>([\s\S]*)<\/script>/)?.[1];
			if (!hydrationCode) throw new Error('Missing Solid hydration script.');
			window.eval(hydrationCode);
			const hydrationState = (window as typeof window & { _$HY?: unknown })._$HY;
			Object.defineProperty(globalThis, '_$HY', { configurable: true, value: hydrationState, writable: true });
			const container = document.querySelector('#batch2-app') as HTMLElement;
			const defaultTextarea = container.querySelector('[data-id="default-textarea"]') as HTMLTextAreaElement;
			const controlledTextarea = container.querySelector('[data-id="controlled-textarea"]') as HTMLTextAreaElement;
			const defaultSelect = container.querySelector('[data-id="default-select"]') as HTMLSelectElement;
			const controlledSelect = container.querySelector('[data-id="controlled-select"]') as HTMLSelectElement;
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${btoa(`const _$HY = globalThis._$HY;\n${clientCode}`)}`);
			client.hydrateFixture(container, fixture.renderId);
			(window as typeof window & { _$HY: { fe(): void } })._$HY.fe();
			await Promise.resolve();
			expect(container.querySelector('[data-id="default-textarea"]')).toBe(defaultTextarea);
			expect(container.querySelector('[data-id="controlled-textarea"]')).toBe(controlledTextarea);
			expect(container.querySelector('[data-id="default-select"]')).toBe(defaultSelect);
			expect(container.querySelector('[data-id="controlled-select"]')).toBe(controlledSelect);
			expect([defaultTextarea.value, defaultTextarea.defaultValue, controlledTextarea.value]).toEqual(['default text', 'default text', 'controlled text']);
			expect([defaultSelect.value, controlledSelect.value]).toEqual(['b', 'b']);
		} finally {
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
			await rm(outputRoot, { recursive: true, force: true });
		}
	}, 30_000);
});

function FieldControl() {
	const field = useFieldContext();
	return (
		<input
			id={field.id}
			required={field.required()}
			aria-invalid={field.invalid() || undefined}
			aria-labelledby={field.labelId}
			aria-describedby={`${field.descriptionId} ${field.messageId}`}
		/>
	);
}
