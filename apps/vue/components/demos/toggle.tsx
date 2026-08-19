import { Toggle } from '@tile-ui/vue';

export default function ToggleDemo() {
	return (
		<div class="button-group">
			<Toggle>Bold</Toggle>
			<Toggle variant="outline">Italic</Toggle>
			<Toggle variant="ghost">Underline</Toggle>
		</div>
	);
}
