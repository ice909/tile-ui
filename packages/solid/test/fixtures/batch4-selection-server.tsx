import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch4SelectionHydrationFixture } from './batch4-selection-hydration';

export function renderBatch4SelectionFixture() {
	const renderId = 'batch4-selection-';
	return { html: renderToString(() => <Batch4SelectionHydrationFixture />, { renderId }), hydrationScript: generateHydrationScript(), renderId };
}
