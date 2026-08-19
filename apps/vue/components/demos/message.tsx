import { MessageGroup, Message, MessageContent } from '@tile-ui/vue';

export default function MessageDemo() {
	return (
		<MessageGroup>
			<Message align="end">
				<MessageContent>Hi there</MessageContent>
			</Message>
			<Message align="start">
				<MessageContent>Hey! What can I help with?</MessageContent>
			</Message>
		</MessageGroup>
	);
}
