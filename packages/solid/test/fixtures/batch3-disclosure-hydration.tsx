import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../src/components/accordion/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../src/components/collapsible/collapsible';

export function Batch3DisclosureHydrationFixture() {
	return (
		<main data-id="batch3-disclosure-root">
			<Accordion defaultValue="one">
				<AccordionItem value="one" triggerId="custom-accordion-trigger" contentId="custom-accordion-content">
					<AccordionTrigger data-id="accordion-one">One</AccordionTrigger>
					<AccordionContent data-id="accordion-one-content">First</AccordionContent>
				</AccordionItem>
				<AccordionItem value="two" disabled>
					<AccordionTrigger data-id="accordion-two">Two</AccordionTrigger>
					<AccordionContent data-id="accordion-two-content">Second</AccordionContent>
				</AccordionItem>
				<AccordionItem value="three">
					<AccordionTrigger data-id="accordion-three">Three</AccordionTrigger>
					<AccordionContent data-id="accordion-three-content">Third</AccordionContent>
				</AccordionItem>
			</Accordion>
			<Collapsible triggerId="custom-collapsible-trigger" contentId="custom-collapsible-content">
				<CollapsibleTrigger data-id="collapsible-trigger">Toggle</CollapsibleTrigger>
				<CollapsibleContent data-id="collapsible-content">Details</CollapsibleContent>
			</Collapsible>
			<Collapsible>
				<CollapsibleTrigger data-id="generated-collapsible-trigger">Generated toggle</CollapsibleTrigger>
				<CollapsibleContent data-id="generated-collapsible-content">Generated details</CollapsibleContent>
			</Collapsible>
		</main>
	);
}
