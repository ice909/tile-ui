import { TSelect, TSelectTrigger, TSelectValue, TSelectContent, TSelectItem } from '@tile-ui/vue';

export default function SelectDemo() {
	return (
		<TSelect defaultValue="apple" style={{ width: '220px' }}>
			<TSelectTrigger>
				<TSelectValue placeholder="Choose a fruit" />
			</TSelectTrigger>
			<TSelectContent>
				<TSelectItem value="apple">Apple</TSelectItem>
				<TSelectItem value="banana">Banana</TSelectItem>
				<TSelectItem value="cherry">Cherry</TSelectItem>
			</TSelectContent>
		</TSelect>
	);
}
