import { hydrate } from 'solid-js/web';
import { Batch4SelectionHydrationFixture } from './batch4-selection-hydration';

export function hydrateBatch4SelectionFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch4SelectionHydrationFixture />, container, { renderId });
}
