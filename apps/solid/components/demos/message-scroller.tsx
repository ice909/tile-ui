import { For, createSignal } from 'solid-js';
import { Button, MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from '@tile-ui/solid';

export default function MessageScrollerDemo() {
	const [mounted, setMounted] = createSignal(true);
	const [messages, setMessages] = createSignal(Array.from({ length: 12 }, (_, index) => `Message ${index + 1}`));
	return (
		<div class="component-preview__stack">
			<div>
				<Button size="sm" variant="outline" onClick={() => setMessages((items) => [...items, `Message ${items.length + 1}`])}>
					Add message
				</Button>{' '}
				<Button size="sm" variant="outline" onClick={() => setMounted((value) => !value)}>
					{mounted() ? 'Unmount' : 'Remount'} scroller
				</Button>
			</div>
			{mounted() && (
				<MessageScrollerProvider>
					<MessageScroller style={{ height: '12rem' }}>
						<MessageScrollerViewport style={{ height: '100%', overflow: 'auto' }}>
							<MessageScrollerContent>
								<For each={messages()}>
									{(message, index) => <MessageScrollerItem scrollAnchor={index() === messages().length - 1}>{message}</MessageScrollerItem>}
								</For>
							</MessageScrollerContent>
						</MessageScrollerViewport>
						<MessageScrollerButton direction="start" />
						<MessageScrollerButton direction="end" />
					</MessageScroller>
				</MessageScrollerProvider>
			)}
		</div>
	);
}
