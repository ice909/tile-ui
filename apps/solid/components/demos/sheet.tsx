import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@tile-ui/solid';

export default function SheetDemo() {
	return (
		<Sheet>
			<SheetTrigger class="component-preview__action">Open settings sheet</SheetTrigger>
			<SheetContent side="right" data-demo-sheet>
				<SheetHeader>
					<SheetTitle>Workspace settings</SheetTitle>
					<SheetDescription>The modal sheet traps focus, blocks outside clicks, and restores the trigger.</SheetDescription>
				</SheetHeader>
				<label for="sheet-name">Name</label>
				<input id="sheet-name" value="Solid registry" />
				<SheetFooter>
					<SheetClose>Save and close</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
