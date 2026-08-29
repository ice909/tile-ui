import { hydrate } from 'solid-js/web';
import { Batch4OverlayHydrationFixture } from './batch4-overlay-hydration';

export function hydrateBatch4OverlayFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch4OverlayHydrationFixture />, container, { renderId });
}
