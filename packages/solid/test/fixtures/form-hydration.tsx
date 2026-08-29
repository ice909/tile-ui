import { Show, createSignal, onMount } from 'solid-js';
import { createFormStore } from '@tile-ui/core';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../src/components/form/form';

declare global {
	interface Window {
		__tileFormFixture?: {
			getRegistrations(): number;
			getUnregistrations(): number;
			setValue(value: string): void;
			unmountField(): void;
		};
	}
}

export function FormHydrationFixture() {
	const store = createFormStore({ email: 'ssr@example.com' });
	store.setError('email', 'Server error');
	const [visible, setVisible] = createSignal(true);
	let registrations = 0;
	let unregistrations = 0;
	const registerField = store.registerField.bind(store);
	store.registerField = (name, options) => {
		registrations += 1;
		const registration = registerField(name, options);
		const unregister = registration.unregister;
		registration.unregister = () => {
			unregistrations += 1;
			unregister();
		};
		return registration;
	};

	onMount(() => {
		window.__tileFormFixture = {
			getRegistrations: () => registrations,
			getUnregistrations: () => unregistrations,
			setValue: (value) => store.setValue('email', value),
			unmountField: () => setVisible(false),
		};
	});

	return (
		<Form form={store}>
			<form>
				<Show when={visible()}>
					<FormField name="email" required="Email required">
						{({ field }) => (
							<FormItem descriptionId="form-description" messageId="form-message">
								<FormLabel>Email</FormLabel>
								<FormControl>{(control) => <input {...control} data-id="form-input" value={String(field.value ?? '')} />}</FormControl>
								<FormDescription id="form-description">Description</FormDescription>
								<FormMessage id="form-message" />
							</FormItem>
						)}
					</FormField>
				</Show>
			</form>
		</Form>
	);
}
