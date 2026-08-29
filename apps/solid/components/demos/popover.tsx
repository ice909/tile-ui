import { createSignal } from 'solid-js';
import { Popover, PopoverContent, PopoverTrigger } from '@tile-ui/solid';

export default function PopoverDemo() {
	const [open, setOpen] = createSignal(false);
	return (
		<div class="component-preview__stack" data-demo-popover>
			<Popover open={open()} onOpenChange={setOpen}>
				<PopoverTrigger class="component-preview__action">Edit release</PopoverTrigger>
				<PopoverContent>
					<label for="popover-title">Release title</label>
					<input id="popover-title" value="August release" />
					<button type="button" onClick={() => setOpen(false)}>
						Apply
					</button>
				</PopoverContent>
			</Popover>
			<p data-demo-state>{open() ? 'Open: Tab moves through the input and Apply button.' : 'Closed: focus returns to the trigger.'}</p>
		</div>
	);
}
