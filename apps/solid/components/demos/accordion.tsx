import { createSignal } from 'solid-js';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@tile-ui/solid';

export default function AccordionDemo() {
	const [value, setValue] = createSignal('registry');
	return (
		<div class="component-preview__stack">
			<Accordion value={value()} onValueChange={(next) => setValue(String(next))} collapsible>
				<AccordionItem value="registry" triggerId="demo-accordion-registry-trigger" contentId="demo-accordion-registry-content">
					<AccordionTrigger>Registry source</AccordionTrigger>
					<AccordionContent>Installable Solid source with shared core logic and Sass.</AccordionContent>
				</AccordionItem>
				<AccordionItem value="disabled" disabled>
					<AccordionTrigger>Unavailable lane</AccordionTrigger>
					<AccordionContent>This trigger is skipped by arrow-key navigation.</AccordionContent>
				</AccordionItem>
				<AccordionItem value="keyboard">
					<AccordionTrigger>Keyboard behavior</AccordionTrigger>
					<AccordionContent>Use Arrow Up, Arrow Down, Home, and End between triggers.</AccordionContent>
				</AccordionItem>
			</Accordion>
			<p class="component-preview__text">Open section: {value() || 'none'}</p>
		</div>
	);
}
