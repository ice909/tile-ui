import { hydrate } from 'solid-js/web';
import { Batch4NavigationMenuHydrationFixture } from './batch4-navigation-menu-hydration';

export function hydrateBatch4NavigationMenuFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch4NavigationMenuHydrationFixture />, container, { renderId });
}
