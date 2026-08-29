import { generateHydrationScript, renderToString } from 'solid-js/web';
import { toast } from '../../src/components/sonner/sonner';
import { Batch5SonnerHydrationFixture } from './batch5-sonner-hydration';

export function renderBatch5SonnerFixture(requestTitle: string) {
	toast(requestTitle, { duration: 1 });
	const renderId = 'batch5-sonner-';
	return { html: renderToString(() => <Batch5SonnerHydrationFixture />, { renderId }), hydrationScript: generateHydrationScript(), renderId };
}
