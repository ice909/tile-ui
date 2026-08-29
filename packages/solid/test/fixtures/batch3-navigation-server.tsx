import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch3NavigationHydrationFixture } from './batch3-navigation-hydration';

export function renderBatch3NavigationFixture() {
	const renderId = 'batch3-navigation-';
	return {
		html: renderToString(() => <Batch3NavigationHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
