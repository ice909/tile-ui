import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const upstream = path.resolve(root, '../liveline');
const commit = '069899598a11e00094ea1eb6b838404825f828be';
if (execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim() !== commit) throw Error('Wrong upstream commit');
if (execFileSync('git', ['status', '--porcelain'], { cwd: upstream, encoding: 'utf8' }).trim()) throw Error('Upstream must be immutable and clean');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'liveline-parity-'));
const port = Number(process.env.TILE_UI_LIVELINE_PARITY_PORT ?? 41740);
const log = fs.openSync(path.join(output, 'server.log'), 'w');
const server = spawn(
	'corepack',
	['pnpm', '--dir', 'apps/solid', 'exec', 'vite', '--config', path.join(root, 'tests/liveline-visual/vite.config.mjs'), '--host', '127.0.0.1', '--port', String(port)],
	{ cwd: root, stdio: ['ignore', log, log] },
);
fs.closeSync(log);
const report = {
	commit,
	output,
	tolerance: {
		channelDelta: 2,
		changedFraction: 0.001,
		meanAbsoluteError: 0.05,
		reason: 'Same browser, fonts, backing dimensions and deterministic inputs should match; allow only <=2/255 channel rounding, <=0.1% materially changed pixels and <=0.05/255 mean error. No geometry, text, or motion masking.',
	},
	results: [],
	errors: [],
};
let browser;
try {
	for (let n = 0; ; n++) {
		try {
			if ((await fetch(`http://127.0.0.1:${port}/parity.html`)).ok) break;
		} catch {}
		if (n > 150 || server.exitCode !== null) throw Error('Vite unavailable');
		await delay(200);
	}
	browser = await chromium.launch({ args: ['--disable-lcd-text'] });
	for (const profile of [
		{ name: 'normal-desktop', motion: 'no-preference', width: 1200, dpr: 2 },
		{ name: 'reduced-desktop', motion: 'reduce', width: 1200, dpr: 2 },
		{ name: 'normal-mobile', motion: 'no-preference', width: 375, dpr: 2 },
		{ name: 'normal-dpr1', motion: 'no-preference', width: 1200, dpr: 1 },
	]) {
		const context = await browser.newContext({
			viewport: { width: profile.width, height: 440 },
			deviceScaleFactor: profile.dpr,
			reducedMotion: profile.motion,
			locale: 'en-US',
			timezoneId: 'UTC',
			colorScheme: 'dark',
		});
		await context.addInitScript(() => {
			const nativeFrame = window.requestAnimationFrame.bind(window);
			window.__paint = () => new Promise((resolve) => nativeFrame(() => nativeFrame(resolve)));
			let now = 0,
				id = 0,
				seed = 123456;
			const frames = new Map();
			Date.now = () => 1767225600000 + now;
			performance.now = () => now;
			Math.random = () => {
				seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
				return seed / 4294967296;
			};
			window.requestAnimationFrame = (callback) => {
				frames.set(++id, callback);
				return id;
			};
			window.cancelAnimationFrame = (key) => frames.delete(key);
			window.__frame = (time) => {
				now = time;
				const pending = [...frames.values()];
				frames.clear();
				pending.forEach((callback) => callback(now));
			};
		});
		const pages = [];
		for (const impl of ['upstream', 'target', 'upstream']) {
			const page = await context.newPage();
			page.on('pageerror', (error) => report.errors.push(`${profile.name}/${impl}: ${error.message}`));
			page.on('console', (message) => {
				if (message.type() === 'error') report.errors.push(`${profile.name}/${impl}: ${message.text()}`);
			});
			await page.goto(`http://127.0.0.1:${port}/parity.html?impl=${impl}`, { waitUntil: 'networkidle' });
			await page.waitForFunction(() => window.__parity?.ready);
			await page.evaluate(() => document.fonts.ready);
			pages.push(page);
		}
		let time = 0;
		async function frames(count) {
			for (let i = 0; i < count; i++) {
				time += 1000 / 60;
				await Promise.all(pages.map((page) => page.evaluate((t) => window.__frame(t), time)));
			}
		}
		async function capture(label) {
			const name = `${profile.name}-${label}`;
			// CSS transitions use the document timeline, not performance.now. Freeze them
			// at their final state; RAF-driven canvas motion remains at the sampled frame.
			// Control transition motion is therefore not claimed by this comparison.
			await Promise.all(pages.map((page) => page.evaluate(() => document.getAnimations().forEach((animation) => animation.finish()))));
			await Promise.all(pages.map((page) => page.evaluate(() => window.__paint())));
			const states = [];
			for (let i = 0; i < pages.length; i++) {
				states.push(
					await pages[i].locator('canvas').evaluate((canvas) => ({
						width: canvas.width,
						height: canvas.height,
						css: { width: canvas.getBoundingClientRect().width, height: canvas.getBoundingClientRect().height },
						image: canvas.toDataURL(),
						time: Date.now(),
						font: getComputedStyle(document.body).fontFamily,
						dpr: devicePixelRatio,
					})),
				);
			}
			const shots = [];
			for (let i = 0; i < 3; i++)
				shots.push((await pages[i].screenshot({ path: path.join(output, `${name}-${['upstream', 'target', 'repeat'][i]}.png`) })).toString('base64'));
			const measured = await pages[0].evaluate(
				async ({ states, shots, tolerance }) => {
					const load = async (src) => {
						const image = new Image();
						image.src = src;
						await image.decode();
						return image;
					};
					const images = await Promise.all(states.map((s) => load(s.image)));
					const compare = (a, b) => {
						if (a.width !== b.width || a.height !== b.height) return { pass: false, dimensionMismatch: true };
						const canvas = document.createElement('canvas');
						canvas.width = a.width;
						canvas.height = a.height;
						const ctx = canvas.getContext('2d');
						const pixels = (image) => {
							ctx.fillStyle = '#101014';
							ctx.fillRect(0, 0, canvas.width, canvas.height);
							ctx.drawImage(image, 0, 0);
							return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
						};
						const x = pixels(a),
							y = pixels(b),
							diff = ctx.createImageData(canvas.width, canvas.height);
						let changed = 0,
							total = 0,
							max = 0;
						for (let i = 0; i < x.length; i += 4) {
							let delta = 0;
							for (let c = 0; c < 3; c++) {
								const d = Math.abs(x[i + c] - y[i + c]);
								total += d;
								delta = Math.max(delta, d);
							}
							max = Math.max(max, delta);
							if (delta > tolerance.channelDelta) changed++;
							diff.data[i] = Math.min(255, delta * 4);
							diff.data[i + 3] = 255;
						}
						ctx.putImageData(diff, 0, 0);
						const changedFraction = changed / (x.length / 4),
							meanAbsoluteError = total / ((x.length / 4) * 3);
						return {
							pass: changedFraction <= tolerance.changedFraction && meanAbsoluteError <= tolerance.meanAbsoluteError,
							changedFraction,
							meanAbsoluteError,
							maxChannelDelta: max,
							diff: canvas.toDataURL(),
						};
					};
					const screens = await Promise.all(shots.map((s) => load(`data:image/png;base64,${s}`)));
					const montage = document.createElement('canvas');
					montage.width = screens[0].width * 2;
					montage.height = screens[0].height;
					screens.slice(0, 2).forEach((image, i) => montage.getContext('2d').drawImage(image, i * image.width, 0));
					return {
						canvas: compare(images[0], images[1]),
						repeat: compare(images[0], images[2]),
						screenshot: compare(screens[0], screens[1]),
						screenshotRepeat: compare(screens[0], screens[2]),
						montage: montage.toDataURL(),
					};
				},
				{ states, shots, tolerance: report.tolerance },
			);
			for (const kind of ['canvas', 'repeat', 'screenshot', 'screenshotRepeat'])
				if (measured[kind].diff) {
					fs.writeFileSync(path.join(output, `${name}-${kind}-diff.png`), Buffer.from(measured[kind].diff.split(',')[1], 'base64'));
					delete measured[kind].diff;
				}
			fs.writeFileSync(path.join(output, `${name}-pair.png`), Buffer.from(measured.montage.split(',')[1], 'base64'));
			delete measured.montage;
			const dimensions = states.map(({ image, ...s }) => s);
			const valid =
				measured.repeat.maxChannelDelta === 0 &&
				measured.screenshotRepeat.maxChannelDelta === 0 &&
				states.every((s) => s.width === Math.round(s.css.width * profile.dpr) && s.height === Math.round(s.css.height * profile.dpr));
			const dom = await Promise.all(
				pages.slice(0, 2).map((page) =>
					page.locator('.chart').evaluate((element) =>
						[...element.querySelectorAll('button,span,canvas')].map((el) => {
							const b = el.getBoundingClientRect(),
								s = getComputedStyle(el);
							return { tag: el.tagName, text: el.textContent, x: b.x, y: b.y, width: b.width, height: b.height, font: s.font, color: s.color, opacity: s.opacity };
						}),
					),
				),
			);
			report.results.push({ name, time, valid, ...measured, dimensions, dom, pair: `${name}-pair.png` });
			console.log(
				`${name}: ${valid ? '' : 'INVALID '}canvas ${measured.canvas.pass ? 'PASS' : 'FAIL'} ${JSON.stringify(measured.canvas)} DOM ${measured.screenshot.pass ? 'PASS' : 'FAIL'}`,
			);
		}
		for (const scenario of ['line', 'candle', 'morph', 'multi', 'loading', 'empty', 'windows', 'pause', 'live']) {
			await Promise.all(pages.map((page) => page.evaluate((name) => window.__parity.set(name), scenario)));
			await frames(1);
			await capture(`${scenario}-first`);
			await frames(59);
			await capture(`${scenario}-1000ms`);
			if (scenario === 'morph' || scenario === 'pause') {
				await Promise.all(pages.map((page) => page.evaluate((s) => window.__parity.update(s === 'morph' ? { lineMode: true } : { paused: true }), scenario)));
				await frames(6);
				await capture(`${scenario}-transition-100ms`);
				await frames(24);
				await capture(`${scenario}-transition-500ms`);
				if (scenario === 'pause') {
					await Promise.all(pages.map((page) => page.evaluate((shift) => window.__parity.update({ shift }), Math.floor(time / 1000) + 2)));
					await frames(120);
					await capture('pause-updated-2s');
					await Promise.all(pages.map((page) => page.evaluate(() => window.__parity.update({ paused: false }))));
					await frames(30);
					await capture('pause-resume-500ms');
				}
			}
			if (scenario === 'line') {
				for (const page of pages) {
					const b = await page.locator('canvas').boundingBox();
					await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5);
				}
				await frames(12);
				await capture('hover-tooltip');
				await Promise.all(pages.map((page) => page.mouse.move(0, 0)));
				await frames(12);
			}
			if (scenario === 'windows' || scenario === 'multi') {
				for (const page of pages) await page.getByRole('button', { name: scenario === 'windows' ? /30s/ : /Asset B/ }).click();
				await frames(30);
				await capture(`${scenario}-clicked`);
			}
			if (scenario === 'live') {
				for (let second = 1; second <= 66; second++) {
					await Promise.all(pages.map((page) => page.evaluate((shift) => window.__parity.update({ shift }), Math.floor(time / 1000) + 1)));
					await frames(60);
				}
				await capture('live-66s');
			}
		}
		const callbacks = await Promise.all(pages.map((page) => page.evaluate(() => window.__parity.callbacks)));
		const callbackPass = callbacks.every(
			(events) =>
				events.some((e) => e.name === 'window' && e.secs === 30) &&
				events.some((e) => e.name === 'series' && e.id === 'b' && e.visible === false) &&
				events.some((e) => e.name === 'hover' && e.point != null) &&
				events.some((e) => e.name === 'hover' && e.point === null),
		);
		if (!callbackPass) report.errors.push(`${profile.name}: missing interaction callback`);
		report.results.push({ name: `${profile.name}-callbacks`, pass: callbackPass, callbacks });
		await context.close();
	}
} catch (error) {
	report.errors.push(error.stack);
} finally {
	report.ok = report.errors.length === 0 && report.results.length > 0 && report.results.filter((r) => r.canvas).every((r) => r.valid && r.canvas.pass && r.screenshot.pass);
	fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
	console.log(`Report: ${output}/report.json`);
	await browser?.close();
	server.kill('SIGTERM');
	if (!report.ok) process.exitCode = 1;
}
