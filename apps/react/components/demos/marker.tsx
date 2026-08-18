import { Marker, MarkerIcon, MarkerContent } from '@tile-ui/react';

export default function MarkerDemo() {
	return (
		<div className="button-group">
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
