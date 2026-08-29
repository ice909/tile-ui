import { createSignal, For } from 'solid-js';
import { render } from 'solid-js/web';
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from '../../src/components/message-scroller/message-scroller';

function BrowserFixture() {
	const [messages, setMessages] = createSignal(Array.from({ length: 12 }, (_, index) => `Message ${index + 1}`));
	return (
		<div style={{ width: '320px', height: '240px' }}>
			<button data-action="prepend" onClick={() => setMessages((current) => ['Prepended', ...current])}>
				Prepend
			</button>
			<button data-action="append" onClick={() => setMessages((current) => [...current, 'Appended'])}>
				Append
			</button>
			<MessageScrollerProvider>
				<MessageScroller>
					<MessageScrollerViewport data-id="browser-viewport" style={{ height: '200px' }}>
						<MessageScrollerContent>
							<For each={messages()}>
								{(message) => (
									<MessageScrollerItem scrollAnchor={message === 'Message 6'} style={{ height: '48px' }}>
										{message}
									</MessageScrollerItem>
								)}
							</For>
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton direction="start" />
					<MessageScrollerButton />
				</MessageScroller>
			</MessageScrollerProvider>
		</div>
	);
}

const root = document.querySelector('#app');
if (!root) throw new Error('Missing browser smoke root.');
render(() => <BrowserFixture />, root);
