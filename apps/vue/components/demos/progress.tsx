import { TProgress } from '@tile-ui/vue';

export default function ProgressDemo() {
	return (
		<div class="component-preview__stack">
			<TProgress value={40} />
			<TProgress value={80} />
		</div>
	);
}
