import { hydrate } from 'solid-js/web';
import { HydrationFixture } from './hydration';

export function hydrateFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <HydrationFixture />, container, { renderId });
}
