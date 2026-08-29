import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@tile-ui/solid';

export default function TooltipDemo() {
	return (
		<TooltipProvider delayDuration={500}>
			<div class="component-preview__row" data-demo-tooltip>
				<Tooltip>
					<TooltipTrigger class="component-preview__action">Hover slowly</TooltipTrigger>
					<TooltipContent side="top">Opens after 500 ms and closes on pointer leave.</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger class="component-preview__action">Focus instantly</TooltipTrigger>
					<TooltipContent side="bottom">Keyboard focus opens without a pointer.</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}
