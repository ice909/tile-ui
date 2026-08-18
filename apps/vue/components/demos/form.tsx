import { TForm, TFormField, TFormItem, TFormLabel, TFormControl, TInput, TFormMessage, TButton } from '@tile-ui/vue';

export default function FormDemo() {
	return (
		<TForm>
			<TFormField name="email">
				<TFormItem>
					<TFormLabel>Email</TFormLabel>
					<TFormControl>
						<TInput placeholder="you@example.com" />
					</TFormControl>
					<TFormMessage />
				</TFormItem>
			</TFormField>
			<TButton type="submit">Submit</TButton>
		</TForm>
	);
}
