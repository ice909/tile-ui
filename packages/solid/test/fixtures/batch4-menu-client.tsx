import { hydrate } from 'solid-js/web';
import { Batch4MenuHydrationFixture } from './batch4-menu-hydration';

export function hydrateBatch4MenuFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch4MenuHydrationFixture />, container, { renderId });
}
