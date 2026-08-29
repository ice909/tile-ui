import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch3CalendarDefaultHydrationFixture } from './batch3-calendar-default-hydration';

export function renderBatch3CalendarDefaultFixture() {
	const renderId = 'batch3-calendar-default-';
	return {
		html: renderToString(() => <Batch3CalendarDefaultHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
