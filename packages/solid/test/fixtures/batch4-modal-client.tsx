import { hydrate } from 'solid-js/web';
import { Batch4ModalClosedFixture, Batch4ModalOpenFixture } from './batch4-modal-hydration';

export function hydrateBatch4ModalClosedFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch4ModalClosedFixture />, container, { renderId });
}

export function hydrateBatch4ModalOpenFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch4ModalOpenFixture />, container, { renderId });
}
