import { hydrate } from 'solid-js/web';
import { SelectableHydrationFixture } from './selectable-hydration';

export function hydrateSelectableFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <SelectableHydrationFixture />, container, { renderId });
}
