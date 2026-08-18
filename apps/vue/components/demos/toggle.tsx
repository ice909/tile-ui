import { TToggle } from '@tile-ui/vue';

export default function ToggleDemo() {
	return (
		<div class="button-group">
			<TToggle>Bold</TToggle>
			<TToggle variant="outline">Italic</TToggle>
			<TToggle variant="ghost">Underline</TToggle>
		</div>
	);
}
