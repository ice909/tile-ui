import { TMessageGroup, TMessage, TMessageContent } from '@tile-ui/vue';

export default function MessageDemo() {
	return (
		<TMessageGroup>
			<TMessage align="end">
				<TMessageContent>Hi there</TMessageContent>
			</TMessage>
			<TMessage align="start">
				<TMessageContent>Hey! What can I help with?</TMessageContent>
			</TMessage>
		</TMessageGroup>
	);
}
