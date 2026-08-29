import { Alert, AlertDescription, AlertTitle } from '@tile-ui/solid';
export default function AlertDemo() {
	return (
		<div class="component-preview__stack">
			<Alert>
				<AlertTitle>Heads up</AlertTitle>
				<AlertDescription>A new Solid release is available.</AlertDescription>
			</Alert>
			<Alert variant="destructive">
				<AlertTitle>Build failed</AlertTitle>
				<AlertDescription>Review the registry output.</AlertDescription>
			</Alert>
		</div>
	);
}
