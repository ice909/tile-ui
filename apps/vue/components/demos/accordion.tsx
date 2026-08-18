import { TAccordion, TAccordionItem, TAccordionTrigger, TAccordionContent } from '@tile-ui/vue';

export default function AccordionDemo() {
	return (
		<TAccordion type="single" collapsible defaultValue="one">
			<TAccordionItem value="one">
				<TAccordionTrigger>Section one</TAccordionTrigger>
				<TAccordionContent>
					<p class="component-preview__text">Content one.</p>
				</TAccordionContent>
			</TAccordionItem>
			<TAccordionItem value="two">
				<TAccordionTrigger>Section two</TAccordionTrigger>
				<TAccordionContent>
					<p class="component-preview__text">Content two.</p>
				</TAccordionContent>
			</TAccordionItem>
		</TAccordion>
	);
}
