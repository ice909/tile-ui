import { Popover, PopoverTrigger, PopoverContent } from '@tile-ui/vue';

export default function PopoverDemo() {
	return (
		<Popover>
			<PopoverTrigger class="component-preview__action">Open popover</PopoverTrigger>
			<PopoverContent>
				<p class="component-preview__text">Rich content anchored to the trigger.</p>
			</PopoverContent>
		</Popover>
	);
}
