import { Marker, MarkerIcon, MarkerContent } from '@tile-ui/vue';

export default function MarkerDemo() {
	return (
		<div class="button-group">
			<Marker variant="default">
				<MarkerIcon />
				<MarkerContent>Default</MarkerContent>
			</Marker>
			<Marker variant="separator">
				<MarkerIcon />
				<MarkerContent>Separator</MarkerContent>
			</Marker>
			<Marker variant="border">
				<MarkerIcon />
				<MarkerContent>Border</MarkerContent>
			</Marker>
		</div>
	);
}
