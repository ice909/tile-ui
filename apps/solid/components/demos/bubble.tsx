import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '@tile-ui/solid';
export default function BubbleDemo() {
	return (
		<BubbleGroup>
			<Bubble align="start">
				<BubbleContent>Solid primitives are ready.</BubbleContent>
				<BubbleReactions aria-label="One approval">✓ 1</BubbleReactions>
			</Bubble>
			<Bubble align="end" variant="tinted">
				<BubbleContent>Ship the registry.</BubbleContent>
			</Bubble>
		</BubbleGroup>
	);
}
