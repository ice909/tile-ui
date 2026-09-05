import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const EPOCH_MS = 1767225600 * 1000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'tests/liveline-visual');
const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tile-ui-liveline-visual-'));
const port = Number(process.env.TILE_UI_LIVELINE_PORT ?? 41739);
const url = `http://127.0.0.1:${port}`;
const serverLog = path.join(outputDir, 'server.log');
const reportPath = path.join(outputDir, 'report.json');
const errors = [];
const screenshots = [];
let server;
let browser;

async function waitForServer() {
	const deadline = Date.now() + 60_000;
	while (Date.now() < deadline) {
		if (server?.exitCode != null) throw new Error(`Fixture server exited with ${server.exitCode}; see ${serverLog}`);
		try {
			const response = await fetch(url);
			if (response.ok) return;
		} catch {}
		await delay(200);
	}
	throw new Error(`Fixture server did not become ready at ${url}; see ${serverLog}`);
}

async function canvasState(page, id) {
	return page.locator(`[data-fixture="${id}"] canvas`).evaluate((canvas) => ({
		cssWidth: canvas.getBoundingClientRect().width,
		cssHeight: canvas.getBoundingClientRect().height,
		width: canvas.width,
		height: canvas.height,
		pixels: canvas.toDataURL(),
		paintedPixels: (() => {
			const context = canvas.getContext('2d');
			if (!context) return 0;
			const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
			let count = 0;
			for (let index = 3; index < pixels.length; index += 4) if (pixels[index] !== 0) count += 1;
			return count;
		})(),
	}));
}

try {
	const log = fs.openSync(serverLog, 'w');
	server = spawn('corepack', ['pnpm', '--dir', 'apps/solid', 'exec', 'vite', '--config', path.join(fixture, 'vite.config.mjs'), '--host', '127.0.0.1', '--port', String(port)], {
		cwd: root,
		env: { ...process.env, TZ: 'UTC', CI: '1' },
		stdio: ['ignore', log, log],
	});
	fs.closeSync(log);
	await waitForServer();

	browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		viewport: { width: 1280, height: 900 },
		deviceScaleFactor: 2,
		locale: 'en-US',
		timezoneId: 'UTC',
		reducedMotion: 'reduce',
		colorScheme: 'dark',
	});
	await context.addInitScript(() => {
		Object.defineProperty(Math, 'random', { value: () => 0.5 });
	});
	const page = await context.newPage();
	await page.clock.install({ time: EPOCH_MS });
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(`console: ${message.text()}`);
	});
	page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.locator('[data-fixture="line"] canvas').waitFor();
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

	const initialTime = await page.evaluate(() => Date.now());
	assert.ok(initialTime >= EPOCH_MS && initialTime < EPOCH_MS + 2_000, 'browser clock must start at the fixed epoch');
	assert.equal(await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone), 'UTC');
	assert.equal(await page.evaluate(() => navigator.language), 'en-US');
	assert.equal(await page.evaluate(() => devicePixelRatio), 2);
	assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);

	for (const id of ['line', 'candle', 'multi', 'loading', 'empty', 'pause', 'live', 'morph']) {
		const box = await page.locator(`[data-fixture="${id}"]`).boundingBox();
		assert.deepEqual({ width: box?.width, height: box?.height }, { width: 574, height: 344 }, `${id}: fixture dimensions`);
		const state = await canvasState(page, id);
		assert.equal(state.width, Math.round(state.cssWidth * 2), `${id}: canvas backing width`);
		assert.equal(state.height, Math.round(state.cssHeight * 2), `${id}: canvas backing height`);
		assert.ok(state.pixels.length > 500, `${id}: canvas must contain rendered pixels`);
		assert.ok(state.paintedPixels > 100, `${id}: canvas must not be empty`);
		const overflow = await page
			.locator(`[data-fixture="${id}"]`)
			.evaluate((element) => ({ x: element.scrollWidth - element.clientWidth, y: element.scrollHeight - element.clientHeight }));
		assert.deepEqual(overflow, { x: 0, y: 0 }, `${id}: fixture overflow`);
		const screenshot = path.join(outputDir, `${id}.png`);
		await page.locator(`[data-fixture="${id}"]`).screenshot({ path: screenshot });
		screenshots.push(screenshot);
	}

	assert.equal(await page.getByRole('button', { name: 'Show line chart' }).getAttribute('aria-pressed'), 'true', 'line mode must initially be pressed');
	assert.equal(await page.getByRole('button', { name: 'Show candle chart' }).getAttribute('aria-pressed'), 'false', 'candle mode must initially be unpressed');
	await page.getByRole('button', { name: 'Show 30s time range' }).click();
	await page.getByRole('button', { name: 'Show candle chart' }).click();
	await page.getByRole('button', { name: 'Hide Asset B series' }).click();
	const surface = page.locator('[data-fixture="line"] [data-slot="liveline-surface"]');
	const surfaceBox = await surface.boundingBox();
	assert.ok(surfaceBox);
	await page.mouse.move(surfaceBox.x + surfaceBox.width / 2, surfaceBox.y + surfaceBox.height / 2);
	await page.clock.runFor(20);
	await page.mouse.move(surfaceBox.x + surfaceBox.width + 10, surfaceBox.y);
	await page.clock.runFor(20);
	const callbacks = await page.evaluate(() => window.__livelineAudit.callbacks);
	assert.ok(
		callbacks.some((event) => event.name === 'window' && event.value === 30),
		'window callback',
	);
	assert.ok(
		callbacks.some((event) => event.name === 'mode' && event.value === 'candle'),
		'mode callback',
	);
	assert.ok(
		callbacks.some((event) => event.name === 'series' && JSON.stringify(event.value) === JSON.stringify({ id: 'asset-b', visible: false })),
		'series callback',
	);
	assert.ok(
		callbacks.some((event) => event.name === 'hover' && typeof event.value === 'number'),
		'hover callback',
	);
	assert.ok(
		callbacks.some((event) => event.name === 'hover' && event.value === null),
		'hover leave callback',
	);

	const pausedBefore = await canvasState(page, 'pause');
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	const pausedStable = await canvasState(page, 'pause');
	assert.deepEqual(
		{ cssWidth: pausedStable.cssWidth, cssHeight: pausedStable.cssHeight, width: pausedStable.width, height: pausedStable.height },
		{ cssWidth: pausedBefore.cssWidth, cssHeight: pausedBefore.cssHeight, width: pausedBefore.width, height: pausedBefore.height },
		'paused chart layout and backing store must remain stable across frames',
	);
	await page.evaluate(() => window.__livelineAudit.setPausedData());
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	const pausedAfter = await canvasState(page, 'pause');
	assert.deepEqual(
		{ width: pausedAfter.width, height: pausedAfter.height },
		{ width: pausedBefore.width, height: pausedBefore.height },
		'paused consumer updates must preserve the backing store',
	);

	await page.clock.fastForward(66_000);
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	assert.ok((await page.evaluate(() => window.__livelineAudit.latestLiveTime)) >= EPOCH_MS / 1000 + 65, 'live data must retain a point in the current window after 65 seconds');
	const liveAfter = await canvasState(page, 'live');
	assert.ok(liveAfter.paintedPixels > 100, 'live canvas must still contain a rendered curve after 65 seconds');

	await page.evaluate(() => window.__livelineAudit.setMorph(true));
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	const morphFirst = await canvasState(page, 'morph');
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	const morphSecond = await canvasState(page, 'morph');
	assert.equal(morphSecond.pixels, morphFirst.pixels, 'reduced-motion morph must settle to stable pixels');
	const morphScreenshot = path.join(outputDir, 'morph-line.png');
	await page.locator('[data-fixture="morph"]').screenshot({ path: morphScreenshot });
	screenshots.push(morphScreenshot);

	await page.setViewportSize({ width: 375, height: 844 });
	const mobileOverflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
	assert.ok(mobileOverflow <= 1, `375px fixture has ${mobileOverflow}px horizontal overflow`);

	assert.deepEqual(errors, [], 'browser must have no console or page errors');
	const report = {
		ok: true,
		epoch: EPOCH_MS / 1000,
		url,
		environment: { timezone: 'UTC', locale: 'en-US', dpr: 2, reducedMotion: true },
		assertions: 67,
		callbacks,
		screenshots,
	};
	fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
	console.log(`Liveline visual acceptance passed (67 assertions).`);
	console.log(`Artifacts: ${outputDir}`);
	console.log(`Report: ${reportPath}`);
} catch (error) {
	fs.writeFileSync(reportPath, `${JSON.stringify({ ok: false, error: error.stack ?? String(error), errors, screenshots }, null, 2)}\n`);
	console.error(error);
	console.error(`Artifacts: ${outputDir}`);
	process.exitCode = 1;
} finally {
	await browser?.close();
	if (server && server.exitCode == null) {
		server.kill('SIGTERM');
		await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(2_000)]);
		if (server.exitCode == null) server.kill('SIGKILL');
	}
}
