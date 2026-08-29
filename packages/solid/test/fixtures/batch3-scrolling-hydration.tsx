import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from '../../src/components/message-scroller/message-scroller';
import { ScrollArea, ScrollBar } from '../../src/components/scroll-area/scroll-area';

export function Batch3ScrollingHydrationFixture() {
	return (
		<main data-id="batch3-scrolling-root">
			<ScrollArea data-id="scroll-area">
				<div data-id="scroll-area-content">Wide and tall content</div>
				<ScrollBar data-id="vertical-bar" />
				<ScrollBar data-id="horizontal-bar" orientation="horizontal" />
			</ScrollArea>
			<MessageScrollerProvider>
				<MessageScroller data-id="message-scroller">
					<MessageScrollerViewport data-id="message-viewport">
						<MessageScrollerContent data-id="message-content">
							<MessageScrollerItem scrollAnchor>Message</MessageScrollerItem>
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton direction="start" />
					<MessageScrollerButton />
				</MessageScroller>
			</MessageScrollerProvider>
		</main>
	);
}
