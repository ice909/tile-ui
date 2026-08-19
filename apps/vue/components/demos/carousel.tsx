import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@tile-ui/vue';

export default function CarouselDemo() {
	return (
		<Carousel>
			<CarouselContent>
				{['Slide one', 'Slide two', 'Slide three'].map((text) => (
					<CarouselItem key={text}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								height: '160px',
								borderRadius: '0.5rem',
								background: 'var(--docs-surface-hover)',
							}}>
							<p class="component-preview__text">{text}</p>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious />
			<CarouselNext />
		</Carousel>
	);
}
