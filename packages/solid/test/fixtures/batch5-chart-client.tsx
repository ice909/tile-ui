import { hydrate } from 'solid-js/web';
import { Batch5ChartHydrationFixture } from './batch5-chart-hydration';

export function hydrateBatch5ChartFixture(container: HTMLElement, renderId: string) {
	return hydrate(() => <Batch5ChartHydrationFixture />, container, { renderId });
}
