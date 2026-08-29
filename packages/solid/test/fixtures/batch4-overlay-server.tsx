import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch4OverlayHydrationFixture } from './batch4-overlay-hydration';

export function renderBatch4OverlayFixture() {
	const renderId = 'batch4-overlay-';
	return {
		html: renderToString(() => <Batch4OverlayHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
