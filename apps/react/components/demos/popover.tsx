import { Popover, PopoverTrigger, PopoverContent } from '@tile-ui/react';

export default function PopoverDemo() {
	return (
		<Popover>
			<PopoverTrigger className="component-preview__action">Open popover</PopoverTrigger>
			<PopoverContent>
				<div style={{ display: 'grid', gap: 8 }}>
					<p className="component-preview__text">Rich content anchored to the trigger.</p>
				</div>
			</PopoverContent>
		</Popover>
	);
}
