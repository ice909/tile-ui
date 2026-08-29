import { Input } from '@tile-ui/solid';

export default function InputDemo() {
	return (
		<div class="component-preview__stack">
			<Input label="Project name" helperText="Used in the generated workspace URL." placeholder="Tile UI Solid" />
			<Input label="Release channel" error="Choose a stable channel." value="nightly" />
		</div>
	);
}
