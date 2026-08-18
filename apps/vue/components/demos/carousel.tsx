import { TCarousel, TCarouselContent, TCarouselItem, TCarouselPrevious, TCarouselNext } from '@tile-ui/vue';

export default function CarouselDemo() {
	return (
		<TCarousel>
			<TCarouselContent>
				{['Slide one', 'Slide two', 'Slide three'].map((text) => (
					<TCarouselItem key={text}>
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
					</TCarouselItem>
				))}
			</TCarouselContent>
			<TCarouselPrevious />
			<TCarouselNext />
		</TCarousel>
	);
}
