import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch3ScrollingHydrationFixture } from './batch3-scrolling-hydration';

export function renderBatch3ScrollingFixture() {
	const renderId = 'batch3-scrolling-';
	return {
		html: renderToString(() => <Batch3ScrollingHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
