import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch3CalendarHydrationFixture } from './batch3-calendar-hydration';

export function renderBatch3CalendarFixture() {
	const renderId = 'batch3-calendar-';
	return {
		html: renderToString(() => <Batch3CalendarHydrationFixture />, { renderId }),
		hydrationScript: generateHydrationScript(),
		renderId,
	};
}
