import { RadioGroup, RadioGroupItem } from '@tile-ui/react';

export default function RadioGroupDemo() {
	return (
		<RadioGroup defaultValue="a" orientation="horizontal">
			<div className="button-group">
				<RadioGroupItem value="a" />
				<RadioGroupItem value="b" />
				<RadioGroupItem value="c" />
			</div>
		</RadioGroup>
	);
}
