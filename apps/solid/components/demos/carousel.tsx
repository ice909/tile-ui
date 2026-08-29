import { createSignal, For } from 'solid-js';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@tile-ui/solid';

function DemoCarousel(props: { orientation: 'horizontal' | 'vertical'; label: string }) {
	return (
		<Carousel aria-label={props.label} orientation={props.orientation} tabIndex={0} style={props.orientation === 'vertical' ? { width: '16rem' } : { width: '22rem' }}>
			<CarouselContent viewportStyle={props.orientation === 'vertical' ? { height: '10rem' } : undefined}>
				<For each={['Registry source', 'Keyboard navigation', 'Responsive measurement']}>
					{(title) => (
						<CarouselItem>
							<div style={{ display: 'grid', height: '10rem', 'place-items': 'center', border: '1px solid currentColor', 'border-radius': '0.75rem' }}>{title}</div>
						</CarouselItem>
					)}
				</For>
			</CarouselContent>
			<CarouselPrevious />
			<CarouselNext />
		</Carousel>
	);
}

export default function CarouselDemo() {
	const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal');
	return (
		<div class="component-preview__stack">
			<button type="button" onClick={() => setOrientation((current) => (current === 'horizontal' ? 'vertical' : 'horizontal'))}>
				Use {orientation() === 'horizontal' ? 'vertical' : 'horizontal'} orientation
			</button>
			<DemoCarousel orientation={orientation()} label={`${orientation()} feature carousel`} />
			<p class="component-preview__text">Use the visible controls or focus the labeled Carousel region and press the orientation-matched arrow keys.</p>
		</div>
	);
}
