import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@tile-ui/react';

export default function SelectDemo() {
	return (
		<Select defaultValue="apple">
			<SelectTrigger style={{ width: 220 }}>
				<SelectValue placeholder="Choose a fruit" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="apple">Apple</SelectItem>
				<SelectItem value="banana">Banana</SelectItem>
				<SelectItem value="cherry">Cherry</SelectItem>
			</SelectContent>
		</Select>
	);
}
