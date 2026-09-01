import { Bubble, BubbleContent, Message, MessageContent, MessageGroup } from '@tile-ui/solid';

export default function MessageDemo() {
	return (
		<MessageGroup>
			<Message align="end">
				<MessageContent>
					<Bubble align="end">
						<BubbleContent>Hi there</BubbleContent>
					</Bubble>
				</MessageContent>
			</Message>
			<Message align="start">
				<MessageContent>
					<Bubble variant="muted">
						<BubbleContent>Hey! What can I help with?</BubbleContent>
					</Bubble>
				</MessageContent>
			</Message>
		</MessageGroup>
	);
}
