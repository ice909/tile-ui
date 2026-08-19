import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@tile-ui/vue';

export default function AccordionDemo() {
	return (
		<Accordion type="single" collapsible defaultValue="one">
			<AccordionItem value="one">
				<AccordionTrigger>Section one</AccordionTrigger>
				<AccordionContent>
					<p class="component-preview__text">Content one.</p>
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="two">
				<AccordionTrigger>Section two</AccordionTrigger>
				<AccordionContent>
					<p class="component-preview__text">Content two.</p>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
