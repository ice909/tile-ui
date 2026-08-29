import { createSignal } from 'solid-js';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from '@tile-ui/solid';

export default function InputGroupDemo() {
	const [copied, setCopied] = createSignal(false);
	return (
		<InputGroup>
			<InputGroupAddon>
				<InputGroupText>tile.ui/</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput aria-label="Project slug" value="solid" />
			<InputGroupAddon align="inline-end">
				<InputGroupButton onClick={() => setCopied(true)}>{copied() ? 'Copied' : 'Copy'}</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}
