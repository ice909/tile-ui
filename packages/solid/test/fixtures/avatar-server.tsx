import { generateHydrationScript, renderToString } from 'solid-js/web';
import { AvatarHydrationFixture } from './avatar-hydration';

export function renderAvatarFixture() {
	const renderId = 'tile-avatar-test-';
	return { html: renderToString(() => <AvatarHydrationFixture />, { renderId }), hydrationScript: generateHydrationScript(), renderId };
}
