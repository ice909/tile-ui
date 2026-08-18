import { Tooltip, TooltipTrigger, TooltipContent } from '@tile-ui/react';

export default function TooltipDemo() {
	return (
		<Tooltip>
			<TooltipTrigger className="component-preview__action">Hover me</TooltipTrigger>
			<TooltipContent>Helpful context here.</TooltipContent>
		</Tooltip>
	);
}
