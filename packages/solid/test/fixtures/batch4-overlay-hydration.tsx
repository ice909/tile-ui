import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../src/components/hover-card/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '../../src/components/popover/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../src/components/tooltip/tooltip';

export function Batch4OverlayHydrationFixture() {
	return (
		<div data-id="batch4-overlay-root">
			<TooltipProvider delayDuration={0}>
				<Tooltip contentId="ssr-tooltip-content">
					<TooltipTrigger data-id="tooltip-trigger">Tooltip</TooltipTrigger>
					<TooltipContent data-id="tooltip-content">Tooltip content</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<HoverCard defaultOpen contentId="ssr-hover-content">
				<HoverCardTrigger data-id="hover-trigger">Hover</HoverCardTrigger>
				<HoverCardContent data-id="hover-content">Hover content</HoverCardContent>
			</HoverCard>
			<Popover triggerId="ssr-popover-trigger" contentId="ssr-popover-content">
				<PopoverTrigger data-id="popover-trigger">Popover</PopoverTrigger>
				<PopoverContent data-id="popover-content">Popover content</PopoverContent>
			</Popover>
			<Popover defaultOpen triggerId="ssr-open-trigger" contentId="ssr-open-content">
				<PopoverTrigger data-id="open-trigger">Open popover</PopoverTrigger>
				<PopoverContent data-id="open-content">Open content</PopoverContent>
			</Popover>
		</div>
	);
}
