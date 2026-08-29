import { generateHydrationScript, renderToString } from 'solid-js/web';
import { Batch5ChartHydrationFixture } from './batch5-chart-hydration';

export function renderBatch5ChartFixture() {
	const renderId = 'batch5-chart-';
	return { html: renderToString(() => <Batch5ChartHydrationFixture />, { renderId }), hydrationScript: generateHydrationScript(), renderId };
}
