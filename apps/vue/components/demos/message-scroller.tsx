import { TMessageScrollerProvider, TMessageScroller, TMessageScrollerViewport, TMessageScrollerContent, TMessageScrollerItem, TMessageScrollerButton } from '@tile-ui/vue';

export default function MessageScrollerDemo() {
	return (
		<TMessageScrollerProvider>
			<TMessageScroller style={{ maxHeight: '160px' }}>
				<TMessageScrollerViewport>
					<TMessageScrollerContent>
						{Array.from({ length: 8 }, (_, i) => (
							<TMessageScrollerItem key={i}>
								<p class="component-preview__text">
									Message
									{i + 1}
								</p>
							</TMessageScrollerItem>
						))}
					</TMessageScrollerContent>
				</TMessageScrollerViewport>
				<TMessageScrollerButton direction="start">↑</TMessageScrollerButton>
				<TMessageScrollerButton direction="end">↓</TMessageScrollerButton>
			</TMessageScroller>
		</TMessageScrollerProvider>
	);
}
