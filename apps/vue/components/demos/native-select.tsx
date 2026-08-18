import { TNativeSelect, TNativeSelectOption } from '@tile-ui/vue';

export default function NativeSelectDemo() {
	return (
		<TNativeSelect defaultValue="a" style={{ maxWidth: '260px' }}>
			<TNativeSelectOption value="a">Option A</TNativeSelectOption>
			<TNativeSelectOption value="b">Option B</TNativeSelectOption>
		</TNativeSelect>
	);
}
