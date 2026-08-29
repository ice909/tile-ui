import { hydrate } from 'solid-js/web';
import { AvatarHydrationFixture } from './avatar-hydration';

export function hydrateAvatarFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <AvatarHydrationFixture />, container, { renderId });
}
