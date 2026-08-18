import { TSheet, TSheetTrigger, TSheetContent, TSheetHeader, TSheetTitle, TSheetDescription } from '@tile-ui/vue';

export default function SheetDemo() {
	return (
		<TSheet>
			<TSheetTrigger class="component-preview__action">Open sheet</TSheetTrigger>
			<TSheetContent side="right">
				<TSheetHeader>
					<TSheetTitle>Details</TSheetTitle>
					<TSheetDescription>Supporting details for this panel.</TSheetDescription>
				</TSheetHeader>
			</TSheetContent>
		</TSheet>
	);
}
