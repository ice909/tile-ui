import { Form, FormField, FormItem, FormLabel, FormControl, Input, FormDescription, FormMessage, Button } from '@tile-ui/vue';

export default function FormDemo() {
	return (
		<Form>
			<FormField name="email">
				<FormItem descriptionId="vue-form-email-help" messageId="vue-form-email-error">
					<FormLabel>Email</FormLabel>
					<FormControl>
						<Input placeholder="you@example.com" />
					</FormControl>
					<FormDescription id="vue-form-email-help">We'll never share your email.</FormDescription>
					<FormMessage id="vue-form-email-error" />
				</FormItem>
			</FormField>
			<Button type="submit">Submit</Button>
		</Form>
	);
}
