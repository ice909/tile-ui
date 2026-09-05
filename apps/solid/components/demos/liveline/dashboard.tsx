import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { Liveline } from '@tile-ui/solid';
import { appendDemoTick, demoWindows, livelineDemoCss, seedDemoFeed, seriesColors, type DemoFeed, type DemoState, type Volatility } from '../../../../common/lib/liveline-demo';
function siteTheme(): 'dark' | 'light' {
	if (typeof document === 'undefined') return 'light';
	const root = document.documentElement;
	if (root.dataset.theme === 'dark' || root.classList.contains('dark')) return 'dark';
	if (root.dataset.theme === 'light' || root.classList.contains('light')) return 'light';
	return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export default function LivelineDemo() {
	const [feeds, setFeeds] = createSignal<DemoFeed[]>([]);
	const [state, setState] = createSignal<DemoState>('live');
	const [paused, setPaused] = createSignal(false);
	const [theme, setTheme] = createSignal<'dark' | 'light'>('light');
	const [volatility, setVolatility] = createSignal<Volatility>('normal');
	const [cadence, setCadence] = createSignal(300);
	const [windowSecs, setWindowSecs] = createSignal(30);
	const [fill, setFill] = createSignal(true);
	const [momentum, setMomentum] = createSignal(true);
	const [grid, setGrid] = createSignal(true);
	const [pulse, setPulse] = createSignal(true);
	const [scrub, setScrub] = createSignal(true);

	const [, setWindowStyle] = createSignal<'default' | 'rounded' | 'text'>('default');

	const seed = () => {
		const now = Date.now() / 1000;
		return Array.from({ length: 4 }, (_, i) => seedDemoFeed(now, [1240, 48, 72, 99.9][i], 42 + i * 7919, 360));
	};
	const tick = () => setFeeds((current) => current.map((feed) => appendDemoTick(feed, Date.now() / 1000, volatility())));
	const changeState = (next: DemoState) => {
		setPaused(false);
		setFeeds(next === 'live' ? seed() : []);
		setState(next);
	};
	onMount(() => {
		setFeeds(seed());
		const root = document.documentElement;
		const media = window.matchMedia?.('(prefers-color-scheme: dark)');
		const updateTheme = () => setTheme(siteTheme());
		const observer = new MutationObserver(updateTheme);
		observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
		media?.addEventListener('change', updateTheme);
		updateTheme();
		onCleanup(() => {
			observer.disconnect();
			media?.removeEventListener('change', updateTheme);
		});
	});
	createEffect(() => {
		if (state() !== 'live' || paused()) return;
		const interval = window.setInterval(tick, cadence());
		onCleanup(() => window.clearInterval(interval));
	});
	const data = () => feeds()[0]?.data ?? [];

	const windows = demoWindows;
	const common = () => ({
		theme: theme(),
		window: windowSecs(),
		loading: state() === 'loading',
		paused: paused(),
		fill: fill(),
		momentum: momentum(),
		grid: grid(),
		pulse: pulse(),
		scrub: scrub(),
		emptyText: 'No data to display',
	});
	return (
		<section class="ll-demo" data-theme={theme()} style={{ 'margin-bottom': '24px' }} aria-label={`${'Dashboard'} demo`}>
			<style>{livelineDemoCss}</style>
			<header class="ll-header">
				<div>
					<h3>{'Dashboard'}</h3>
					<p>{'Quiet, compact telemetry. Each metric has its own feed.'}</p>
				</div>
			</header>
			<div class="ll-controls" role="group" aria-label={`${'Dashboard'} feed state`}>
				<span>State</span>
				{(['live', 'loading', 'empty'] as const).map((item) => (
					<button type="button" aria-pressed={state() === item} onClick={() => changeState(item)}>
						{item === 'live' ? 'Live' : item === 'loading' ? 'Loading' : 'Empty'}
					</button>
				))}
				<button type="button" disabled={state() !== 'live'} aria-pressed={paused()} onClick={() => setPaused(!paused())}>
					{paused() ? 'Resume' : 'Pause'}
				</button>
				<button type="button" disabled={state() !== 'live' || paused() || !feeds().length} onClick={tick}>
					Next tick
				</button>
			</div>
			<div class="ll-controls" role="group" aria-label={`${'Dashboard'} volatility`}>
				<span>Volatility</span>
				{(['calm', 'normal', 'spiky', 'chaos'] as const).map((item) => (
					<button type="button" aria-pressed={volatility() === item} onClick={() => setVolatility(item)}>
						{item}
					</button>
				))}
			</div>
			<div class="ll-controls" role="group" aria-label={`${'Dashboard'} cadence`}>
				<span>Tick rate</span>
				{[50, 100, 300, 1000].map((ms) => (
					<button type="button" aria-pressed={cadence() === ms} onClick={() => setCadence(ms)}>
						{ms === 1000 ? '1s' : `${ms}ms`}
					</button>
				))}
			</div>
			<div class="ll-controls" role="group" aria-label={`${'Dashboard'} features`}>
				<span>Features</span>
				<button type="button" disabled={true} aria-pressed={false} onClick={() => setGrid(!grid())}>
					Grid
				</button>
				<button type="button" disabled={false} aria-pressed={fill()} onClick={() => setFill(!fill())}>
					Fill
				</button>
				<button type="button" disabled={true} aria-pressed={false} onClick={() => setMomentum(!momentum())}>
					Momentum
				</button>
				<button type="button" aria-pressed={pulse()} onClick={() => setPulse(!pulse())}>
					Pulse
				</button>
				<button type="button" aria-pressed={scrub()} onClick={() => setScrub(!scrub())}>
					Scrub
				</button>
			</div>
			<div class="ll-controls" role="group" aria-label={`${'Dashboard'} window style`}>
				<span>Window</span>
				{(['default', 'rounded', 'text'] as const).map((item) => (
					<button type="button" disabled={true} aria-pressed={false} onClick={() => setWindowStyle(item)}>
						{item}
					</button>
				))}
				{windows.map((item) => (
					<button type="button" aria-pressed={windowSecs() === item.secs} onClick={() => setWindowSecs(item.secs)}>
						{item.label}
					</button>
				))}
			</div>

			{
				<div class="ll-dashboard">
					{['Requests / min', 'Latency / ms', 'Active sessions', 'Throughput / MB'].map((label, i) => (
						<div class="ll-panel">
							<div class="ll-metric">
								<p>{label}</p>
								<strong>{state() === 'live' ? (feeds()[i]?.data.at(-1)?.value ?? 0).toFixed(i === 3 ? 2 : 0) : '--'}</strong>
							</div>
							<Liveline
								{...common()}
								data={feeds()[i]?.data ?? []}
								value={feeds()[i]?.data.at(-1)?.value ?? 0}
								aria-label={`${label}, ${state()}`}
								color={seriesColors[i]}
								badge={false}
								grid={false}
								momentum={false}
								style={{ height: '120px' }}
							/>
						</div>
					))}
				</div>
			}

			<div class="ll-status">
				<span role="status">
					state: {state()}
					{paused() ? ' / paused' : ''}
				</span>
				<span>points: {data().length}</span>
				<span>ticks: {feeds()[0]?.ticks ?? 0}</span>
				<span>window: {windowSecs()}s</span>
				<span>tick: {cadence()}ms</span>
			</div>
			<p class="ll-contract">
				Simulated data. Live restores history; Loading and Empty clear all chart inputs. Pause stops the feed and scrolling. Next tick appends through the automatic feed
				function and is disabled while paused or without live data.
			</p>
		</section>
	);
}
