import { hydrate } from 'solid-js/web';
import { Batch3CalendarHydrationFixture } from './batch3-calendar-hydration';

export function hydrateBatch3CalendarFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch3CalendarHydrationFixture />, container, { renderId });
}
