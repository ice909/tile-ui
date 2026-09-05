import { defineComponent, onMounted, onUnmounted, shallowRef, watchEffect } from 'vue';
import { Liveline } from '@tile-ui/vue';
import { appendDemoTick, demoWindows, formatDemoPrice, livelineDemoCss, seedDemoFeed, type DemoFeed, type DemoState, type Volatility } from '../../../../common/lib/liveline-demo';
function useState<T>(initial: T) {
	const value = shallowRef<T>(initial);
	const set = (next: T | ((current: T) => T)) => {
		value.value = typeof next === 'function' ? (next as (current: T) => T)(value.value) : next;
	};
	return [value, set] as const;
}
function siteTheme(): 'dark' | 'light' {
	if (typeof document === 'undefined') return 'light';
	const root = document.documentElement;
	if (root.dataset.theme === 'dark' || root.classList.contains('dark')) return 'dark';
	if (root.dataset.theme === 'light' || root.classList.contains('light')) return 'light';
	return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export default defineComponent({
	name: 'LivelineScenario',
	setup() {
		const [feeds, setFeeds] = useState<DemoFeed[]>([]);
		const [state, setState] = useState<DemoState>('live');
		const [paused, setPaused] = useState(false);
		const [theme, setTheme] = useState<'dark' | 'light'>('light');
		const [volatility, setVolatility] = useState<Volatility>('normal');
		const [cadence, setCadence] = useState(300);
		const [windowSecs, setWindowSecs] = useState(30);
		const [fill, setFill] = useState(true);
		const [momentum, setMomentum] = useState(true);
		const [grid, setGrid] = useState(true);
		const [pulse, setPulse] = useState(true);
		const [scrub, setScrub] = useState(true);

		const [windowStyle, setWindowStyle] = useState<'default' | 'rounded' | 'text'>('default');

		let stopThemeObserver: (() => void) | undefined;
		const seed = () => {
			const now = Date.now() / 1000;
			return Array.from({ length: 1 }, (_, i) => seedDemoFeed(now, 100, 42 + i * 7919, 360));
		};
		const mounted = shallowRef(false);
		onMounted(() => {
			mounted.value = true;
			const root = document.documentElement;
			const media = window.matchMedia?.('(prefers-color-scheme: dark)');
			const updateTheme = () => setTheme(siteTheme());
			const observer = new MutationObserver(updateTheme);
			observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
			media?.addEventListener('change', updateTheme);
			updateTheme();
			stopThemeObserver = () => {
				observer.disconnect();
				media?.removeEventListener('change', updateTheme);
			};
		});
		onUnmounted(() => {
			mounted.value = false;
			stopThemeObserver?.();
		});
		const tick = () => setFeeds((current) => current.map((feed) => appendDemoTick(feed, Date.now() / 1000, volatility.value)));
		const changeState = (next: DemoState) => {
			setPaused(false);
			setFeeds(next === 'live' ? seed() : []);
			setState(next);
		};
		onMounted(() => {
			setFeeds(seed());
		});
		watchEffect((onCleanup) => {
			if (!mounted.value || state.value !== 'live' || paused.value) return;
			const interval = window.setInterval(tick, cadence.value);
			onCleanup(() => window.clearInterval(interval));
		});
		return () => {
			const data = feeds.value[0]?.data ?? [];
			const value = data.at(-1)?.value ?? 0;

			const windows = demoWindows;
			const common = {
				theme: theme.value,
				window: windowSecs.value,
				loading: state.value === 'loading',
				paused: paused.value,
				fill: fill.value,
				momentum: momentum.value,
				grid: grid.value,
				pulse: pulse.value,
				scrub: scrub.value,
				emptyText: 'No data to display',
			};
			return (
				<section class="ll-demo" data-theme={theme.value} style={{ marginBottom: 24 }} aria-label={`${'Live line'} demo`}>
					<style innerHTML={livelineDemoCss} />
					<header class="ll-header">
						<div>
							<h3>{'Live line'}</h3>
							<p>{'A continuous feed. Smooth interpolation, momentum and a live edge.'}</p>
						</div>
					</header>
					<div class="ll-controls" role="group" aria-label={`${'Live line'} feed state`}>
						<span>State</span>
						{(['live', 'loading', 'empty'] as const).map((item) => (
							<button key={item} type="button" aria-pressed={state.value === item} onClick={() => changeState(item)}>
								{item === 'live' ? 'Live' : item === 'loading' ? 'Loading' : 'Empty'}
							</button>
						))}
						<button type="button" disabled={state.value !== 'live'} aria-pressed={paused.value} onClick={() => setPaused(!paused.value)}>
							{paused.value ? 'Resume' : 'Pause'}
						</button>
						<button type="button" disabled={state.value !== 'live' || paused.value || !feeds.value.length} onClick={tick}>
							Next tick
						</button>
					</div>
					<div class="ll-controls" role="group" aria-label={`${'Live line'} volatility`}>
						<span>Volatility</span>
						{(['calm', 'normal', 'spiky', 'chaos'] as const).map((item) => (
							<button key={item} type="button" aria-pressed={volatility.value === item} onClick={() => setVolatility(item)}>
								{item}
							</button>
						))}
					</div>
					<div class="ll-controls" role="group" aria-label={`${'Live line'} cadence`}>
						<span>Tick rate</span>
						{[50, 100, 300, 1000].map((ms) => (
							<button key={ms} type="button" aria-pressed={cadence.value === ms} onClick={() => setCadence(ms)}>
								{ms === 1000 ? '1s' : `${ms}ms`}
							</button>
						))}
					</div>
					<div class="ll-controls" role="group" aria-label={`${'Live line'} features`}>
						<span>Features</span>
						<button type="button" disabled={false} aria-pressed={grid.value} onClick={() => setGrid(!grid.value)}>
							Grid
						</button>
						<button type="button" disabled={false} aria-pressed={fill.value} onClick={() => setFill(!fill.value)}>
							Fill
						</button>
						<button type="button" disabled={false} aria-pressed={momentum.value} onClick={() => setMomentum(!momentum.value)}>
							Momentum
						</button>
						<button type="button" aria-pressed={pulse.value} onClick={() => setPulse(!pulse.value)}>
							Pulse
						</button>
						<button type="button" aria-pressed={scrub.value} onClick={() => setScrub(!scrub.value)}>
							Scrub
						</button>
					</div>
					<div class="ll-controls" role="group" aria-label={`${'Live line'} window style`}>
						<span>Window</span>
						{(['default', 'rounded', 'text'] as const).map((item) => (
							<button key={item} type="button" disabled={false} aria-pressed={windowStyle.value === item} onClick={() => setWindowStyle(item)}>
								{item}
							</button>
						))}
						{windows.map((item) => (
							<button key={item.secs} type="button" aria-pressed={windowSecs.value === item.secs} onClick={() => setWindowSecs(item.secs)}>
								{item.label}
							</button>
						))}
					</div>

					{
						<div class="ll-panel">
							<Liveline
								{...common}
								aria-label={`${'Live line'}: ${state.value}, ${paused.value ? 'paused' : 'running'}, ${formatDemoPrice(value)}`}
								data={data}
								value={value}
								mode={'line'}
								windows={windows}
								windowStyle={windowStyle.value}
								onWindowChange={setWindowSecs}
								color={'#3b82f6'}
								showValue={false}
								valueMomentumColor={false}
								degen={false}
								style={{ height: '320px' }}
							/>
						</div>
					}

					<div class="ll-status">
						<span role="status">
							state: {state.value}
							{paused.value ? ' / paused' : ''}
						</span>
						<span>points: {data.length}</span>
						<span>ticks: {feeds.value[0]?.ticks ?? 0}</span>
						<span>window: {windowSecs.value}s</span>
						<span>tick: {cadence.value}ms</span>
					</div>
					<p class="ll-contract">
						Simulated data. Live restores history; Loading and Empty clear all chart inputs. Pause stops the feed and scrolling. Next tick appends through the automatic
						feed function and is disabled while paused or without live data.
					</p>
				</section>
			);
		};
	},
});
