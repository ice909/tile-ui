import { hydrate } from 'solid-js/web';
import { FormHydrationFixture } from './form-hydration';

export function hydrateFormFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <FormHydrationFixture />, container, { renderId });
}
