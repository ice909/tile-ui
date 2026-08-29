import { generateHydrationScript, renderToString } from 'solid-js/web';
import { FormHydrationFixture } from './form-hydration';

export function renderFormFixture() {
	const renderId = 'tile-form-test-';
	return { html: renderToString(() => <FormHydrationFixture />, { renderId }), hydrationScript: generateHydrationScript(), renderId };
}
