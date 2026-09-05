export type DemoPoint = { time: number; value: number };
export type DemoCandle = { time: number; open: number; high: number; low: number; close: number };
export type DemoFeed = { data: DemoPoint[]; seed: number; base: number; ticks: number };
export type DemoState = 'live' | 'loading' | 'empty';
export type Volatility = 'calm' | 'normal' | 'spiky' | 'chaos';
export const demoWindows = [
	{ label: '10s', secs: 10 },
	{ label: '30s', secs: 30 },
	{ label: '1m', secs: 60 },
	{ label: '5m', secs: 300 },
];
export const cryptoWindows = [
	{ label: '5m', secs: 300 },
	{ label: '15m', secs: 900 },
	{ label: '1h', secs: 3600 },
];
export const compactSizes = [
	[320, 180],
	[240, 120],
	[160, 100],
	[120, 80],
];
export const seriesLabels = ['Yes', 'No', 'Maybe', 'Other'];
export const seriesColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];
export const demoLimit = 76000; // More than one hour even at the fastest 50ms cadence.

/** Immutable seeded random walk. Automatic and manual ticks use this same function. */
export function appendDemoTick(feed: DemoFeed, time: number, volatility: Volatility): DemoFeed {
	const seed = (Math.imul(feed.seed, 1664525) + 1013904223) >>> 0;
	const random = seed / 4294967296;
	const scale = ({ calm: 0.15, normal: 0.8, spiky: 3, chaos: 8 }[volatility] * feed.base) / 100;
	const spike = (volatility === 'spiky' || volatility === 'chaos') && random < 0.08 ? (random * 12.5 - 0.5) * 3 : 0;
	const last = feed.data.at(-1);
	const value = Math.max(feed.base * 0.05, (last?.value ?? feed.base) + (random - 0.499 + spike) * scale);
	const point = { time: Math.max(time, (last?.time ?? time - 0.001) + 0.001), value };
	const data = [...feed.data, point].filter((p) => p.time >= point.time - 3800).slice(-demoLimit);
	return { ...feed, data, seed, ticks: feed.ticks + 1 };
}

export function seedDemoFeed(now: number, base = 100, seed = 42, seconds = 360): DemoFeed {
	let feed: DemoFeed = { data: [], seed, base, ticks: 0 };
	for (let i = seconds; i >= 0; i--) feed = appendDemoTick(feed, now - i, 'normal');
	return { ...feed, ticks: 0 };
}

export function aggregateDemoCandles(data: DemoPoint[], width: number) {
	const candles: DemoCandle[] = [];
	let live: DemoCandle | undefined;
	for (const point of data) {
		const time = Math.floor(point.time / width) * width;
		if (!live || live.time !== time) {
			if (live) candles.push(live);
			live = { time, open: point.value, high: point.value, low: point.value, close: point.value };
		} else live = { ...live, high: Math.max(live.high, point.value), low: Math.min(live.low, point.value), close: point.value };
	}
	return { candles, live };
}

export function demoOrderbook(value: number, tick: number) {
	const levels = (side: number): [number, number][] => Array.from({ length: 16 }, (_, i) => [value * (1 + side * (i + 1) * 0.0003), 2 + ((i * 7 + tick * 3) % 19)]);
	return { bids: levels(-1), asks: levels(1) };
}
export const formatDemoPrice = (value: number) => '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Included with the copied example, so the preview has no private stylesheet dependency.
export const livelineDemoCss = `
 .ll-demo{width:100%;min-width:0;padding:24px;background:var(--docs-surface);color:var(--docs-text);border-radius:12px;font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color-scheme:inherit;box-sizing:border-box;--ll-panel:var(--docs-surface-subtle);--ll-border:var(--docs-border);--ll-muted:var(--docs-text-muted);--ll-button:var(--docs-surface-hover)}
 .ll-demo[data-theme=dark]{color-scheme:dark}.ll-demo[data-theme=light]{color-scheme:light}
.ll-demo *{box-sizing:border-box}.ll-demo h3{font-size:16px;font-weight:600;margin:0 0 4px;letter-spacing:-.02em}.ll-demo p{margin:0;color:var(--ll-muted)}
.ll-header{display:flex;align-items:start;justify-content:space-between;gap:16px;margin-bottom:20px}.ll-controls{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:10px 0}.ll-controls>span{width:64px;color:var(--ll-muted);font-size:11px}.ll-demo button{appearance:none;font:inherit;line-height:1.3;border:1px solid var(--ll-border);background:transparent;color:inherit;padding:6px 10px;border-radius:6px;cursor:pointer}.ll-demo button[aria-pressed=true]{background:var(--ll-button);border-color:var(--ll-muted)}.ll-demo button:hover:not(:disabled){background:var(--ll-button)}.ll-demo button:focus-visible{outline:2px solid #3b82f6;outline-offset:3px}.ll-demo button:disabled{opacity:.35;cursor:not-allowed}
.ll-panel{background:var(--ll-panel);border:1px solid var(--ll-border);border-radius:12px;padding:8px;overflow:hidden;min-width:0;margin-top:16px}.ll-status{display:flex;flex-wrap:wrap;gap:6px 16px;color:var(--ll-muted);font:11px/1.7 "SF Mono",Menlo,monospace;margin-top:10px}.ll-section{margin-top:32px;padding-top:24px;border-top:1px solid var(--ll-border)}.ll-sizes{display:flex;flex-wrap:wrap;align-items:end;gap:16px;margin-top:16px}.ll-size{max-width:100%}.ll-size>span{font-size:10px;color:var(--ll-muted)}.ll-size .ll-panel{margin-top:4px;padding:0}.ll-dashboard{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ll-metric{padding:12px 12px 0}.ll-metric strong{display:block;font-size:24px;font-weight:500;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.ll-contract{margin-top:12px!important;font-size:11px}.ll-demo .liveline{background:var(--ll-panel)}
@media(max-width:560px){.ll-demo{padding:14px}.ll-header{flex-direction:column}.ll-controls>span{width:100%;margin-top:4px}.ll-dashboard{grid-template-columns:1fr}}
`;
