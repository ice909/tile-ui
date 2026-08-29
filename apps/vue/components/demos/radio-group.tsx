import { RadioGroup, RadioGroupItem } from '@tile-ui/vue';

export default function RadioGroupDemo() {
	return (
		<RadioGroup defaultValue="a" orientation="horizontal">
			<RadioGroupItem value="a">Email</RadioGroupItem>
			<RadioGroupItem value="b">SMS</RadioGroupItem>
			<RadioGroupItem value="c">Push</RadioGroupItem>
		</RadioGroup>
	);
}
