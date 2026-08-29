import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch5CarouselHydrationFixture } from './batch5-carousel-hydration';

export function renderBatch5CarouselFixture() {
	const renderId = 'batch5-carousel-';
	return {
		html: renderToString(() => <Batch5CarouselHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
