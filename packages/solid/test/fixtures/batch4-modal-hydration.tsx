import { createSignal } from 'solid-js';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '../../src/components/alert-dialog/alert-dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '../../src/components/drawer/drawer';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '../../src/components/sheet/sheet';

export function Batch4ModalClosedFixture() {
	return (
		<main data-id="closed-root">
			<AlertDialog>
				<AlertDialogTrigger data-id="closed-alert-trigger">Alert</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogTitle>Alert title</AlertDialogTitle>
				</AlertDialogContent>
			</AlertDialog>
			<Sheet>
				<SheetTrigger data-id="closed-sheet-trigger">Sheet</SheetTrigger>
				<SheetContent>
					<SheetTitle>Sheet title</SheetTitle>
				</SheetContent>
			</Sheet>
			<Drawer>
				<DrawerTrigger data-id="closed-drawer-trigger">Drawer</DrawerTrigger>
				<DrawerContent>
					<DrawerTitle>Drawer title</DrawerTitle>
				</DrawerContent>
			</Drawer>
		</main>
	);
}

export function Batch4ModalOpenFixture() {
	const [customIds, setCustomIds] = createSignal(false);
	return (
		<main data-id="open-root">
			<AlertDialog defaultOpen>
				<AlertDialogTrigger data-id="open-alert-trigger">Alert</AlertDialogTrigger>
				<AlertDialogContent id={customIds() ? 'changed-alert' : 'ssr-alert'}>
					<AlertDialogTitle id={customIds() ? 'changed-alert-title' : 'ssr-alert-title'}>Alert title</AlertDialogTitle>
					<AlertDialogDescription id={customIds() ? 'changed-alert-description' : 'ssr-alert-description'}>Alert description</AlertDialogDescription>
					<button data-id="change-ids" onClick={() => setCustomIds(true)}>
						Change IDs
					</button>
					<AlertDialogCancel data-id="ssr-cancel">Cancel</AlertDialogCancel>
				</AlertDialogContent>
			</AlertDialog>
			<Sheet defaultOpen>
				<SheetTrigger data-id="open-sheet-trigger">Sheet</SheetTrigger>
				<SheetContent id="ssr-sheet" side="left">
					<SheetTitle>Sheet title</SheetTitle>
					<SheetDescription>Sheet description</SheetDescription>
				</SheetContent>
			</Sheet>
			<Drawer defaultOpen modal={false} direction="bottom">
				<DrawerTrigger data-id="open-drawer-trigger">Drawer</DrawerTrigger>
				<DrawerContent id="ssr-drawer">
					<DrawerTitle>Drawer title</DrawerTitle>
				</DrawerContent>
			</Drawer>
		</main>
	);
}
