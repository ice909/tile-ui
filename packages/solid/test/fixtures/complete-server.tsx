import { generateHydrationScript, renderToString } from 'solid-js/web';
import { CompleteAdvancedFixture } from './complete-advanced';
import { CompleteFoundationFixture } from './complete-foundation';
import { CompleteOverlaysFixture } from './complete-overlays';

const fixtures = { advanced: CompleteAdvancedFixture, foundation: CompleteFoundationFixture, overlays: CompleteOverlaysFixture };

export function renderCompleteFixture(name: keyof typeof fixtures, renderId: string) {
	const Fixture = fixtures[name];
	return { html: renderToString(() => <Fixture namespace={renderId} />, { renderId }), hydrationScript: generateHydrationScript(), renderId };
}
