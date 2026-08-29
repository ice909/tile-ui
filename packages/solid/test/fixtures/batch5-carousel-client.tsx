import { hydrate } from 'solid-js/web';
import { Batch5CarouselHydrationFixture } from './batch5-carousel-hydration';

export function hydrateBatch5CarouselFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch5CarouselHydrationFixture />, container, { renderId });
}
