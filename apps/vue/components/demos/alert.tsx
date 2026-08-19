import { Alert, AlertTitle, AlertDescription } from '@tile-ui/vue';

export default function AlertDemo() {
	return (
		<div class="component-preview__stack">
			<Alert>
				<AlertTitle>Heads up</AlertTitle>
				<AlertDescription>A new version of Tile UI is available.</AlertDescription>
			</Alert>
			<Alert variant="destructive">
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>Your session could not be restored.</AlertDescription>
			</Alert>
		</div>
	);
}
