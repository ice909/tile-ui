import { hydrate } from 'solid-js/web';
import { Batch3ScrollingHydrationFixture } from './batch3-scrolling-hydration';

export function hydrateBatch3ScrollingFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch3ScrollingHydrationFixture />, container, { renderId });
}
