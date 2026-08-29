import { RadioGroup, RadioGroupItem } from '@tile-ui/react';

export default function RadioGroupDemo() {
	return (
		<RadioGroup defaultValue="a" orientation="horizontal">
			<div className="button-group">
				<RadioGroupItem value="a">Email</RadioGroupItem>
				<RadioGroupItem value="b">SMS</RadioGroupItem>
				<RadioGroupItem value="c">Push</RadioGroupItem>
			</div>
		</RadioGroup>
	);
}
