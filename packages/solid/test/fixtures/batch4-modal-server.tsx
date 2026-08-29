import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch4ModalClosedFixture, Batch4ModalOpenFixture } from './batch4-modal-hydration';

export function renderBatch4ModalClosedFixture() {
	const renderId = 'batch4-modal-closed-';
	return { html: renderToString(() => <Batch4ModalClosedFixture />, { renderId }), hydrationScript: generateHydrationScript(), renderId };
}

export function renderBatch4ModalOpenFixture() {
	const renderId = 'batch4-modal-open-';
	return { html: renderToString(() => <Batch4ModalOpenFixture />, { renderId }), hydrationScript: generateHydrationScript(), renderId };
}
