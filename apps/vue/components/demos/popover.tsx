import { TPopover, TPopoverTrigger, TPopoverContent } from '@tile-ui/vue';

export default function PopoverDemo() {
	return (
		<TPopover>
			<TPopoverTrigger class="component-preview__action">Open popover</TPopoverTrigger>
			<TPopoverContent>
				<p class="component-preview__text">Rich content anchored to the trigger.</p>
			</TPopoverContent>
		</TPopover>
	);
}
