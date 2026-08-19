import { Progress } from '@tile-ui/vue';

export default function ProgressDemo() {
	return (
		<div class="component-preview__stack">
			<Progress value={40} />
			<Progress value={80} />
		</div>
	);
}
