import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@tile-ui/solid';

export default function DialogDemo() {
	return (
		<Dialog>
			<DialogTrigger class="component-preview__action">Open Solid dialog</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Hydrated interaction</DialogTitle>
					<DialogDescription>This content portals only when opened and remains safe during server rendering.</DialogDescription>
				</DialogHeader>
				<DialogFooter showCloseButton>
					<Button>Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
