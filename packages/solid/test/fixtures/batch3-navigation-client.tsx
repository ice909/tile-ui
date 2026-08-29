import { hydrate } from 'solid-js/web';
import { Batch3NavigationHydrationFixture } from './batch3-navigation-hydration';

export function hydrateBatch3NavigationFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch3NavigationHydrationFixture />, container, { renderId });
}
