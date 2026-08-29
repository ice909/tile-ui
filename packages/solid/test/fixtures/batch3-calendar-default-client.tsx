import { hydrate } from 'solid-js/web';
import { Batch3CalendarDefaultHydrationFixture } from './batch3-calendar-default-hydration';

export function hydrateBatch3CalendarDefaultFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch3CalendarDefaultHydrationFixture />, container, { renderId });
}
