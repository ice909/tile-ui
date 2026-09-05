'use client';
import { useCallback, useEffect, useState } from 'react';
import { Liveline } from '@tile-ui/react';
import {
	appendDemoTick,
	cryptoWindows,
	demoOrderbook,
	formatDemoPrice,
	livelineDemoCss,
	seedDemoFeed,
	type DemoFeed,
	type DemoState,
	type Volatility,
} from '../../../../common/lib/liveline-demo';
export default function LivelineDemo() {
	const [feeds, setFeeds] = useState<DemoFeed[]>([]);
	const [state, setState] = useState<DemoState>('live');
	const [paused, setPaused] = useState(false);
	const [siteTheme, setSiteTheme] = useState<'dark' | 'light'>('light');
	const theme = siteTheme;
	const [volatility, setVolatility] = useState<Volatility>('spiky');
	const [cadence, setCadence] = useState(300);
	const [windowSecs, setWindowSecs] = useState(300);
	const [fill, setFill] = useState(true);
	const [momentum, setMomentum] = useState(true);
	const [grid, setGrid] = useState(true);
	const [pulse, setPulse] = useState(true);
	const [scrub, setScrub] = useState(true);
	const [degen, setDegen] = useState(false);
	const [depth, setDepth] = useState(true);

	const [windowStyle, setWindowStyle] = useState<'default' | 'rounded' | 'text'>('default');

	const seed = useCallback(() => {
		const now = Date.now() / 1000;
		return Array.from({ length: 1 }, (_, i) => seedDemoFeed(now, 67432, 42 + i * 7919, 3800));
	}, []);
	const tick = useCallback(() => setFeeds((current) => current.map((feed) => appendDemoTick(feed, Date.now() / 1000, volatility))), [volatility]);
	const changeState = (next: DemoState) => {
		setPaused(false);
		setFeeds(next === 'live' ? seed() : []);
		setState(next);
	};
	useEffect(() => {
		setFeeds(seed());
	}, [seed]);
	useEffect(() => {
		const root = document.documentElement;
		const getTheme = (): 'dark' | 'light' => {
			const value = root.dataset.theme ?? root.className;
			if (value.split(/\s+/).includes('dark')) return 'dark';
			if (value.split(/\s+/).includes('light')) return 'light';
			const colorScheme = getComputedStyle(root).colorScheme;
			if (colorScheme.includes('dark') && !colorScheme.includes('light')) return 'dark';
			return colorScheme.includes('light') || !window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
		};
		const update = () => setSiteTheme(getTheme());
		const observer = new MutationObserver(update);
		observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		media.addEventListener('change', update);
		update();
		return () => {
			observer.disconnect();
			media.removeEventListener('change', update);
		};
	}, []);
	useEffect(() => {
		if (state !== 'live' || paused) return;
		const interval = window.setInterval(tick, cadence);
		return () => window.clearInterval(interval);
	}, [state, paused, cadence, tick]);
	const data = feeds[0]?.data ?? [];
	const value = data.at(-1)?.value ?? 0;

	const windows = cryptoWindows;
	const common = { theme, window: windowSecs, loading: state === 'loading', paused, fill, momentum, grid, pulse, scrub, emptyText: 'No data to display' };
	return (
		<section className="ll-demo" data-theme={theme} style={{ marginBottom: 24 }} aria-label={`${'Crypto'} demo`}>
			<style>{livelineDemoCss}</style>
			<header className="ll-header">
				<div>
					<h3>{'Crypto'}</h3>
					<p>{'BTC / USD. Live depth, reference price and optional degen effects.'}</p>
				</div>
			</header>
			<div className="ll-controls" role="group" aria-label={`${'Crypto'} feed state`}>
				<span>State</span>
				{(['live', 'loading', 'empty'] as const).map((item) => (
					<button key={item} type="button" aria-pressed={state === item} onClick={() => changeState(item)}>
						{item === 'live' ? 'Live' : item === 'loading' ? 'Loading' : 'Empty'}
					</button>
				))}
				<button type="button" disabled={state !== 'live'} aria-pressed={paused} onClick={() => setPaused(!paused)}>
					{paused ? 'Resume' : 'Pause'}
				</button>
				<button type="button" disabled={state !== 'live' || paused || !feeds.length} onClick={tick}>
					Next tick
				</button>
			</div>
			<div className="ll-controls" role="group" aria-label={`${'Crypto'} volatility`}>
				<span>Volatility</span>
				{(['calm', 'normal', 'spiky', 'chaos'] as const).map((item) => (
					<button key={item} type="button" aria-pressed={volatility === item} onClick={() => setVolatility(item)}>
						{item}
					</button>
				))}
			</div>
			<div className="ll-controls" role="group" aria-label={`${'Crypto'} cadence`}>
				<span>Tick rate</span>
				{[50, 100, 300, 1000].map((ms) => (
					<button key={ms} type="button" aria-pressed={cadence === ms} onClick={() => setCadence(ms)}>
						{ms === 1000 ? '1s' : `${ms}ms`}
					</button>
				))}
			</div>
			<div className="ll-controls" role="group" aria-label={`${'Crypto'} features`}>
				<span>Features</span>
				<button type="button" disabled={false} aria-pressed={grid} onClick={() => setGrid(!grid)}>
					Grid
				</button>
				<button type="button" disabled={false} aria-pressed={fill} onClick={() => setFill(!fill)}>
					Fill
				</button>
				<button type="button" disabled={false} aria-pressed={momentum} onClick={() => setMomentum(!momentum)}>
					Momentum
				</button>
				<button type="button" aria-pressed={pulse} onClick={() => setPulse(!pulse)}>
					Pulse
				</button>
				<button type="button" aria-pressed={scrub} onClick={() => setScrub(!scrub)}>
					Scrub
				</button>
				{
					<>
						<button type="button" aria-pressed={depth} onClick={() => setDepth(!depth)}>
							Orderbook
						</button>
						<button type="button" aria-pressed={degen} onClick={() => setDegen(!degen)}>
							Degen
						</button>
					</>
				}
			</div>
			<div className="ll-controls" role="group" aria-label={`${'Crypto'} window style`}>
				<span>Window</span>
				{(['default', 'rounded', 'text'] as const).map((item) => (
					<button key={item} type="button" disabled={false} aria-pressed={windowStyle === item} onClick={() => setWindowStyle(item)}>
						{item}
					</button>
				))}
				{windows.map((item) => (
					<button key={item.secs} type="button" aria-pressed={windowSecs === item.secs} onClick={() => setWindowSecs(item.secs)}>
						{item.label}
					</button>
				))}
			</div>

			{
				<div className="ll-panel">
					<Liveline
						{...common}
						aria-label={`${'Crypto'}: ${state}, ${paused ? 'paused' : 'running'}, ${formatDemoPrice(value)}`}
						data={data}
						value={value}
						mode={'line'}
						windows={windows}
						windowStyle={windowStyle}
						onWindowChange={setWindowSecs}
						color={'#f7931a'}
						formatValue={formatDemoPrice}
						showValue={true}
						valueMomentumColor={true}
						orderbook={depth && data.length ? demoOrderbook(value, feeds[0]?.ticks ?? 0) : undefined}
						referenceLine={data.length ? { value: 67432, label: 'Open' } : undefined}
						degen={degen ? { scale: 1, downMomentum: true } : false}
						style={{ height: 320 }}
					/>
				</div>
			}

			<div className="ll-status">
				<span role="status">
					state: {state}
					{paused ? ' / paused' : ''}
				</span>
				<span>points: {data.length}</span>
				<span>ticks: {feeds[0]?.ticks ?? 0}</span>
				<span>window: {windowSecs}s</span>
				<span>tick: {cadence}ms</span>
			</div>
			<p className="ll-contract">
				Simulated data. Live restores history; Loading and Empty clear all chart inputs. Pause stops the feed and scrolling. Next tick appends through the automatic feed
				function and is disabled while paused or without live data.
			</p>
		</section>
	);
}
