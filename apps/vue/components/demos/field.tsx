import { Field, FieldLabel, FieldDescription, FieldMessage } from '@tile-ui/vue';

export default function FieldDemo() {
	return (
		<Field name="email" required invalid>
			<FieldLabel htmlFor="demo-email">Email</FieldLabel>
			<input id="demo-email" class="component-preview__native-field" placeholder="you@example.com" />
			<FieldDescription>We never share your email.</FieldDescription>
			<FieldMessage variant="error">An email address is required.</FieldMessage>
		</Field>
	);
}
