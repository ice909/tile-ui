import { NativeSelect, NativeSelectOption } from '@tile-ui/react';

export default function NativeSelectDemo() {
	return (
		<NativeSelect defaultValue="a" aria-label="Fruit" style={{ maxWidth: 260 }}>
			<NativeSelectOption value="a">Apple</NativeSelectOption>
			<NativeSelectOption value="b">Banana</NativeSelectOption>
			<NativeSelectOption value="c">Cherry</NativeSelectOption>
		</NativeSelect>
	);
}
