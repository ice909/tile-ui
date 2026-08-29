import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch4NavigationMenuHydrationFixture } from './batch4-navigation-menu-hydration';

export function renderBatch4NavigationMenuFixture() {
	const renderId = 'batch4-navigation-menu-';
	return {
		html: renderToString(() => <Batch4NavigationMenuHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
