import { TTooltip, TTooltipTrigger, TTooltipContent } from '@tile-ui/vue';

export default function TooltipDemo() {
	return (
		<TTooltip>
			<TTooltipTrigger class="component-preview__action">Hover me</TTooltipTrigger>
			<TTooltipContent>Helpful context here.</TTooltipContent>
		</TTooltip>
	);
}
