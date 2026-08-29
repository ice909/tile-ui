import { Form, FormField, FormItem, FormLabel, FormControl, Input, FormDescription, FormMessage, Button } from '@tile-ui/react';

export default function FormDemo() {
	return (
		<Form>
			<FormField
				name="email"
				render={({ field }) => (
					<FormItem descriptionId="react-form-email-help" messageId="react-form-email-error">
						<FormLabel>Email</FormLabel>
						<FormControl>
							<Input placeholder="you@example.com" value={String(field.value ?? '')} onChange={(e) => field.onChange(e.target.value)} />
						</FormControl>
						<FormDescription id="react-form-email-help">We'll never share your email.</FormDescription>
						<FormMessage id="react-form-email-error" />
					</FormItem>
				)}
			/>
			<Button type="submit">Submit</Button>
		</Form>
	);
}
