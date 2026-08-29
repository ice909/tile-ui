import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { createFormStore } from '@tile-ui/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '../src/components/form/form';

const apps: Array<ReturnType<typeof createApp>> = [];

afterEach(() => {
	for (const app of apps.splice(0)) app.unmount();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

function mount(component: ReturnType<typeof defineComponent>) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	const app = createApp(component);
	apps.push(app);
	app.mount(container);
	return { app, container };
}

describe('Vue Form cleanup', () => {
	it('re-registers reactive name and deep options after cleaning the previous exact handle', async () => {
		const store = createFormStore({ first: '', second: '' });
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
		const name = ref('first');
		const options = ref({ required: 'first required' });
		const { app } = mount(
			defineComponent({
				setup: () => () => h(Form, { form: store }, { default: () => h(FormField, { name: name.value, options: options.value }, { default: () => 'Field' }) }),
			}),
		);
		expect(calls).toEqual(['register:first:first required']);

		options.value.required = 'updated required';
		await nextTick();
		expect(calls).toEqual(['register:first:first required', 'unregister:first', 'register:first:updated required']);

		name.value = 'second';
		await nextTick();
		expect(calls).toEqual(['register:first:first required', 'unregister:first', 'register:first:updated required', 'unregister:first', 'register:second:updated required']);

		app.unmount();
		apps.pop();
		expect(calls.at(-1)).toBe('unregister:second');
	});

	it('unsubscribes an external FormStore when the provider is disposed', () => {
		const store = createFormStore({});
		const subscribe = store.subscribe.bind(store);
		let notifications = 0;
		const unsubscribe = vi.fn();
		vi.spyOn(store, 'subscribe').mockImplementation((next) => {
			const dispose = subscribe(() => {
				notifications += 1;
				next();
			});
			return () => {
				dispose();
				unsubscribe();
			};
		});
		const { app } = mount(defineComponent({ setup: () => () => h(Form, { form: store }, { default: () => 'Form' }) }));
		expect(store.subscribe).toHaveBeenCalledOnce();
		store.setValue('name', 'before');
		expect(notifications).toBe(1);
		app.unmount();
		apps.pop();
		expect(unsubscribe).toHaveBeenCalledOnce();
		store.setValue('name', 'after');
		expect(notifications).toBe(1);
	});

	it('controller applies valueAsNumber through the active registration', async () => {
		const store = createFormStore({ amount: 0 });
		let change: ((value: unknown) => void) | undefined;
		mount(
			defineComponent({
				setup: () => () =>
					h(
						Form,
						{ form: store },
						{
							default: () =>
								h(
									FormField,
									{ name: 'amount', options: { valueAsNumber: true } },
									{
										default: ({ field }: { field: { onChange(value: unknown): void } }) => {
											change = field.onChange;
											return 'Amount';
										},
									},
								),
						},
					),
			}),
		);
		change?.({ target: { value: '42' } });
		await nextTick();
		expect(store.getValue('amount')).toBe(42);
	});
});

describe('Vue Form presence-driven aria-describedby', () => {
	it('references only mounted description and non-empty message nodes', async () => {
		const store = createFormStore({ name: '' });
		const showDescription = ref(false);
		const fallback = ref('');
		const { container } = mount(
			defineComponent({
				setup: () => () =>
					h(
						Form,
						{ form: store },
						{
							default: () =>
								h(
									FormField,
									{ name: 'name' },
									{
										default: () =>
											h(
												FormItem,
												{},
												{
													default: () => [
														h(FormControl, {}, { default: () => h('input') }),
														showDescription.value ? h(FormDescription, {}, { default: () => 'Description' }) : null,
														h(FormMessage, {}, { default: () => fallback.value }),
													],
												},
											),
									},
								),
						},
					),
			}),
		);
		const input = container.querySelector('input') as HTMLInputElement;
		await nextTick();
		expect(input.getAttribute('aria-describedby')).toBeNull();

		showDescription.value = true;
		await nextTick();
		expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-description`);

		fallback.value = 'Hint';
		await nextTick();
		expect(container.querySelector('[data-slot="form-message"]')?.textContent).toBe('Hint');
		expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-description`);

		store.setError('name', { message: 'Error' });
		await nextTick();
		expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-description ${input.id}-message`);
		expect(container.querySelector('[data-slot="form-message"]')?.textContent).toBe('Error');

		store.clearErrors('name');
		fallback.value = '';
		showDescription.value = false;
		await nextTick();
		expect(container.querySelector('[data-slot="form-message"]')).toBeNull();
		expect(input.getAttribute('aria-describedby')).toBeNull();
	});

	it('honors declared descriptionId/messageId props with matching mounted nodes', async () => {
		const store = createFormStore({ name: '' });
		const { container } = mount(
			defineComponent({
				setup: () => () =>
					h(
						Form,
						{ form: store },
						{
							default: () =>
								h(
									FormField,
									{ name: 'name' },
									{
										default: () =>
											h(
												FormItem,
												{ descriptionId: 'declared-description', messageId: 'declared-message' },
												{
													default: () => [
														h(FormControl, {}, { default: () => h('input') }),
														h(FormDescription, {}, { default: () => 'Description' }),
														h(FormMessage, {}),
													],
												},
											),
									},
								),
						},
					),
			}),
		);
		const input = container.querySelector('input') as HTMLInputElement;
		await nextTick();
		expect(input.getAttribute('aria-describedby')).toBe('declared-description');
		expect(container.querySelector('[data-slot="form-description"]')?.id).toBe('declared-description');

		store.setError('name', { message: 'Error' });
		await nextTick();
		expect(input.getAttribute('aria-describedby')).toBe('declared-description declared-message');
		expect(container.querySelector('[data-slot="form-message"]')?.id).toBe('declared-message');
		expect(container.querySelector('[data-slot="form-message"]')?.textContent).toBe('Error');

		store.clearErrors('name');
		await nextTick();
		expect(container.querySelector('[data-slot="form-message"]')).toBeNull();
		expect(input.getAttribute('aria-describedby')).toBe('declared-description');
	});
});
