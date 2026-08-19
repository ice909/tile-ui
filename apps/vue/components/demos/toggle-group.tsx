import { ToggleGroup, ToggleGroupItem } from '@tile-ui/vue';

export default function ToggleGroupDemo() {
	return (
		<ToggleGroup type="single" defaultValue="left">
			<ToggleGroupItem value="left">Left</ToggleGroupItem>
			<ToggleGroupItem value="center">Center</ToggleGroupItem>
			<ToggleGroupItem value="right">Right</ToggleGroupItem>
		</ToggleGroup>
	);
}
