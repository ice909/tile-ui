import { hydrate } from 'solid-js/web';
import { CompleteAdvancedFixture } from './complete-advanced';
import { CompleteFoundationFixture } from './complete-foundation';
import { CompleteOverlaysFixture } from './complete-overlays';

const fixtures = { advanced: CompleteAdvancedFixture, foundation: CompleteFoundationFixture, overlays: CompleteOverlaysFixture };

export function hydrateCompleteFixture(name: keyof typeof fixtures, container: HTMLElement, renderId: string) {
	const Fixture = fixtures[name];
	return hydrate(() => <Fixture namespace={renderId} />, container, { renderId });
}
