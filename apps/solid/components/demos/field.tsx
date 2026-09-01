import { createSignal } from 'solid-js';
import { Field, FieldDescription, FieldLabel, FieldMessage, useFieldContext } from '@tile-ui/solid';

function FieldControl(props: { onInput: (value: string) => void }) {
	const field = useFieldContext();
	return (
		<input
			id={field.id}
			class="component-preview__native-field"
			required={field.required()}
			aria-invalid={field.invalid()}
			aria-describedby={`${field.descriptionId} ${field.messageId}`}
			onInput={(event) => props.onInput(event.currentTarget.value)}
		/>
	);
}

export default function FieldDemo() {
	const [value, setValue] = createSignal('');
	const invalid = () => value().length > 0 && value().length < 4;
	return (
		<Field name="workspace" required invalid={invalid()}>
			<FieldLabel>Workspace</FieldLabel>
			<FieldControl onInput={setValue} />
			<FieldDescription>Use at least four characters.</FieldDescription>
			<FieldMessage variant={invalid() ? 'error' : 'default'}>{invalid() ? 'Workspace is too short.' : 'Field IDs and ARIA stay connected.'}</FieldMessage>
		</Field>
	);
}
