import { For } from 'solid-js';
import { ScrollArea, ScrollBar } from '@tile-ui/solid';

export default function ScrollAreaDemo() {
	return (
		<ScrollArea style={{ height: '12rem', width: '100%' }}>
			<div style={{ width: '36rem' }}>
				<For each={Array.from({ length: 18 }, (_, index) => index + 1)}>{(item) => <p>Scrollable registry row {item}</p>}</For>
			</div>
			<ScrollBar />
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	);
}
