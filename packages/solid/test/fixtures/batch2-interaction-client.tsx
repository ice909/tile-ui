import { hydrate } from 'solid-js/web';
import { Batch2InteractionHydrationFixture } from './batch2-interaction-hydration';

export function hydrateBatch2InteractionFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch2InteractionHydrationFixture />, container, { renderId });
}
