// @vitest-environment jsdom

import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createFormStore } from '@tile-ui/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '../src/components/form/form';

const roots: Array<ReturnType<typeof createRoot>> = [];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount());
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('React FormField registration', () => {
	it('passes options, re-registers changed options, and cleans the exact previous handle', () => {
		const store = createFormStore({ amount: 0 });
		const calls: string[] = [];
		const registerField = store.registerField.bind(store);
		vi.spyOn(store, 'registerField').mockImplementation((name, options) => {
			calls.push(`register:${name}:${String(options.required)}`);
			const registration = registerField(name, options);
			const unregister = registration.unregister;
			registration.unregister = () => {
				calls.push(`unregister:${name}`);
				unregister();
			};
			return registration;
		});
		const container = document.createElement('div');
		document.body.appendChild(container);
		const root = createRoot(container);
		roots.push(root);
		let change: ((value: unknown) => void) | undefined;
		const renderField = (required: string) => (
			<Form form={store}>
				<FormField name="amount" options={{ required, valueAsNumber: true }} render={({ field }) => ((change = field.onChange), null)} />
			</Form>
		);
		act(() => root.render(renderField('first')));
		expect(calls).toEqual(['register:amount:first']);
		act(() => change?.({ target: { value: '42' } }));
		expect(store.getValue('amount')).toBe(42);

		act(() => root.render(renderField('second')));
		expect(calls).toEqual(['register:amount:first', 'unregister:amount', 'register:amount:second']);
		act(() => root.unmount());
		roots.pop();
		expect(calls.at(-1)).toBe('unregister:amount');
	});
});

describe('React Form presence-driven aria-describedby', () => {
	it('references only mounted description and non-empty message nodes', () => {
		const store = createFormStore({ name: '' });
		const harness: { setDescription: (visible: boolean) => void; setFallback: (value: string) => void } = { setDescription: () => {}, setFallback: () => {} };
		const container = document.createElement('div');
		document.body.appendChild(container);
		const root = createRoot(container);
		roots.push(root);
		const PresenceToggle = () => {
			const [description, updateDescription] = useState(false);
			const [fallback, updateFallback] = useState('');
			harness.setDescription = updateDescription;
			harness.setFallback = updateFallback;
			return (
				<>
					{description ? <FormDescription>Description</FormDescription> : null}
					<FormMessage>{fallback}</FormMessage>
				</>
			);
		};
		const render = () => (
			<Form form={store}>
				<FormField
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<input value={String(field.value ?? '')} onChange={(e) => field.onChange(e.target.value)} />
							</FormControl>
							<PresenceToggle />
						</FormItem>
					)}
				/>
			</Form>
		);
		act(() => root.render(render()));
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('aria-describedby')).toBeNull();

		act(() => harness.setDescription(true));
		expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-description`);
		expect(container.querySelector('[data-slot="form-description"]')?.id).toBe(`${input.id}-description`);

		act(() => harness.setFallback('Hint'));
		expect(container.querySelector('[data-slot="form-message"]')?.textContent).toBe('Hint');
		expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-description`);

		act(() => store.setError('name', { message: 'Error' }));
		expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-description ${input.id}-message`);
		expect(container.querySelector('[data-slot="form-message"]')?.textContent).toBe('Error');

		act(() => store.clearErrors('name'));
		act(() => harness.setFallback(''));
		act(() => harness.setDescription(false));
		expect(container.querySelector('[data-slot="form-message"]')).toBeNull();
		expect(input.getAttribute('aria-describedby')).toBeNull();
	});

	it('honors declared descriptionId/messageId props with matching mounted nodes', () => {
		const store = createFormStore({ name: '' });
		const container = document.createElement('div');
		document.body.appendChild(container);
		const root = createRoot(container);
		roots.push(root);
		act(() =>
			root.render(
				<Form form={store}>
					<FormField
						name="name"
						render={({ field }) => (
							<FormItem descriptionId="declared-description" messageId="declared-message">
								<FormControl>
									<input value={String(field.value ?? '')} onChange={(e) => field.onChange(e.target.value)} />
								</FormControl>
								<FormDescription>Description</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</Form>,
			),
		);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('aria-describedby')).toBe('declared-description');
		expect(container.querySelector('[data-slot="form-description"]')?.id).toBe('declared-description');

		act(() => store.setError('name', { message: 'Error' }));
		expect(input.getAttribute('aria-describedby')).toBe('declared-description declared-message');
		expect(container.querySelector('[data-slot="form-message"]')?.id).toBe('declared-message');
		expect(container.querySelector('[data-slot="form-message"]')?.textContent).toBe('Error');

		act(() => store.clearErrors('name'));
		expect(container.querySelector('[data-slot="form-message"]')).toBeNull();
		expect(input.getAttribute('aria-describedby')).toBe('declared-description');
	});
});
