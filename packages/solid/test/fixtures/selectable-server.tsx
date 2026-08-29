import { generateHydrationScript, renderToString } from 'solid-js/web';
import { SelectableHydrationFixture } from './selectable-hydration';

export function renderSelectableFixture() {
	const renderId = 'batch2-';
	return { html: renderToString(() => <SelectableHydrationFixture />, { renderId }), hydrationScript: generateHydrationScript(), renderId };
}
