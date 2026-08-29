import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch5SidebarHydrationFixture } from './batch5-sidebar-hydration';

export function renderBatch5SidebarFixture() {
	const renderId = 'batch5-sidebar-';
	return {
		html: renderToString(() => <Batch5SidebarHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
