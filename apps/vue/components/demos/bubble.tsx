import { TBubbleGroup, TBubble, TBubbleContent } from '@tile-ui/vue';

export default function BubbleDemo() {
	return (
		<TBubbleGroup>
			<TBubble align="start">
				<TBubbleContent>Hello there</TBubbleContent>
			</TBubble>
			<TBubble align="end" variant="tinted">
				<TBubbleContent>Hi! How can I help?</TBubbleContent>
			</TBubble>
		</TBubbleGroup>
	);
}
