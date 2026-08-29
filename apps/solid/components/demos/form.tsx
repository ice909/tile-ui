import { createSignal } from 'solid-js';
import { Button, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input, useForm } from '@tile-ui/solid';

function DemoForm() {
	const form = useForm();
	const [submitted, setSubmitted] = createSignal('not submitted');
	const submit = form.store.createSubmitHandler(
		(values) => {
			setSubmitted(String(values.email));
		},
		() => {
			setSubmitted('validation error');
		},
	);
	return (
		<form
			class="component-preview__stack"
			novalidate
			onSubmit={submit}
			onReset={() => {
				form.store.reset();
				setSubmitted('reset');
			}}>
			<FormField name="email" required>
				{({ field }) => (
					<FormItem id="solid-form-email" descriptionId="solid-form-email-help" messageId="solid-form-email-error">
						<FormLabel>Email</FormLabel>
						<FormControl>
							{(control) => (
								<Input {...control} data-id="solid-form-email-control" value={String(field.value ?? '')} onChangeValue={field.onChange} onBlur={field.onBlur} />
							)}
						</FormControl>
						<FormDescription id="solid-form-email-help">Submit, correct, then reset this field.</FormDescription>
						<FormMessage id="solid-form-email-error" />
					</FormItem>
				)}
			</FormField>
			<div>
				<Button type="submit" size="sm">
					Submit
				</Button>{' '}
				<Button type="reset" size="sm" variant="outline">
					Reset
				</Button>
			</div>
			<p class="component-preview__text">Result: {submitted()}</p>
		</form>
	);
}

export default function FormDemo() {
	return (
		<Form
			defaultValues={{ email: '' }}
			resolver={(values) => {
				const errors: Record<string, { message: string }> = {};
				if (!String(values.email ?? '').includes('@')) errors.email = { message: 'Enter a valid email.' };
				return errors;
			}}>
			<DemoForm />
		</Form>
	);
}
