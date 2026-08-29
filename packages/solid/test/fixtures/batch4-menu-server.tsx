import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch4MenuHydrationFixture } from './batch4-menu-hydration';

export function renderBatch4MenuFixture() {
	const renderId = 'batch4-menu-';
	return {
		html: renderToString(() => <Batch4MenuHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
