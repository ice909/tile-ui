import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch3DisclosureHydrationFixture } from './batch3-disclosure-hydration';

export function renderBatch3DisclosureFixture() {
	const renderId = 'batch3-disclosure-';
	return {
		html: renderToString(() => <Batch3DisclosureHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
