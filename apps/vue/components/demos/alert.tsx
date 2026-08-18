import { TAlert, TAlertTitle, TAlertDescription } from '@tile-ui/vue';

export default function AlertDemo() {
	return (
		<div class="component-preview__stack">
			<TAlert>
				<TAlertTitle>Heads up</TAlertTitle>
				<TAlertDescription>A new version of Tile UI is available.</TAlertDescription>
			</TAlert>
			<TAlert variant="destructive">
				<TAlertTitle>Error</TAlertTitle>
				<TAlertDescription>Your session could not be restored.</TAlertDescription>
			</TAlert>
		</div>
	);
}
