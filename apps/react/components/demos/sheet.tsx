import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@tile-ui/react';

export default function SheetDemo() {
	return (
		<Sheet>
			<SheetTrigger className="component-preview__action">Open sheet</SheetTrigger>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Details</SheetTitle>
					<SheetDescription>Supporting details for this panel.</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
}
