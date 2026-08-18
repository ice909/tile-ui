import { TField, TFieldLabel, TFieldDescription, TFieldMessage } from '@tile-ui/vue';

export default function FieldDemo() {
	return (
		<TField name="email" required invalid>
			<TFieldLabel htmlFor="demo-email">Email</TFieldLabel>
			<input id="demo-email" class="component-preview__native-field" placeholder="you@example.com" />
			<TFieldDescription>We never share your email.</TFieldDescription>
			<TFieldMessage variant="error">An email address is required.</TFieldMessage>
		</TField>
	);
}
