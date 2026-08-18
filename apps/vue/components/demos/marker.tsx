import { TMarker, TMarkerIcon, TMarkerContent } from '@tile-ui/vue';

export default function MarkerDemo() {
	return (
		<div class="button-group">
			<TMarker variant="default">
				<TMarkerIcon />
				<TMarkerContent>Default</TMarkerContent>
			</TMarker>
			<TMarker variant="separator">
				<TMarkerIcon />
				<TMarkerContent>Separator</TMarkerContent>
			</TMarker>
			<TMarker variant="border">
				<TMarkerIcon />
				<TMarkerContent>Border</TMarkerContent>
			</TMarker>
		</div>
	);
}
