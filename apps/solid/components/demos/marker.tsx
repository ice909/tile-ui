import { Marker, MarkerContent, MarkerIcon } from '@tile-ui/solid';
export default function MarkerDemo() {
	return (
		<div class="component-preview__stack">
			<Marker>
				<MarkerIcon />
				<MarkerContent>Solid adapter</MarkerContent>
			</Marker>
			<Marker variant="separator">
				<MarkerContent>Registry output</MarkerContent>
			</Marker>
		</div>
	);
}
