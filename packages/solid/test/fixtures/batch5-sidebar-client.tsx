import { hydrate } from 'solid-js/web';
import { Batch5SidebarHydrationFixture } from './batch5-sidebar-hydration';

export function hydrateBatch5SidebarFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch5SidebarHydrationFixture />, container, { renderId });
}
