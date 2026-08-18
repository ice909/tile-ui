import { MessageScrollerProvider, MessageScroller, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem, MessageScrollerButton } from '@tile-ui/react';

export default function MessageScrollerDemo() {
	return (
		<MessageScrollerProvider>
			<MessageScroller style={{ maxHeight: 160 }}>
				<MessageScrollerViewport>
					<MessageScrollerContent>
						{Array.from({ length: 8 }, (_, i) => (
							<MessageScrollerItem key={i}>
								<p className="component-preview__text">Message {i + 1}</p>
							</MessageScrollerItem>
						))}
					</MessageScrollerContent>
				</MessageScrollerViewport>
				<MessageScrollerButton direction="start">↑</MessageScrollerButton>
				<MessageScrollerButton direction="end">↓</MessageScrollerButton>
			</MessageScroller>
		</MessageScrollerProvider>
	);
}
