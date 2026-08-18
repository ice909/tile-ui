import { Form, FormField, FormItem, FormLabel, FormControl, Input, FormMessage, Button } from '@tile-ui/react';

export default function FormDemo() {
	return (
		<Form>
			<FormField
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Email</FormLabel>
						<FormControl>
							<Input placeholder="you@example.com" value={String(field.value ?? '')} onChange={(e) => field.onChange(e.target.value)} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<Button type="submit">Submit</Button>
		</Form>
	);
}
