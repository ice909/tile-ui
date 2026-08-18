import { TDialog, TDialogTrigger, TDialogContent, TDialogHeader, TDialogTitle, TDialogDescription, TDialogFooter, TButton } from '@tile-ui/vue';

export default function DialogDemo() {
	return (
		<TDialog>
			<TDialogTrigger class="component-preview__action">Open dialog</TDialogTrigger>
			<TDialogContent>
				<TDialogHeader>
					<TDialogTitle>Edit profile</TDialogTitle>
					<TDialogDescription>Make changes to your profile here.</TDialogDescription>
				</TDialogHeader>
				<TDialogFooter>
					<TButton variant="outline">Cancel</TButton>
					<TButton>Save</TButton>
				</TDialogFooter>
			</TDialogContent>
		</TDialog>
	);
}
