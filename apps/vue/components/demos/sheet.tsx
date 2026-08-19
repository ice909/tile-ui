import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@tile-ui/vue';

export default function SheetDemo() {
	return (
		<Sheet>
			<SheetTrigger class="component-preview__action">Open sheet</SheetTrigger>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Details</SheetTitle>
					<SheetDescription>Supporting details for this panel.</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
}
