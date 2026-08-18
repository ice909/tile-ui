import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@tile-ui/react';

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
								height: 160,
								borderRadius: '0.5rem',
								background: 'var(--docs-surface-hover)',
							}}>
							<p className="component-preview__text">{text}</p>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious />
			<CarouselNext />
		</Carousel>
	);
}
