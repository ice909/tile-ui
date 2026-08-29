import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from '@tile-ui/solid';

export default function MessageDemo() {
	return (
		<MessageGroup>
			<Message align="start">
				<MessageAvatar aria-hidden="true">TU</MessageAvatar>
				<MessageContent>
					<MessageHeader>Tile UI</MessageHeader>
					Solid registry output is ready for review.
					<MessageFooter>10:42</MessageFooter>
				</MessageContent>
			</Message>
			<Message align="end">
				<MessageContent>Keyboard and SSR checks passed.</MessageContent>
			</Message>
		</MessageGroup>
	);
}
