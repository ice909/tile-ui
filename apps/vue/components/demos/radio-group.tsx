import { TRadioGroup, TRadioGroupItem } from '@tile-ui/vue';

export default function RadioGroupDemo() {
	return (
		<TRadioGroup defaultValue="a" orientation="horizontal">
			<TRadioGroupItem value="a" />
			<TRadioGroupItem value="b" />
			<TRadioGroupItem value="c" />
		</TRadioGroup>
	);
}
