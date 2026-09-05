import { generateHydrationScript, renderToString } from 'solid-js/web';
import { LivelineHydrationFixture } from './liveline-hydration';

export function renderLivelineFixture() {
	const renderId = 'liveline-';
	return { html: renderToString(() => <LivelineHydrationFixture />, { renderId }), hydrationScript: generateHydrationScript(), renderId };
}
