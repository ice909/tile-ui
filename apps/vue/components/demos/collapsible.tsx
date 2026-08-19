import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@tile-ui/vue';

export default function CollapsibleDemo() {
	return (
		<Collapsible>
			<CollapsibleTrigger class="component-preview__action">Toggle details</CollapsibleTrigger>
			<CollapsibleContent>
				<p class="component-preview__text">This content is hidden until you expand it.</p>
			</CollapsibleContent>
		</Collapsible>
	);
}
