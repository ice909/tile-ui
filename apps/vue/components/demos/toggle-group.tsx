import { TToggleGroup, TToggleGroupItem } from '@tile-ui/vue';

export default function ToggleGroupDemo() {
	return (
		<TToggleGroup type="single" defaultValue="left">
			<TToggleGroupItem value="left">Left</TToggleGroupItem>
			<TToggleGroupItem value="center">Center</TToggleGroupItem>
			<TToggleGroupItem value="right">Right</TToggleGroupItem>
		</TToggleGroup>
	);
}
