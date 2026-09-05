import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aggregateDemoCandles, appendDemoTick, demoLimit, demoOrderbook, seedDemoFeed } from './liveline-demo';

test('seeded history is deterministic, covers the widest window and has independent series', () => {
	const a = seedDemoFeed(10000, 100, 42, 3800);
	assert.deepEqual(a, seedDemoFeed(10000, 100, 42, 3800));
	assert.equal(a.data.at(-1)!.time - a.data[0].time, 3800);
	assert.notDeepEqual(
		a.data.map((p) => p.value),
		seedDemoFeed(10000, 100, 7961, 3800).data.map((p) => p.value),
	);
});

test('a tick appends immutable history, advances time and increments the feed counter', () => {
	const before = seedDemoFeed(1000);
	const next = appendDemoTick(before, 1000, 'chaos');
	assert.equal(next.data.length, before.data.length + 1);
	assert.deepEqual(next.data.slice(0, -1), before.data);
	assert.equal(next.ticks, 1);
	assert.ok(next.data.at(-1)!.time > before.data.at(-1)!.time);
	assert.notEqual(next.data.at(-1)!.value, before.data.at(-1)!.value);
	assert.equal(before.ticks, 0);
});

test('history is bounded by elapsed time and by count', () => {
	const feed = seedDemoFeed(1000);
	assert.equal(appendDemoTick(feed, 5000, 'calm').data.length, 1);
	const data = Array.from({ length: demoLimit }, (_, i) => ({ time: i / 100, value: 100 }));
	assert.equal(appendDemoTick({ ...feed, data }, 761, 'normal').data.length, demoLimit);
});

test('OHLC preserves open, extrema, close and commits only completed buckets', () => {
	const data = [
		{ time: 10, value: 4 },
		{ time: 10.2, value: 7 },
		{ time: 10.8, value: 2 },
		{ time: 11.9, value: 5 },
		{ time: 12, value: 6 },
	];
	assert.deepEqual(aggregateDemoCandles(data, 2), {
		candles: [{ time: 10, open: 4, high: 7, low: 2, close: 5 }],
		live: { time: 12, open: 6, high: 6, low: 6, close: 6 },
	});
	assert.deepEqual(aggregateDemoCandles([], 2), { candles: [], live: undefined });
	assert.equal(aggregateDemoCandles(data, 5).candles.length, 0);
});

test('orderbook straddles the latest trade and updates sizes each tick', () => {
	const book = demoOrderbook(100, 1);
	assert.ok(book.bids.every(([price, size]) => price < 100 && size > 0));
	assert.ok(book.asks.every(([price, size]) => price > 100 && size > 0));
	assert.notDeepEqual(book, demoOrderbook(100, 2));
});
