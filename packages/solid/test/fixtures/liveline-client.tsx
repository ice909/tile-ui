import { hydrate } from 'solid-js/web';
import { LivelineHydrationFixture } from './liveline-hydration';

export function hydrateLivelineFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <LivelineHydrationFixture />, container, { renderId });
}
