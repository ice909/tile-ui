import { RadioGroup, RadioGroupItem } from '@tile-ui/vue';

export default function RadioGroupDemo() {
	return (
		<RadioGroup defaultValue="a" orientation="horizontal">
			<RadioGroupItem value="a" />
			<RadioGroupItem value="b" />
			<RadioGroupItem value="c" />
		</RadioGroup>
	);
}
