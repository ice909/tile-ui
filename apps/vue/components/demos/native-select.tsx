import { NativeSelect, NativeSelectOption } from '@tile-ui/vue';

export default function NativeSelectDemo() {
	return (
		<NativeSelect defaultValue="a" style={{ maxWidth: '260px' }}>
			<NativeSelectOption value="a">Option A</NativeSelectOption>
			<NativeSelectOption value="b">Option B</NativeSelectOption>
		</NativeSelect>
	);
}
