import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { getDemoSource } from './demo-files.mjs';

const browser = await chromium.launch({ headless: true });
const scenarios = [
	['line', 'Live line', 1],
	['crypto', 'Crypto', 1],
	['multi', 'Multi-line', 1],
	['candle', 'Candlesticks', 1],
	['dashboard', 'Dashboard', 4],
	['sizes', 'Size variants', 4],
];
try {
	for (const [framework, port] of [
		['react', 3001],
		['vue', 3002],
		['solid', 3003],
	]) {
		const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
		const errors = [];
		await page.addInitScript(() => {
			const intervals = new Set();
			const set = window.setInterval.bind(window);
			const clear = window.clearInterval.bind(window);
			window.setInterval = (handler, delay, ...args) => {
				const id = set(handler, delay, ...args);
				if (String(handler).includes('setFeeds')) intervals.add(id);
				return id;
			};
			window.clearInterval = (id) => {
				intervals.delete(id);
				clear(id);
			};
			window.__livelineIntervals = intervals;
		});
		page.on('pageerror', (error) => errors.push(error.message));
		page.on('console', (message) => {
			if (message.type() === 'error') errors.push(message.text());
		});
		await page.goto(`http://localhost:${port}/docs/components/liveline/`, { waitUntil: 'networkidle' });
		const examples = page.locator('.demo-variants');
		await examples.waitFor();
		const tabs = examples.getByRole('tablist');
		assert.equal(await tabs.evaluate((node) => !!node.closest('.component-preview, .solid-preview')), false);
		const block = examples.locator('.component-preview, .solid-preview');
		for (const [id, title, charts] of scenarios) {
			await tabs.getByRole('tab', { name: title, exact: true }).click();
			await page.waitForTimeout(450);
			assert.equal(await block.count(), 1, `${framework}/${id}: one normal block`);
			assert.equal(await examples.locator('.ll-demo').count(), 1);
			assert.equal(await examples.locator('.ll-demo canvas').count(), charts);
			assert.equal(await page.evaluate(() => window.__livelineIntervals.size), 1, `${framework}/${id}: only active feed timer`);
			assert.ok(
				await examples
					.locator('.ll-demo canvas')
					.first()
					.evaluate((canvas) =>
						canvas
							.getContext('2d')
							.getImageData(0, 0, canvas.width, canvas.height)
							.data.some((value, index) => index % 4 === 3 && value > 0),
					),
				`${framework}/${id}: canvas is painted`,
			);
			assert.equal(await tabs.locator('[tabindex="0"]').count(), 1);
			assert.equal(await examples.getByRole('tabpanel').getAttribute('aria-labelledby'), await tabs.getByRole('tab', { selected: true }).getAttribute('id'));
			await block.getByRole('button', { name: 'View Code', exact: true }).click();
			const code = await block.locator('pre code').innerText();
			// rehype-pretty-code adds a space to otherwise empty highlighted lines.
			assert.equal(code.replace(/^[ \t]+$/gm, '').trim(), getDemoSource(framework, `liveline/${id}`).trim(), `${framework}/${id}: exact selected source`);
			await examples.getByRole('button', { name: 'Pause', exact: true }).click();
			assert.equal(await page.evaluate(() => window.__livelineIntervals.size), 0, `${framework}/${id}: paused feed timer cleaned up`);
			const status = examples.locator('.ll-status');
			const paused = await status.innerText();
			await page.waitForTimeout(400);
			assert.equal(await status.innerText(), paused);
			await examples.getByRole('button', { name: 'Resume', exact: true }).click();
			await examples.getByRole('button', { name: 'Empty', exact: true }).click();
			assert.match(await status.innerText(), /points: 0/);
			await examples.getByRole('button', { name: 'Live', exact: true }).click();
		}
		await tabs.getByRole('tab', { selected: true }).press('Home');
		assert.equal(await tabs.getByRole('tab', { selected: true }).innerText(), 'Live line');
		await tabs.getByRole('tab', { selected: true }).press('ArrowRight');
		assert.equal(await tabs.getByRole('tab', { selected: true }).innerText(), 'Crypto');
		assert.match(await examples.locator('.ll-status').innerText(), /window: 300s/);
		await tabs.getByRole('tab', { selected: true }).press('End');
		assert.equal(await tabs.getByRole('tab', { selected: true }).innerText(), 'Size variants');
		await tabs.getByRole('tab', { selected: true }).press('ArrowRight');
		assert.equal(await tabs.getByRole('tab', { selected: true }).innerText(), 'Live line');
		for (const theme of ['dark', 'light']) {
			await page.evaluate((theme) => {
				document.documentElement.dataset.theme = theme;
				document.documentElement.classList.toggle('dark', theme === 'dark');
				document.documentElement.classList.toggle('light', theme === 'light');
			}, theme);
			await page.waitForTimeout(100);
			assert.equal(await examples.locator('.ll-demo').getAttribute('data-theme'), theme);
		}
		await page.setViewportSize({ width: 390, height: 844 });
		await page.waitForTimeout(100);
		assert.ok(await examples.evaluate((node) => node.getBoundingClientRect().right <= window.innerWidth), `${framework}: mobile width`);
		assert.deepEqual(errors, [], `${framework}: console errors`);
		await page.setViewportSize({ width: 1440, height: 1000 });
		const variantShell = await block.evaluate((node) => ({ tag: node.tagName, className: node.className, surface: node.firstElementChild.className }));
		await page.goto(`http://localhost:${port}/docs/components/button/`, { waitUntil: 'networkidle' });
		const ordinary = page.locator('.component-preview, .solid-preview');
		assert.equal(await ordinary.count(), 1, `${framework}: ordinary component remains one block`);
		assert.equal(await page.locator('.demo-variants').count(), 0, `${framework}: no variant wrapper for ordinary component`);
		assert.equal(await ordinary.getByRole('tablist').count(), 0);
		assert.deepEqual(
			await ordinary.evaluate((node) => ({ tag: node.tagName, className: node.className, surface: node.firstElementChild.className })),
			variantShell,
			`${framework}: identical standard preview shell`,
		);
		await ordinary.getByRole('button', { name: 'View Code', exact: true }).click();
		assert.equal(
			(await ordinary.locator('pre code').innerText()).replace(/^[ \t]+$/gm, '').trim(),
			getDemoSource(framework, 'button').trim(),
			`${framework}: unchanged ordinary source`,
		);
		assert.deepEqual(errors, [], `${framework}: ordinary component console errors`);
		console.log(`${framework}: six scenarios, exact source, normal block, keyboard, feed state, theme, mobile and ordinary Button regression passed`);
		await page.close();
	}
} finally {
	await browser.close();
}
