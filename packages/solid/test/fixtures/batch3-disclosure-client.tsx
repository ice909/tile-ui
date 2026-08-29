import { hydrate } from 'solid-js/web';
import { Batch3DisclosureHydrationFixture } from './batch3-disclosure-hydration';

export function hydrateBatch3DisclosureFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch3DisclosureHydrationFixture />, container, { renderId });
}
