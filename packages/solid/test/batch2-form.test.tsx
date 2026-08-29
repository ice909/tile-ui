import { execFile } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { Show, createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { createFormStore } from '@tile-ui/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useForm, useFormField } from '../src/components/form/form';

const disposers: Array<() => void> = [];
const execFileAsync = promisify(execFile);

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function inputValue(input: HTMLInputElement, value: string) {
	input.value = value;
	input.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('Solid Form', () => {
	it('uses one external store and exposes reactive form and field snapshots', () => {
		const store = createFormStore({ email: 'first@example.com' });
		const container = mount(() => (
			<Form form={store} defaultValues={{ email: 'ignored@example.com' }}>
				<FormProbe />
				<FormField name="email">
					{({ field }) => (
						<FormItem id="email-field">
							<FieldProbe />
							<FormLabel>Email</FormLabel>
							<FormControl>
								{(control) => <input {...control} value={String(field.value ?? '')} onInput={(event) => field.onChange(event)} onBlur={field.onBlur} />}
							</FormControl>
							<FormDescription>Work address</FormDescription>
							<FormMessage>Fallback message</FormMessage>
						</FormItem>
					)}
				</FormField>
			</Form>
		));
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('first@example.com');
		expect(input.id).toBe('email-field-form-item');
		expect(input.name).toBe('email');
		expect(input.getAttribute('aria-describedby')).toBe('email-field-form-item-description');
		expect(container.querySelector('label')?.htmlFor).toBe(input.id);
		expect(container.querySelector('[data-form-version]')?.textContent).toBe('0');

		inputValue(input, 'next@example.com');
		input.dispatchEvent(new FocusEvent('blur'));
		expect(store.getValue('email')).toBe('next@example.com');
		expect(container.querySelector('[data-dirty]')?.textContent).toBe('true');
		expect(container.querySelector('[data-touched]')?.textContent).toBe('true');
		expect(container.querySelector('[data-form-version]')?.textContent).not.toBe('0');
	});

	it('creates an internal store once and keeps it across provider updates', () => {
		let rerender!: () => void;
		let firstStore: ReturnType<typeof createFormStore> | undefined;
		const container = mount(() => {
			const [version, setVersion] = createSignal(0);
			rerender = () => setVersion((value) => value + 1);
			return (
				<Form defaultValues={{ name: 'initial' }}>
					{version() >= 0 && <StoreIdentity onRead={(store) => (firstStore ??= store)} expected={firstStore} />}
					<FormField name="name">{({ field }) => <span data-value>{String(field.value)}</span>}</FormField>
				</Form>
			);
		});
		expect(container.querySelector('[data-value]')?.textContent).toBe('initial');
		firstStore?.setValue('name', 'changed');
		rerender();
		expect(container.querySelector('[data-value]')?.textContent).toBe('changed');
		expect(container.querySelector('[data-same]')?.textContent).toBe('true');
	});

	it('validates required fields, applies error precedence, and submits success and failure through a native form', async () => {
		const store = createFormStore({ email: '' });
		const valid = vi.fn();
		const invalid = vi.fn();
		const container = mount(() => (
			<Form form={store}>
				<form novalidate onSubmit={store.createSubmitHandler(valid, invalid)}>
					<FormField name="email" required="Email is required">
						{({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>{(control) => <input {...control} value={String(field.value ?? '')} onInput={(event) => field.onChange(event)} />}</FormControl>
								<FormDescription>Required address</FormDescription>
								<FormMessage>Fallback</FormMessage>
							</FormItem>
						)}
					</FormField>
					<button type="submit">Submit</button>
				</form>
			</Form>
		));
		const form = container.querySelector('form') as HTMLFormElement;
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.required).toBe(true);
		expect(input.getAttribute('aria-required')).toBe('true');

		form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(invalid).toHaveBeenCalledOnce());
		expect(valid).not.toHaveBeenCalled();
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toContain('-form-item-message');
		expect(container.querySelector('[data-slot="form-message"]')?.textContent).toBe('Email is required');

		inputValue(input, 'solid@example.com');
		form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(valid).toHaveBeenCalledWith({ email: 'solid@example.com' }, expect.any(SubmitEvent)));
		expect(store.getFormState().isSubmitted).toBe(true);
		expect(store.getFormState().isSubmitting).toBe(false);
	});

	it('resets values and reactive touched, dirty, error, and submission state', async () => {
		const defaults = { name: 'initial' };
		const store = createFormStore(defaults);
		const container = mount(() => (
			<Form form={store}>
				<FormField name="name" required="Name is required">
					{({ field }) => (
						<FormItem>
							<FormControl>
								{(control) => <input {...control} value={String(field.value ?? '')} onInput={(event) => field.onChange(event)} onBlur={field.onBlur} />}
							</FormControl>
							<FormMessage />
							<FieldProbe />
						</FormItem>
					)}
				</FormField>
			</Form>
		));
		const input = container.querySelector('input') as HTMLInputElement;
		inputValue(input, '');
		input.dispatchEvent(new FocusEvent('blur'));
		await store.trigger('name');
		expect(container.querySelector('[data-slot="form-message"]')).toBeTruthy();

		store.reset();
		expect(input.value).toBe('initial');
		expect(container.querySelector('[data-dirty]')?.textContent).toBe('false');
		expect(container.querySelector('[data-touched]')?.textContent).toBe('false');
		expect(container.querySelector('[data-slot="form-message"]')).toBeNull();
		expect(store.getFormState().submitCount).toBe(0);
	});

	it('describes controls only with mounted description and non-empty message nodes', () => {
		const store = createFormStore({ name: '' });
		let setDescription!: (visible: boolean) => void;
		let setFallback!: (value: string) => void;
		const container = mount(() => {
			const [description, updateDescription] = createSignal(false);
			const [fallback, updateFallback] = createSignal('');
			setDescription = updateDescription;
			setFallback = updateFallback;
			return (
				<Form form={store}>
					<FormField name="name">
						{({ field }) => (
							<FormItem id="aria-field">
								<FormControl>{(control) => <input {...control} value={String(field.value ?? '')} />}</FormControl>
								<Show when={description()}>
									<FormDescription>Description</FormDescription>
								</Show>
								<FormMessage>{fallback()}</FormMessage>
							</FormItem>
						)}
					</FormField>
				</Form>
			);
		});
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('aria-describedby')).toBeNull();
		setDescription(true);
		expect(input.getAttribute('aria-describedby')).toBe('aria-field-form-item-description');
		setFallback('Hint');
		expect(container.querySelector('[data-slot="form-message"]')?.textContent).toBe('Hint');
		expect(input.getAttribute('aria-describedby')).toBe('aria-field-form-item-description');
		store.setError('name', 'Error');
		expect(input.getAttribute('aria-describedby')).toBe('aria-field-form-item-description aria-field-form-item-message');
		store.clearErrors('name');
		setFallback('');
		setDescription(false);
		expect(container.querySelector('[data-slot="form-message"]')).toBeNull();
		expect(input.getAttribute('aria-describedby')).toBeNull();
	});

	it('references exact custom and reactive description/message IDs', () => {
		const store = createFormStore({ name: '' });
		let setDescriptionId!: (id: string) => void;
		let setMessageId!: (id: string) => void;
		const container = mount(() => {
			const [descriptionId, updateDescriptionId] = createSignal('custom-description');
			const [messageId, updateMessageId] = createSignal('custom-message');
			setDescriptionId = updateDescriptionId;
			setMessageId = updateMessageId;
			return (
				<Form form={store}>
					<FormField name="name">
						{({ field }) => (
							<FormItem descriptionId={descriptionId()} messageId={messageId()}>
								<FormControl>{(control) => <input {...control} value={String(field.value ?? '')} />}</FormControl>
								<FormDescription id={descriptionId()}>Description</FormDescription>
								<FormMessage id={messageId()}>Fallback</FormMessage>
							</FormItem>
						)}
					</FormField>
				</Form>
			);
		});
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('aria-describedby')).toBe('custom-description');
		store.setError('name', 'Error');
		expect(input.getAttribute('aria-describedby')).toBe('custom-description custom-message');
		setDescriptionId('next-description');
		setMessageId('next-message');
		expect(container.querySelector('[data-slot="form-description"]')?.id).toBe('next-description');
		expect(container.querySelector('[data-slot="form-message"]')?.id).toBe('next-message');
		expect(input.getAttribute('aria-describedby')).toBe('next-description next-message');
	});

	it('keeps remaining same-name fields registered when one mount is removed', async () => {
		const store = createFormStore({ name: '' });
		let setSecond!: (visible: boolean) => void;
		mount(() => {
			const [second, updateSecond] = createSignal(true);
			setSecond = updateSecond;
			return (
				<Form form={store}>
					<FormField name="name" required="first required">
						{() => <span>First</span>}
					</FormField>
					<Show when={second()}>
						<FormField name="name" required={false} maxLength={{ value: 3, message: 'second max' }}>
							{() => <span>Second</span>}
						</FormField>
					</Show>
				</Form>
			);
		});
		store.setValue('name', 'long');
		expect(await store.trigger('name')).toBe(false);
		expect(store.getFieldState('name').error?.message).toBe('second max');
		setSecond(false);
		store.setValue('name', '');
		expect(await store.trigger('name')).toBe(false);
		expect(store.getFieldState('name').error?.message).toBe('first required');
	});

	it('unsubscribes the provider snapshot bridge on disposal', () => {
		const store = createFormStore({});
		const originalSubscribe = store.subscribe.bind(store);
		const unsubscribe = vi.fn();
		vi.spyOn(store, 'subscribe').mockImplementation((listener) => {
			const dispose = originalSubscribe(listener);
			return () => {
				dispose();
				unsubscribe();
			};
		});
		mount(() => <Form form={store}>Form</Form>);
		disposers.pop()?.();
		expect(unsubscribe).toHaveBeenCalledOnce();
	});

	it('unregisters fields when reactive branches are removed', () => {
		const store = createFormStore({ code: '' });
		let setVisible!: (visible: boolean) => void;
		mount(() => {
			const [visible, updateVisible] = createSignal(true);
			setVisible = updateVisible;
			return (
				<Form form={store}>
					<Show when={visible()}>
						<FormField name="code" required="Code required">
							{() => <span>Code</span>}
						</FormField>
					</Show>
				</Form>
			);
		});
		expect(store.getFieldState('code').isTouched).toBe(false);
		store.setError('code', 'Stale error');
		setVisible(false);
		expect(store.getFieldState('code').error).toBeUndefined();
		return expect(store.trigger()).resolves.toBe(true);
	});

	it('renders custom validation messages after native submit only when the form opts out of constraint validation', async () => {
		const store = createFormStore({ email: '' });
		const valid = vi.fn();
		const invalid = vi.fn();
		const container = mount(() => (
			<Form form={store}>
				<form novalidate onSubmit={store.createSubmitHandler(valid, invalid)}>
					<FormField name="email" required="Enter a valid email.">
						{({ field }) => (
							<FormItem id="novalidate-field">
								<FormControl>
									{(control) => <input {...control} data-id="novalidate-input" value={String(field.value ?? '')} onInput={(event) => field.onChange(event)} />}
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					</FormField>
					<button type="submit">Submit</button>
				</form>
			</Form>
		));
		const form = container.querySelector('form') as HTMLFormElement;
		const input = container.querySelector('[data-id="novalidate-input"]') as HTMLInputElement;
		expect(input.required).toBe(true);

		form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(invalid).toHaveBeenCalledOnce());
		expect(valid).not.toHaveBeenCalled();
		expect(container.querySelector('[data-slot="form-message"]')?.textContent).toBe('Enter a valid email.');
		expect(input.getAttribute('aria-describedby')).toContain('novalidate-field-form-item-message');
		expect(input.getAttribute('aria-invalid')).toBe('true');
	});

	it('keeps explicit IDs and provider-only markup stable across equivalent renders', () => {
		const renderForm = () =>
			mount(() => (
				<Form defaultValues={{ email: 'ssr@example.com' }}>
					<form>
						<FormField name="email" required>
							{({ field }) => (
								<FormItem id="stable-email">
									<FormLabel>Email</FormLabel>
									<FormControl>{(control) => <input {...control} value={String(field.value ?? '')} />}</FormControl>
									<FormDescription>SSR</FormDescription>
								</FormItem>
							)}
						</FormField>
					</form>
				</Form>
			)).innerHTML;
		const first = renderForm();
		const second = renderForm();
		expect(first).toBe(second);
		expect(first.startsWith('<form')).toBe(true);
		expect(first).not.toContain('<Form');
		expect(first).toContain('aria-required="true"');
	});

	it('server-renders and hydrates Form IDs, controller updates, exact registration, and cleanup', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-form-'));
		const packageRoot = path.resolve(import.meta.dirname, '..');
		const stylesRoot = path.resolve(import.meta.dirname, '../../styles/scss');
		const buildScript = path.join(outputRoot, 'build.mjs');
		const viteUrl = pathToFileURL(path.resolve(import.meta.dirname, '../node_modules/vite/dist/node/index.js')).href;
		const solidPluginUrl = pathToFileURL(path.resolve(import.meta.dirname, '../node_modules/vite-plugin-solid/dist/esm/index.mjs')).href;
		try {
			await import('node:fs/promises').then(({ writeFile }) =>
				writeFile(
					buildScript,
					`import solid from ${JSON.stringify(solidPluginUrl)}; import { build } from ${JSON.stringify(viteUrl)}; const root=${JSON.stringify(packageRoot)}; const css={preprocessorOptions:{scss:{loadPaths:[${JSON.stringify(stylesRoot)}]}}}; await build({root,plugins:[solid({ssr:true})],logLevel:'silent',css,ssr:{noExternal:true,resolve:{conditions:['node']}},build:{ssr:'test/fixtures/form-server.tsx',outDir:${JSON.stringify(path.join(outputRoot, 'server'))},rollupOptions:{output:{entryFileNames:'fixture.mjs'}}}}); await build({root,plugins:[solid({solid:{hydratable:true}})],logLevel:'silent',css,resolve:{conditions:['browser']},build:{outDir:${JSON.stringify(path.join(outputRoot, 'client'))},lib:{entry:'test/fixtures/form-client.tsx',formats:['es'],fileName:()=> 'fixture.mjs'},rollupOptions:{output:{inlineDynamicImports:true}}}});`,
				),
			);
			try {
				await execFileAsync(process.execPath, [buildScript], { cwd: packageRoot });
			} catch (error) {
				const failure = error as { stderr?: string; stdout?: string };
				throw new Error(failure.stderr || failure.stdout || String(error));
			}
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${Buffer.from(serverCode).toString('base64')}`);
			const fixture = server.renderFormFixture();
			document.body.innerHTML = `${fixture.hydrationScript}<div id="form-app">${fixture.html}</div>`;
			const hydrationCode = fixture.hydrationScript.match(/<script[^>]*>([\s\S]*)<\/script>/)?.[1];
			if (!hydrationCode) throw new Error('Missing Solid hydration script.');
			window.eval(hydrationCode);
			Object.defineProperty(globalThis, '_$HY', { configurable: true, value: (window as typeof window & { _$HY?: unknown })._$HY, writable: true });
			const container = document.querySelector('#form-app') as HTMLElement;
			const serverInput = container.querySelector('[data-id="form-input"]') as HTMLInputElement;
			const serverId = serverInput.id;
			expect(serverInput.getAttribute('aria-describedby')).toBe('form-description form-message');
			expect(container.querySelector('#form-message')?.textContent).toBe('Server error');
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${Buffer.from(`const _$HY = globalThis._$HY;\n${clientCode}`).toString('base64')}`);
			client.hydrateFormFixture(container, fixture.renderId);
			(window as typeof window & { _$HY: { fe(): void } })._$HY.fe();
			await Promise.resolve();
			expect(container.querySelector('[data-id="form-input"]')).toBe(serverInput);
			expect(serverInput.id).toBe(serverId);
			expect(serverInput.value).toBe('ssr@example.com');
			expect(window.__tileFormFixture?.getRegistrations()).toBe(1);
			window.__tileFormFixture?.setValue('hydrated@example.com');
			expect(serverInput.value).toBe('hydrated@example.com');
			window.__tileFormFixture?.unmountField();
			expect(container.querySelector('[data-id="form-input"]')).toBeNull();
			expect(window.__tileFormFixture?.getUnregistrations()).toBe(1);
		} finally {
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
			delete window.__tileFormFixture;
			await rm(outputRoot, { recursive: true, force: true });
		}
	}, 30_000);
});

function FormProbe() {
	const form = useForm();
	return <span data-form-version>{form.snapshot().version}</span>;
}

function FieldProbe() {
	const field = useFormField();
	return (
		<>
			<span data-dirty>{String(field.isDirty())}</span>
			<span data-touched>{String(field.isTouched())}</span>
		</>
	);
}

function StoreIdentity(props: { onRead: (store: ReturnType<typeof createFormStore>) => void; expected?: ReturnType<typeof createFormStore> }) {
	const form = useForm();
	props.onRead(form.store);
	return <span data-same>{String(props.expected === undefined || props.expected === form.store)}</span>;
}
