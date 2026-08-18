import { Combobox } from '@tile-ui/react';

export default function ComboboxDemo() {
	return (
		<Combobox
			items={[
				{ value: 'apple', label: 'Apple' },
				{ value: 'banana', label: 'Banana' },
				{ value: 'cherry', label: 'Cherry' },
				{ value: 'date', label: 'Date' },
			]}
			placeholder="Pick a fruit"
			style={{ maxWidth: 280 }}
		/>
	);
}
