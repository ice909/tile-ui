import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '@tile-ui/solid';
export default function BubbleDemo() {
	return (
		<BubbleGroup>
			<Bubble>
				<BubbleContent>Solid primitives are ready.</BubbleContent>
				<BubbleReactions>10:24</BubbleReactions>
			</Bubble>
			<Bubble align="end" variant="secondary">
				<BubbleContent>Ship the registry.</BubbleContent>
			</Bubble>
		</BubbleGroup>
	);
}
