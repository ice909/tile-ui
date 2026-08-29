import { generateHydrationScript, renderToString } from 'solid-js/web';
import { HydrationFixture } from './hydration';

export function renderFixture() {
	const renderId = 'tile-test-';
	return {
		html: renderToString(() => <HydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
