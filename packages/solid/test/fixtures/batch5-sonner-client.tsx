import { hydrate } from 'solid-js/web';
import { Batch5SonnerHydrationFixture } from './batch5-sonner-hydration';

export function hydrateBatch5SonnerFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch5SonnerHydrationFixture />, container, { renderId });
}
