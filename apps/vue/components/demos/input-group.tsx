import { TInputGroup, TInputGroupAddon, TInputGroupInput } from '@tile-ui/vue';

export default function InputGroupDemo() {
	return (
		<TInputGroup>
			<TInputGroupAddon>https://</TInputGroupAddon>
			<TInputGroupInput placeholder="example.com" />
		</TInputGroup>
	);
}
