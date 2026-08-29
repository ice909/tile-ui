import { createApp, defineComponent, h, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SONNER_DISMISS_DURATION, type SonnerStore } from '@tile-ui/core';
import { Toaster, toast } from '../src/components/sonner/sonner';

const apps: Array<ReturnType<typeof createApp>> = [];

function mount(props: Record<string, unknown>) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	const app = createApp(defineComponent({ setup: () => () => h(Toaster, props) }));
	apps.push(app);
	app.mount(container);
	return { app, container };
}

afterEach(() => {
	toast.dismissAll();
	if (vi.isFakeTimers()) vi.runOnlyPendingTimers();
	for (const app of apps.splice(0)) app.unmount();
	document.body.innerHTML = '';
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('Vue Sonner ownership', () => {
	it('renders one singleton toast through the last mounted Toaster and hands off on unmount', async () => {
		vi.useFakeTimers();
		const first = mount({ duration: 100, class: 'first-owner' });
		const second = mount({ duration: 300, class: 'second-owner' });
		toast.success('Owned', { duration: 0 });
		await nextTick();
		expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(1);
		expect(document.querySelector('.second-owner [data-slot="toast"]')?.textContent).toContain('Owned');
		expect(document.querySelector('.first-owner [data-slot="toast"]')).toBeNull();

		second.app.unmount();
		apps.splice(apps.indexOf(second.app), 1);
		await nextTick();
		expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(1);
		expect(document.querySelector('.first-owner [data-slot="toast"]')?.textContent).toContain('Owned');

		toast.dismissAll();
		vi.advanceTimersByTime(SONNER_DISMISS_DURATION);
		toast('Restored duration');
		vi.advanceTimersByTime(99);
		await nextTick();
		expect(document.querySelector('[data-slot="toast"]')?.getAttribute('data-dismissing')).not.toBe('true');
		vi.advanceTimersByTime(1);
		await nextTick();
		expect(document.querySelector('[data-slot="toast"]')?.getAttribute('data-dismissing')).toBe('true');
		first.app.config.warnHandler = undefined;
	});

	it('emits per-toast rich color overrides', async () => {
		vi.useFakeTimers();
		mount({ richColors: true, class: 'rich-owner' });
		toast.success('Inherited', { duration: 0, description: 'Rich description' });
		toast.error('Plain', { duration: 0, richColors: false });
		toast.info('Rich', { duration: 0, richColors: true });
		toast.warning('Warning', { duration: 0 });
		await nextTick();
		const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-slot="toast"]'));
		expect(nodes.map((node) => node.dataset.richColors)).toEqual([undefined, 'false', 'true', undefined]);
		expect(document.querySelector('[data-slot="toaster"]')?.getAttribute('data-rich-colors')).toBe('true');
		expect([nodes[0].role, nodes[0].ariaLive, nodes[0].ariaAtomic]).toEqual(['status', 'polite', 'true']);
		expect([nodes[1].role, nodes[1].ariaLive, nodes[1].ariaAtomic]).toEqual(['alert', 'assertive', 'true']);
		expect([nodes[3].role, nodes[3].ariaLive, nodes[3].ariaAtomic]).toEqual(['alert', 'assertive', 'true']);
		expect(nodes[0].textContent).toContain('Rich description');
		expect(nodes[0].querySelector('button[aria-label="关闭"]')).not.toBeNull();
	});

	it('keeps the framework store compatible with immutable update patches', () => {
		const accept = (_store: SonnerStore) => undefined;
		// @ts-expect-error Toast IDs are immutable across framework adapters.
		const invalid: Parameters<SonnerStore['update']>[1] = { id: 'unsafe' };
		// @ts-expect-error Toast dismissal state is store-managed.
		const invalidLifecycle: Parameters<SonnerStore['update']>[1] = { dismissing: true };
		expect([accept, invalid, invalidLifecycle]).toHaveLength(3);
	});
});
