import { BubbleGroup, Bubble, BubbleContent } from '@tile-ui/react';

export default function BubbleDemo() {
	return (
		<BubbleGroup>
			<Bubble align="start">
				<BubbleContent>Hello there</BubbleContent>
			</Bubble>
			<Bubble align="end" variant="tinted">
				<BubbleContent>Hi! How can I help?</BubbleContent>
			</Bubble>
		</BubbleGroup>
	);
}
