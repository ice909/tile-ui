import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../../src/components/carousel/carousel';

export function Batch5CarouselHydrationFixture() {
	return (
		<Carousel aria-label="Hydration carousel" data-id="hydration-carousel">
			<CarouselContent data-id="hydration-content">
				<CarouselItem>First</CarouselItem>
				<CarouselItem>Second</CarouselItem>
			</CarouselContent>
			<CarouselPrevious data-id="hydration-previous" />
			<CarouselNext data-id="hydration-next" />
		</Carousel>
	);
}
