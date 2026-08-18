import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@tile-ui/react';

export default function CollapsibleDemo() {
	return (
		<Collapsible>
			<CollapsibleTrigger className="component-preview__action">Toggle details</CollapsibleTrigger>
			<CollapsibleContent>
				<p className="component-preview__text">This content is hidden until you expand it.</p>
			</CollapsibleContent>
		</Collapsible>
	);
}
