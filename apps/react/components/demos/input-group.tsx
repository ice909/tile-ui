import { InputGroup, InputGroupAddon, InputGroupInput } from '@tile-ui/react';

export default function InputGroupDemo() {
	return (
		<InputGroup>
			<InputGroupAddon>https://</InputGroupAddon>
			<InputGroupInput placeholder="example.com" aria-label="Website address" />
		</InputGroup>
	);
}
