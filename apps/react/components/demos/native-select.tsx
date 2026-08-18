import { NativeSelect, NativeSelectOption } from '@tile-ui/react';

export default function NativeSelectDemo() {
	return (
		<NativeSelect defaultValue="a" style={{ maxWidth: 260 }}>
			<NativeSelectOption value="a">Option A</NativeSelectOption>
			<NativeSelectOption value="b">Option B</NativeSelectOption>
			<NativeSelectOption value="c">Option C</NativeSelectOption>
		</NativeSelect>
	);
}
