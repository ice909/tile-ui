import { Marker, MarkerContent, MarkerIcon } from '@tile-ui/solid';
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
