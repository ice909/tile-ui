import { TCollapsible, TCollapsibleTrigger, TCollapsibleContent } from '@tile-ui/vue';

export default function CollapsibleDemo() {
	return (
		<TCollapsible>
			<TCollapsibleTrigger class="component-preview__action">Toggle details</TCollapsibleTrigger>
			<TCollapsibleContent>
				<p class="component-preview__text">This content is hidden until you expand it.</p>
			</TCollapsibleContent>
		</TCollapsible>
	);
}
