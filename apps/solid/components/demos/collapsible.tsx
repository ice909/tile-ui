import { createSignal } from 'solid-js';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@tile-ui/solid';

export default function CollapsibleDemo() {
	const [open, setOpen] = createSignal(false);
	return (
		<div class="component-preview__stack">
			<Collapsible open={open()} onOpenChange={setOpen} triggerId="demo-collapsible-trigger" contentId="demo-collapsible-content">
				<CollapsibleTrigger>{open() ? 'Hide' : 'Show'} registry details</CollapsibleTrigger>
				<CollapsibleContent>Core logic, Solid source, and module Sass install recursively.</CollapsibleContent>
			</Collapsible>
			<p class="component-preview__text">State: {open() ? 'open' : 'closed'}</p>
		</div>
	);
}
