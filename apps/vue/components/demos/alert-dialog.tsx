import {
	TAlertDialog,
	TAlertDialogTrigger,
	TAlertDialogContent,
	TAlertDialogTitle,
	TAlertDialogDescription,
	TAlertDialogFooter,
	TAlertDialogCancel,
	TAlertDialogAction,
} from '@tile-ui/vue';

export default function AlertDialogDemo() {
	return (
		<TAlertDialog>
			<TAlertDialogTrigger class="component-preview__action">Delete</TAlertDialogTrigger>
			<TAlertDialogContent>
				<TAlertDialogTitle>Are you sure?</TAlertDialogTitle>
				<TAlertDialogDescription>This action cannot be undone.</TAlertDialogDescription>
				<TAlertDialogFooter>
					<TAlertDialogCancel>Cancel</TAlertDialogCancel>
					<TAlertDialogAction>Delete</TAlertDialogAction>
				</TAlertDialogFooter>
			</TAlertDialogContent>
		</TAlertDialog>
	);
}
