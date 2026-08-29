import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch2InteractionHydrationFixture } from './batch2-interaction-hydration';

export function renderBatch2InteractionFixture() {
	const renderId = 'batch2-interaction-';
	return {
		html: renderToString(() => <Batch2InteractionHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
