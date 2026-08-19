import { Tooltip, TooltipTrigger, TooltipContent } from '@tile-ui/vue';

export default function TooltipDemo() {
	return (
		<Tooltip>
			<TooltipTrigger class="component-preview__action">Hover me</TooltipTrigger>
			<TooltipContent>Helpful context here.</TooltipContent>
		</Tooltip>
	);
}
