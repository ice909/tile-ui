import { Form, FormField, FormItem, FormLabel, FormControl, Input, FormMessage, Button } from '@tile-ui/vue';

export default function FormDemo() {
	return (
		<Form>
			<FormField name="email">
				<FormItem>
					<FormLabel>Email</FormLabel>
					<FormControl>
						<Input placeholder="you@example.com" />
					</FormControl>
					<FormMessage />
				</FormItem>
			</FormField>
			<Button type="submit">Submit</Button>
		</Form>
	);
}
