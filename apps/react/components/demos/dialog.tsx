import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from '@tile-ui/react';

export default function DialogDemo() {
	return (
		<Dialog>
			<DialogTrigger className="component-preview__action">Open dialog</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit profile</DialogTitle>
					<DialogDescription>Make changes to your profile here.</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline">Cancel</Button>
					<Button>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
