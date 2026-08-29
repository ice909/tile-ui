import { NativeSelect, NativeSelectOption } from '@tile-ui/vue';

export default function NativeSelectDemo() {
	return (
		<NativeSelect defaultValue="a" aria-label="Fruit" style={{ maxWidth: '260px' }}>
			<NativeSelectOption value="a">Apple</NativeSelectOption>
			<NativeSelectOption value="b">Banana</NativeSelectOption>
			<NativeSelectOption value="c">Cherry</NativeSelectOption>
		</NativeSelect>
	);
}
