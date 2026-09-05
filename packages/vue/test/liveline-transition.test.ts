import { createApp, defineComponent, Fragment, h, nextTick, onMounted, onUnmounted, reactive } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LivelineTransition } from '../src/components/liveline/liveline-transition';

const apps: Array<ReturnType<typeof createApp>> = [];

afterEach(() => {
	for (const app of apps.splice(0)) app.unmount();
	document.body.innerHTML = '';
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('Vue LivelineTransition', () => {
	it('flattens nested v-for Fragments and disposes keyed children', async () => {
		vi.stubGlobal('matchMedia', () => ({ matches: true }));
		const mounted = vi.fn();
		const unmounted = vi.fn();
		const Child = defineComponent({
			props: { id: { type: String, required: true } },
			setup(props) {
				onMounted(() => mounted(props.id));
				onUnmounted(() => unmounted(props.id));
				return () => h('button', props.id);
			},
		});
		const state = reactive({ active: 'b', keys: ['a', 'b'] });
		const container = document.createElement('div');
		const app = createApp({
			render: () =>
				h(LivelineTransition, { active: state.active }, () => [
					h(Fragment, null, [
						h(
							Fragment,
							null,
							state.keys.map((key) => h(Child, { key, id: key })),
						),
					]),
				]),
		});
		apps.push(app);
		app.mount(container);
		expect(container.textContent).toBe('b');
		expect(mounted.mock.calls).toEqual([['b']]);
		state.keys.push('c');
		state.active = 'c';
		await nextTick();
		expect(container.textContent).toBe('c');
		expect(unmounted.mock.calls).toEqual([['b']]);
		state.active = 'b';
		await nextTick();
		expect(mounted.mock.calls).toEqual([['b'], ['c'], ['b']]);
		app.unmount();
		apps.splice(apps.indexOf(app), 1);
		expect(unmounted.mock.calls).toEqual([['b'], ['c'], ['b']]);
	});

	it('settles rapid switches and duration changes on only the active layer', async () => {
		vi.useFakeTimers();
		vi.stubGlobal(
			'matchMedia',
			vi.fn(() => ({ matches: false })),
		);
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn((callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0)),
		);
		vi.stubGlobal(
			'cancelAnimationFrame',
			vi.fn((handle: number) => clearTimeout(handle)),
		);
		const state = reactive({ active: 'a', duration: 300 });
		const container = document.createElement('div');
		document.body.appendChild(container);
		const app = createApp(
			defineComponent({
				setup: () => () =>
					h(LivelineTransition, { active: state.active, duration: state.duration }, () => [
						h('button', { key: 'a' }, 'A'),
						h('button', { key: 'b' }, 'B'),
						h('button', { key: 'c' }, 'C'),
					]),
			}),
		);
		apps.push(app);
		app.mount(container);

		state.active = 'b';
		await nextTick();
		state.active = 'c';
		await nextTick();
		state.duration = 50;
		await nextTick();
		const inactive = Array.from(container.querySelectorAll<HTMLElement>('[data-slot="liveline-transition-layer"]')).find(
			(layer) => layer.getAttribute('aria-hidden') === 'true',
		);
		expect(inactive?.hasAttribute('inert')).toBe(true);
		vi.runAllTimers();
		await nextTick();

		const layers = container.querySelectorAll('[data-slot="liveline-transition-layer"]');
		expect(layers).toHaveLength(1);
		expect(layers[0].textContent).toBe('C');
		expect(layers[0].hasAttribute('inert')).toBe(false);
	});

	it('settles A to B to A and cancels all scheduled work on unmount', async () => {
		vi.useFakeTimers();
		vi.stubGlobal(
			'matchMedia',
			vi.fn(() => ({ matches: false })),
		);
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn((callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0)),
		);
		vi.stubGlobal(
			'cancelAnimationFrame',
			vi.fn((handle: number) => clearTimeout(handle)),
		);
		const state = reactive({ active: 'a' });
		const container = document.createElement('div');
		const app = createApp(
			defineComponent({ setup: () => () => h(LivelineTransition, { active: state.active }, () => [h('div', { key: 'a' }, 'A'), h('div', { key: 'b' }, 'B')]) }),
		);
		apps.push(app);
		app.mount(container);
		state.active = 'b';
		await nextTick();
		state.active = 'a';
		await nextTick();
		vi.runAllTimers();
		await nextTick();
		expect(container.querySelectorAll('[data-slot="liveline-transition-layer"]')).toHaveLength(1);
		expect(container.textContent).toBe('A');
		app.unmount();
		apps.splice(apps.indexOf(app), 1);
		expect(cancelAnimationFrame).toHaveBeenCalled();
		expect(vi.getTimerCount()).toBe(0);
	});

	it('switches immediately when reduced motion is preferred', async () => {
		vi.stubGlobal(
			'matchMedia',
			vi.fn(() => ({ matches: true })),
		);
		const state = reactive({ active: 'line' });
		const container = document.createElement('div');
		document.body.appendChild(container);
		const app = createApp(
			defineComponent({
				setup: () => () => h(LivelineTransition, { active: state.active, class: 'fade' }, () => [h('div', { key: 'line' }, 'Line'), h('div', { key: 'candle' }, 'Candle')]),
			}),
		);
		apps.push(app);
		app.mount(container);

		expect(container.querySelector('[data-slot="liveline-transition"]')?.classList).toContain('fade');
		expect(container.querySelector('[data-slot="liveline-transition-layer"]')?.textContent).toBe('Line');
		state.active = 'candle';
		await nextTick();
		const layers = container.querySelectorAll('[data-slot="liveline-transition-layer"]');
		expect(layers).toHaveLength(1);
		expect(layers[0].textContent).toBe('Candle');
		expect(layers[0].getAttribute('aria-hidden')).toBe('false');
	});
});
