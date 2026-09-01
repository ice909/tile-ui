import { MessageScrollerProvider, MessageScroller, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem, MessageScrollerButton } from '@tile-ui/vue';

export default function MessageScrollerDemo() {
	return (
		<MessageScrollerProvider>
			<MessageScroller style={{ maxHeight: '160px' }}>
				<MessageScrollerViewport>
					<MessageScrollerContent>
						{Array.from({ length: 8 }, (_, i) => (
							<MessageScrollerItem key={i}>
								<p class="component-preview__text">
									Message
									{i + 1}
								</p>
							</MessageScrollerItem>
						))}
					</MessageScrollerContent>
				</MessageScrollerViewport>
				<MessageScrollerButton direction="start" />
				<MessageScrollerButton direction="end" />
			</MessageScroller>
		</MessageScrollerProvider>
	);
}
