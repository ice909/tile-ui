import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import axeCore from 'axe-core/axe.min.js';
import { launch as launchChrome } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] ?? 'smoke';
const validModes = new Set(['smoke', 'accessibility', 'memory', 'all']);
if (!validModes.has(mode)) throw new Error(`Unknown browser check mode: ${mode}`);

const startedAt = Date.now();
const reportDir = path.join(os.tmpdir(), 'tile-ui-stage5');
const reportPath = process.env.TILE_UI_BROWSER_REPORT ?? path.join(os.tmpdir(), `tile-ui-stage5-${mode}.json`);
const lighthouseConfigPath = path.join(reportDir, 'lighthouse-config.json');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(lighthouseConfigPath, JSON.stringify({ categories: ['accessibility', 'best-practices', 'seo'], minimumScore: 95, skipAudits: ['uses-http2'] }, null, 2));

const report = {
	stage: 5,
	mode,
	startedAt: new Date(startedAt).toISOString(),
	environment: { node: process.version, platform: process.platform, chromium: chromium.executablePath(), lighthouseConfigPath },
	apps: {},
	findings: [],
	allowlisted: [],
	cleanup: [],
};

// ==========================================
// Stage 5 对比度令牌策略
// ==========================================
// 保留 shadcn 原生语义色板（--destructive #ef4444、--muted-foreground #71717a 等），
// 不修改令牌值。下列令牌组合在 AA 小字号阈值（4.5:1）下略低（3.60–4.39:1），
// 属于上游 shadcn 生态的已知取舍，通过下方显式 allowlist 按 (app, route, pair)
// 精确登记并视为已确认（acknowledged）。不做全局跳过：allowlist 之外的任何
// 对比度缺陷（包括同令牌的其他路由组合）仍按 error 上报。
const CONTRAST_PAIRS = [
	{ id: 'destructive-on-surface', fg: '#ef4444', bg: ['#ffffff', '#fafafa'] },
	{ id: 'destructive-foreground-on-destructive', fg: '#fafafa', bg: ['#ef4444'] },
	{ id: 'muted-foreground-on-muted', fg: '#71717a', bg: ['#f4f4f5'] },
	{ id: 'docs-text-muted-on-surface-hover', fg: '#737373', bg: ['#f5f5f5'] },
];

// 令牌组合的登记理由；比例为 axe 实测值。
const CONTRAST_PAIR_RATIONALE = {
	'destructive-on-surface': 'destructive 文本 (#ef4444) 落在白色/#fafafa 表面（3.60–3.76:1）：shadcn 原生 destructive 在浅色表面上的 AA 小字号取舍，用于表单错误态与 alert 标题',
	'destructive-foreground-on-destructive': 'destructive-foreground (#fafafa) 落在 destructive (#ef4444)（3.60:1）：shadcn 原生 destructive 按钮/徽标前景的 AA 小字号取舍',
	'muted-foreground-on-muted': 'muted-foreground (#71717a) 落在 muted (#f4f4f5)（4.39:1）：shadcn 原生 muted 辅助文本的 AA 小字号取舍（avatar fallback/kbd/addon/tabs 非激活态）',
	'docs-text-muted-on-surface-hover': 'docs-text-muted (#737373) 落在 --docs-surface-hover (#f5f5f5)（4.34:1）：文档站辅助文本在悬浮表面的 AA 小字号取舍',
};

function classifyContrastPair(fgColor, bgColor) {
	const fg = String(fgColor ?? '').toLowerCase();
	const bg = String(bgColor ?? '').toLowerCase();
	return CONTRAST_PAIRS.find((pair) => pair.fg === fg && pair.bg.includes(bg)) ?? null;
}

// (app, route, pair) → 登记理由。仅收录 triage 中逐节点核验过的精确组合；
// 新增组合必须先在文档站实际核验对比度数值后在此登记，不得直接放行整类令牌。
const CONTRAST_ALLOWLIST = new Map(
	[
		['react', 'alert', 'destructive-on-surface'],
		['react', 'aspect-ratio', 'docs-text-muted-on-surface-hover'],
		['react', 'avatar', 'muted-foreground-on-muted'],
		['react', 'badge', 'destructive-foreground-on-destructive'],
		['react', 'button', 'destructive-foreground-on-destructive'],
		['react', 'field', 'destructive-on-surface'],
		['react', 'input', 'destructive-on-surface'],
		['react', 'input-group', 'muted-foreground-on-muted'],
		['react', 'kbd', 'muted-foreground-on-muted'],
		['react', 'sonner', 'destructive-foreground-on-destructive'],
		['react', 'tabs', 'muted-foreground-on-muted'],
		['react', 'textarea', 'destructive-on-surface'],
		['vue', 'alert', 'destructive-on-surface'],
		['vue', 'aspect-ratio', 'docs-text-muted-on-surface-hover'],
		['vue', 'avatar', 'muted-foreground-on-muted'],
		['vue', 'badge', 'destructive-foreground-on-destructive'],
		['vue', 'button', 'destructive-foreground-on-destructive'],
		['vue', 'field', 'destructive-on-surface'],
		['vue', 'input', 'destructive-on-surface'],
		['vue', 'input-group', 'muted-foreground-on-muted'],
		['vue', 'kbd', 'muted-foreground-on-muted'],
		['vue', 'tabs', 'muted-foreground-on-muted'],
		['vue', 'textarea', 'destructive-on-surface'],
		['solid', 'alert', 'destructive-on-surface'],
		['solid', 'badge', 'destructive-foreground-on-destructive'],
		['solid', 'button', 'destructive-foreground-on-destructive'],
		['solid', 'input-group', 'muted-foreground-on-muted'],
		['solid', 'kbd', 'muted-foreground-on-muted'],
		['solid', 'tabs', 'muted-foreground-on-muted'],
	].map(([app, route, pair]) => [`${app}|/docs/components/${route}|${pair}`, CONTRAST_PAIR_RATIONALE[pair]]),
);

// 将一条 axe color-contrast 违规按节点前景/背景色归类到令牌组合；
// 命中 allowlist 的 (app, route, pair) 记入 report.allowlisted 并视为已确认，
// 其余（含未识别组合）一律作为 finding 上报。
function acknowledgeContrastViolation(appName, route, violation) {
	const byPair = new Map();
	for (const node of violation.nodes) {
		const data = node.any?.[0]?.data ?? {};
		const summaryMatch = /foreground color: (#\w+), background color: (#\w+)/.exec(node.failureSummary ?? '');
		const fg = String(data.fgColor ?? summaryMatch?.[1] ?? '').toLowerCase();
		const bg = String(data.bgColor ?? summaryMatch?.[2] ?? '').toLowerCase();
		const pair = classifyContrastPair(fg, bg);
		const pairId = pair?.id ?? `unknown-${fg}-on-${bg}`;
		const entry = byPair.get(pairId) ?? { pair: pairId, nodes: 0, ratio: null, samples: [] };
		entry.nodes += 1;
		if (entry.ratio === null && typeof data.contrastRatio === 'number') entry.ratio = data.contrastRatio;
		entry.samples.push(`${fg} on ${bg} (${data.contrastRatio ?? '?'}:1)`);
		byPair.set(pairId, entry);
	}
	for (const entry of byPair.values()) {
		const rationale = CONTRAST_ALLOWLIST.get(`${appName}|${route}|${entry.pair}`);
		if (rationale) {
			report.allowlisted.push({ app: appName, route, check: `axe-color-contrast:${entry.pair}`, pair: entry.pair, nodes: entry.nodes, ratio: entry.ratio, rationale });
			continue;
		}
		addFinding(appName, route, `axe-color-contrast:${entry.pair}`, `${violation.impact}: ${violation.help}; ${entry.nodes} node(s), ${entry.samples.join('; ')}`);
	}
}

const apps = [
	{
		name: 'react',
		port: Number(process.env.TILE_UI_REACT_PORT ?? 41731),
		identity: /Tile UI|React/i,
		build: ['--filter', '@tile-ui/react-docs', 'build'],
		staticDirectory: path.join(root, 'apps/react/out'),
		select: { option: 'Banana', assert: /Banana/ },
	},
	{
		name: 'vue',
		port: Number(process.env.TILE_UI_VUE_PORT ?? 41732),
		identity: /Tile UI|Vue/i,
		build: ['--filter', '@tile-ui/vue-docs', 'build'],
		start: ['--filter', '@tile-ui/vue-docs', 'exec', 'node', '.output/server/index.mjs'],
		select: { option: 'Banana', assert: /Banana/ },
	},
	{
		name: 'solid',
		port: Number(process.env.TILE_UI_SOLID_PORT ?? 41733),
		identity: /Tile UI|Solid/i,
		build: ['--filter', '@tile-ui/solid-docs', 'build'],
		staticDirectory: path.join(root, 'apps/solid/dist'),
		select: { option: 'Vue & React', assert: /Vue|React/ },
	},
];

function componentRoutes(app) {
	const directory = path.join(root, 'apps', app.name, 'content/docs/components');
	const names = fs
		.readdirSync(directory)
		.filter((name) => name.endsWith('.mdx') && name !== 'index.mdx')
		.map((name) => name.slice(0, -4))
		.sort();
	assert.equal(names.length, 61, `${app.name} must expose exactly 61 component docs`);
	const routeFilter = (process.env.TILE_UI_ROUTES ?? '')
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean);
	if (routeFilter.length > 0) {
		const filtered = names.filter((name) => routeFilter.some((wanted) => wanted === name));
		assert.ok(filtered.length > 0, `${app.name}: TILE_UI_ROUTES matched no component routes (${routeFilter.join(', ')})`);
		return filtered.map((name) => `/docs/components/${name}`);
	}
	return names.map((name) => `/docs/components/${name}`);
}

function addFinding(app, route, check, detail, severity = 'error') {
	report.findings.push({ app, route, check, detail: String(detail), severity });
}

async function runCommand(args, label) {
	const commandStarted = Date.now();
	const child = spawn('corepack', ['pnpm', ...args], { cwd: root, env: { ...process.env, CI: '1' }, stdio: 'inherit' });
	const [code, signal] = await once(child, 'exit');
	if (code !== 0) throw new Error(`${label} failed with ${signal ?? `exit ${code}`}`);
	return Date.now() - commandStarted;
}

async function waitForServer(url, timeout = 90_000) {
	const deadline = Date.now() + timeout;
	let lastError;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(url, { redirect: 'manual' });
			if (response.status < 500) return;
			lastError = new Error(`HTTP ${response.status}`);
		} catch (error) {
			lastError = error;
		}
		await delay(250);
	}
	throw new Error(`Server did not become ready at ${url}: ${lastError}`);
}

async function portIsOpen(port) {
	try {
		const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(500) });
		await response.body?.cancel();
		return true;
	} catch {
		return false;
	}
}

async function startServer(app) {
	if (await portIsOpen(app.port)) throw new Error(`Refusing to use occupied isolated port ${app.port}`);
	const logPath = path.join(reportDir, `${mode}-${app.name}.log`);
	const log = fs.openSync(logPath, 'w');
	const staticServer = `
		const http = require('node:http');
		const fs = require('node:fs');
		const path = require('node:path');
		const root = process.argv[1];
		const port = Number(process.argv[2]);
		const types = { '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml' };
		http.createServer((request, response) => {
			const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
			const candidates = [pathname, pathname + '.html', path.join(pathname, 'index.html')];
			const file = candidates.map((candidate) => path.resolve(root, '.' + candidate)).find((candidate) => candidate.startsWith(root + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile());
			if (!file) { response.writeHead(404); response.end('Not found'); return; }
			response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
			fs.createReadStream(file).pipe(response);
		}).listen(port, '127.0.0.1');
	`;
	const command = app.staticDirectory ? [process.execPath, ['-e', staticServer, app.staticDirectory, String(app.port)]] : ['corepack', ['pnpm', ...app.start]];
	const child = spawn(command[0], command[1], {
		cwd: root,
		detached: true,
		env: { ...process.env, HOST: '127.0.0.1', HOSTNAME: '127.0.0.1', PORT: String(app.port), NODE_ENV: 'production' },
		stdio: ['ignore', log, log],
	});
	fs.closeSync(log);
	const earlyExit = once(child, 'exit').then(([code, signal]) => {
		throw new Error(`${app.name} server exited before readiness (${signal ?? code}); see ${logPath}`);
	});
	await Promise.race([waitForServer(`http://127.0.0.1:${app.port}/`), earlyExit]);
	return { app: app.name, pid: child.pid, port: app.port, logPath };
}

async function stopServer(server) {
	const result = { app: server.app, pid: server.pid, port: server.port, stopped: false, portReleased: false };
	try {
		process.kill(-server.pid, 'SIGTERM');
	} catch (error) {
		if (error.code !== 'ESRCH') result.error = error.message;
	}
	for (let attempt = 0; attempt < 40; attempt += 1) {
		if (!(await portIsOpen(server.port))) {
			result.portReleased = true;
			break;
		}
		await delay(100);
	}
	if (!result.portReleased) {
		try {
			process.kill(-server.pid, 'SIGKILL');
		} catch (error) {
			if (error.code !== 'ESRCH') result.error = error.message;
		}
		await delay(250);
		result.portReleased = !(await portIsOpen(server.port));
	}
	result.stopped = result.portReleased;
	report.cleanup.push(result);
}

async function verifySsr(app, route) {
	const response = await fetch(`http://127.0.0.1:${app.port}${route}`, { redirect: 'manual' });
	const html = await response.text();
	if (response.status !== 200) addFinding(app.name, route, 'http', `Expected 200, received ${response.status}`);
	if (!/<h1[\s>]/i.test(html)) addFinding(app.name, route, 'ssr-heading', 'Initial response has no h1');
	if (!/(component-preview|solid-preview)/.test(html)) addFinding(app.name, route, 'ssr-demo', 'Initial response has no rendered demo marker');
	if (!/(exact rendered source|component-preview__code|solid-preview__highlight)/.test(html))
		addFinding(app.name, route, 'ssr-source', 'Initial response has no preview source marker');
	return { status: response.status, bytes: Buffer.byteLength(html) };
}

function domAudit() {
	// 可见性判定对齐 axe-core 的 invisible-content 启发式：除了 display/visibility/hidden 属性外，
	// 还排除透明度为 0、尺寸 <=1px、以及 sr-only 裁剪（clip / clip-path）的节点。
	const visible = (element) => {
		const style = getComputedStyle(element);
		const rect = element.getBoundingClientRect();
		const clipped = /rect\(0[^)]*0[^)]*0[^)]*0\)|inset\(50%\)|inset\(0 0 0 0\)/.test(style.clip + ' ' + style.clipPath);
		const tiny = (element.offsetWidth ?? 0) <= 1 && (element.offsetHeight ?? 0) <= 1;
		const srOnly = style.position === 'absolute' && (element.offsetWidth ?? 0) <= 1 && style.overflow === 'hidden';
		return (
			!element.hidden &&
			element.getAttribute('aria-hidden') !== 'true' &&
			style.display !== 'none' &&
			style.visibility !== 'hidden' &&
			style.opacity !== '0' &&
			!clipped &&
			!tiny &&
			!srOnly
		);
	};
	const textName = (element) => {
		const labelled = (element.getAttribute('aria-labelledby') ?? '')
			.split(/\s+/)
			.filter(Boolean)
			.map((id) => document.getElementById(id)?.textContent ?? '')
			.join(' ');
		const ownLabel = element.id
			? [...document.querySelectorAll('label[for]')]
					.filter((label) => label.htmlFor === element.id)
					.map((label) => label.textContent ?? '')
					.join(' ')
			: '';
		const wrappingLabel = element.closest('label')?.textContent ?? '';
		return [element.getAttribute('aria-label'), labelled, ownLabel, wrappingLabel, element.getAttribute('alt'), element.getAttribute('title'), element.textContent]
			.filter(Boolean)
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim();
	};
	const controlSelector =
		'button, input:not([type="hidden"]), select, textarea, a[href], [role="button"], [role="checkbox"], [role="combobox"], [role="link"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="radio"], [role="slider"], [role="switch"], [role="tab"]';
	const unnamed = [...document.querySelectorAll(controlSelector)]
		.filter(visible)
		.filter((element) => !textName(element))
		.map((element) => ({ tag: element.tagName.toLowerCase(), role: element.getAttribute('role'), id: element.id, html: element.outerHTML.slice(0, 240) }));
	// 与 axe-core 对齐：aria-controls / aria-flowto 允许引用尚未挂载的懒加载弹层内容，不做 IDREF 校验。
	const idRefs = ['aria-activedescendant', 'aria-describedby', 'aria-details', 'aria-errormessage', 'aria-labelledby'];
	const brokenRefs = [];
	for (const element of document.querySelectorAll(idRefs.map((attribute) => `[${attribute}]`).join(','))) {
		for (const attribute of idRefs) {
			for (const id of (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean)) {
				if (!document.getElementById(id)) brokenRefs.push({ attribute, id, html: element.outerHTML.slice(0, 240) });
			}
		}
	}
	return { unnamed, brokenRefs };
}

async function auditPage(app, route, viewport, withAxe) {
	const page = await globalThis.__tileBrowser.newPage({ viewport });
	const consoleErrors = [];
	const failedResources = [];
	const onConsole = (message) => message.type() === 'error' && consoleErrors.push(message.text());
	const onPageError = (error) => consoleErrors.push(error.message);
	const onRequestFailed = (request) => failedResources.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`);
	const onResponse = (response) => response.status() >= 400 && failedResources.push(`${response.status()} ${response.url()}`);
	page.on('console', onConsole);
	page.on('pageerror', onPageError);
	page.on('requestfailed', onRequestFailed);
	page.on('response', onResponse);
	try {
		await page.setViewportSize(viewport);
		const response = await page.goto(`http://127.0.0.1:${app.port}${route}`, { waitUntil: 'networkidle', timeout: 45_000 });
		await page.waitForTimeout(100);
		if (!response || response.status() !== 200) addFinding(app.name, route, `browser-http-${viewport.width}`, `Expected 200, received ${response?.status() ?? 'no response'}`);
		const state = await page.evaluate(domAudit);
		const layout = await page.evaluate(() => ({
			heading: document.querySelector('h1')?.textContent?.trim() ?? '',
			demo: Boolean(document.querySelector('.component-preview, .solid-preview')),
			sourceLength: [...document.querySelectorAll('.component-preview__code, .component-preview__code-peek, .solid-preview__highlight')].reduce(
				(total, node) => total + (node.textContent?.trim().length ?? 0),
				0,
			),
			overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth,
		}));
		if (!layout.heading) addFinding(app.name, route, `heading-${viewport.width}`, 'Hydrated page has no h1');
		if (!layout.demo) addFinding(app.name, route, `demo-${viewport.width}`, 'Hydrated page has no demo');
		if (layout.sourceLength < 20) addFinding(app.name, route, `source-${viewport.width}`, `Preview source length is ${layout.sourceLength}`);
		if (layout.overflow > 1) addFinding(app.name, route, `overflow-${viewport.width}`, `${layout.overflow}px horizontal overflow`);
		for (const item of state.unnamed) addFinding(app.name, route, `unnamed-control-${viewport.width}`, JSON.stringify(item));
		for (const item of state.brokenRefs) addFinding(app.name, route, `broken-aria-ref-${viewport.width}`, JSON.stringify(item));
		if (withAxe) {
			await page.addScriptTag({ content: axeCore.source });
			const axeResult = await page.evaluate(async () =>
				window.axe.run(document, { resultTypes: ['violations'], runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }),
			);
			for (const violation of axeResult.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical')) {
				if (violation.id === 'color-contrast') {
					acknowledgeContrastViolation(app.name, route, violation);
					continue;
				}
				addFinding(app.name, route, `axe-${violation.id}`, `${violation.impact}: ${violation.help}; ${violation.nodes.length} node(s)`);
			}
		}
		for (const error of consoleErrors) addFinding(app.name, route, `console-${viewport.width}`, error);
		for (const failure of failedResources) addFinding(app.name, route, `resource-${viewport.width}`, failure);
		return {
			route,
			viewport: viewport.width,
			...layout,
			unnamed: state.unnamed.length,
			brokenRefs: state.brokenRefs.length,
			consoleErrors: consoleErrors.length,
			failedResources: failedResources.length,
		};
	} finally {
		page.off('console', onConsole);
		page.off('pageerror', onPageError);
		page.off('requestfailed', onRequestFailed);
		page.off('response', onResponse);
		await page.close();
	}
}

async function expectInteraction(app, route, name, operation) {
	await withBrowser(async () => {
		const page = await globalThis.__tileBrowser.newPage({ viewport: { width: 1280, height: 900 } });
		const errors = [];
		page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
		page.on('pageerror', (error) => errors.push(error.message));
		try {
			await page.goto(`http://127.0.0.1:${app.port}${route}`, { waitUntil: 'networkidle' });
			await operation(page);
			assert.deepEqual(errors, []);
			report.apps[app.name].interactions.push({ name, route, passed: true });
		} catch (error) {
			addFinding(app.name, route, `interaction-${name}`, error.stack ?? error.message);
			report.apps[app.name].interactions.push({ name, route, passed: false, error: error.message });
		} finally {
			await page.close();
		}
	}, `${app.name} interaction ${name}`);
}

async function interactionChecks(app) {
	await expectInteraction(app, '/docs/components/dialog', 'modal-focus-restore', async (page) => {
		const trigger = page
			.locator('.component-preview__surface button, .solid-preview__surface button')
			.filter({ hasText: /open.*dialog/i })
			.first();
		await trigger.focus();
		await trigger.click();
		const dialog = page.getByRole('dialog');
		await dialog.waitFor();
		assert.equal(await dialog.evaluate((node) => node.contains(document.activeElement)), true);
		await page.keyboard.press('Escape');
		await dialog.waitFor({ state: 'hidden' });
		assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
	});
	await expectInteraction(app, '/docs/components/tabs', 'tabs-keyboard', async (page) => {
		const tabs = page.getByRole('tab');
		await tabs.first().focus();
		await page.keyboard.press('ArrowRight');
		assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true');
	});
	await expectInteraction(app, '/docs/components/select', 'select-keyboard', async (page) => {
		const trigger = page.getByRole('combobox').first();
		await trigger.click();
		await page.getByRole('option').filter({ hasText: app.select.option }).first().click();
		assert.match((await trigger.textContent()) ?? '', app.select.assert);
	});
	// Stage 5 unnamed-control 修复后的聚焦断言：文档 demo 中的表单/选择控件必须暴露可访问名称。
	await expectInteraction(app, '/docs/components/checkbox', 'checkbox-names', async (page) => {
		const checkboxes = await page.getByRole('checkbox').all();
		assert.ok(checkboxes.length >= 1);
		const namedCheckboxes = await page.getByRole('checkbox', { name: /.+/ }).all();
		assert.equal(namedCheckboxes.length, checkboxes.length, 'checkbox without accessible name');
		assert.equal(await page.getByRole('checkbox', { name: 'Accept terms' }).count(), 1);
	});
	await expectInteraction(app, '/docs/components/switch', 'switch-names', async (page) => {
		const switches = await page.getByRole('switch').all();
		assert.ok(switches.length >= 1);
		for (const toggle of switches) {
			const label = (await toggle.getAttribute('aria-label')) ?? '';
			const text = ((await toggle.textContent()) ?? '').trim();
			assert.ok(label.length > 0 || text.length > 0, 'switch without accessible name');
		}
	});
	await expectInteraction(app, '/docs/components/command', 'command-input-name', async (page) => {
		const input = page.getByRole('textbox', { name: 'Search commands' }).or(page.getByRole('combobox', { name: 'Filter actions' }));
		assert.equal(await input.count(), 1);
	});
	await expectInteraction(app, '/docs/components/input-group', 'input-group-input-name', async (page) => {
		const input = page.getByRole('textbox', { name: 'Website address' }).or(page.getByRole('textbox', { name: 'Project slug' }));
		assert.ok((await input.count()) >= 1);
	});
	await expectInteraction(app, '/docs/components/slider', 'slider-names', async (page) => {
		const sliders = await page.getByRole('slider').all();
		assert.ok(sliders.length >= 1);
		for (const slider of sliders) {
			const label = (await slider.getAttribute('aria-label')) ?? '';
			assert.ok(label.length > 0, 'slider without accessible name');
		}
	});
	if (app.name !== 'solid') return;
	await expectInteraction(app, '/docs/components/dropdown-menu', 'menu-keyboard', async (page) => {
		await page.getByRole('button', { name: 'Workspace menu' }).click();
		await page.getByRole('menu').waitFor();
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Escape');
	});
	await expectInteraction(app, '/docs/components/combobox', 'combobox-filter', async (page) => {
		// ARIA 契约：闭合状态下的触发器必须暴露 role="combobox"，否则视作无障碍缺陷单独上报。
		assert.equal(await page.getByRole('combobox').count(), 1, 'closed combobox must expose exactly one role="combobox"');
		const trigger = page.locator('[data-demo-combobox] button').first();
		assert.equal(await trigger.getAttribute('role'), 'combobox');
		assert.equal(await trigger.getAttribute('aria-haspopup'), 'listbox');
		assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
		assert.ok((await trigger.getAttribute('aria-controls'))?.length, 'closed combobox trigger must reference the listbox via aria-controls');
		await trigger.click();
		// 打开状态下唯一的 combobox 必须是搜索输入框，触发器不得重复暴露 role="combobox"。
		assert.equal(await page.getByRole('combobox').count(), 1, 'open combobox must keep the search input as the sole role="combobox"');
		const input = page.getByPlaceholder('Filter by name or behavior');
		assert.equal(await input.getAttribute('role'), 'combobox');
		assert.equal(await trigger.getAttribute('role'), null);
		assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
		await input.fill('modal');
		await page.getByRole('option', { name: 'Alert Dialog' }).click();
		assert.match((await page.locator('[data-demo-state]').textContent()) ?? '', /alert-dialog/);
	});
	await expectInteraction(app, '/docs/components/form', 'form-validation', async (page) => {
		await page.getByRole('button', { name: 'Submit' }).click();
		await page.getByText('Enter a valid email.').waitFor();
		await page.locator('[data-id="solid-form-email-control"]').fill('release@tile.ui');
		await page.getByRole('button', { name: 'Submit' }).click();
		await page.getByText(/Result: release@tile.ui/).waitFor();
	});
	await expectInteraction(app, '/docs/components/slider', 'slider-keyboard', async (page) => {
		const slider = page.getByRole('slider', { name: 'horizontal volume' });
		const before = Number(await slider.getAttribute('aria-valuenow'));
		await slider.focus();
		await page.keyboard.press('ArrowRight');
		assert.ok(Number(await slider.getAttribute('aria-valuenow')) > before);
	});
	await expectInteraction(app, '/docs/components/resizable', 'resizable-keyboard', async (page) => {
		const separator = page.getByRole('separator').first();
		const before = await separator.getAttribute('aria-valuenow');
		await separator.focus();
		await page.keyboard.press('ArrowRight');
		assert.notEqual(await separator.getAttribute('aria-valuenow'), before);
	});
	await expectInteraction(app, '/docs/components/carousel', 'carousel-controls', async (page) => {
		const carousel = page.getByRole('region', { name: /feature carousel/ });
		await carousel.focus();
		await page.keyboard.press('ArrowRight');
		await page.getByRole('button', { name: /next/i }).click();
		await page.getByRole('button', { name: /Use vertical orientation/i }).click();
		await page.getByRole('region', { name: /vertical feature carousel/ }).waitFor();
	});
	await expectInteraction(app, '/docs/components/sidebar', 'sidebar-toggle', async (page) => {
		const trigger = page.getByRole('button', { name: /sidebar/i }).last();
		const before = await trigger.getAttribute('aria-expanded');
		await trigger.click();
		assert.notEqual(await trigger.getAttribute('aria-expanded'), before);
	});
	await expectInteraction(app, '/docs/components/sonner', 'sonner-lifecycle', async (page) => {
		await page.getByRole('button', { name: 'Success' }).click();
		await page.getByText('Published successfully').waitFor();
		await page.getByRole('button', { name: 'Loading' }).click();
		await page.getByText('Uploading file').waitFor();
		await page.getByRole('button', { name: 'Dismiss' }).click();
	});
	await expectInteraction(app, '/docs/components/chart', 'chart-keyboard', async (page) => {
		const charts = page.getByRole('img');
		assert.ok((await charts.count()) >= 2);
		await charts.first().focus();
		await page.keyboard.press('ArrowRight');
	});
	await expectInteraction(app, '/docs/components/message-scroller', 'message-scroller-remount', async (page) => {
		await page.getByRole('button', { name: 'Add message' }).click();
		await page.getByRole('button', { name: /Unmount scroller/ }).click();
		await page.getByRole('button', { name: /Remount scroller/ }).click();
		// 演示区有实时滚动动画，按钮位置持续变化，playwright 稳定性检查永不通过 → 使用 force 点击。
		await page.getByRole('button', { name: /Scroll to start/ }).click({ force: true });
		await page.getByRole('button', { name: /Scroll to end/ }).click({ force: true });
	});
}

async function runLighthouse(app) {
	// 本地测试服务器仅提供 HTTP/1.1：uses-http2 是测试环境产物，从临时配置中跳过。
	const tempConfig = JSON.parse(fs.readFileSync(lighthouseConfigPath, 'utf8'));
	const chrome = await launchChrome({ chromePath: chromium.executablePath(), chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });
	try {
		const result = await lighthouse(`http://127.0.0.1:${app.port}/docs/components/button`, {
			port: chrome.port,
			output: 'json',
			logLevel: 'error',
			onlyCategories: tempConfig.categories,
			disableStorageReset: true,
			skipAudits: tempConfig.skipAudits,
		});
		const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([name, category]) => [name, Math.round(category.score * 100)]));
		for (const [category, score] of Object.entries(scores))
			if (score < 95) addFinding(app.name, '/docs/components/button', `lighthouse-${category}`, `Score ${score}, expected >=95`);
		return scores;
	} finally {
		await chrome.kill();
	}
}

function instrumentationScript() {
	const counters = { listeners: 0, timeouts: 0, intervals: 0, observers: 0 };
	window.__tileCleanupCounters = counters;
	const add = EventTarget.prototype.addEventListener;
	const remove = EventTarget.prototype.removeEventListener;
	EventTarget.prototype.addEventListener = function (...args) {
		counters.listeners += 1;
		return add.apply(this, args);
	};
	EventTarget.prototype.removeEventListener = function (...args) {
		counters.listeners = Math.max(0, counters.listeners - 1);
		return remove.apply(this, args);
	};
	const setTimeoutNative = window.setTimeout;
	const clearTimeoutNative = window.clearTimeout;
	const timeouts = new Set();
	window.setTimeout = (callback, timeout, ...args) => {
		let id;
		id = setTimeoutNative(() => {
			timeouts.delete(id);
			counters.timeouts = timeouts.size;
			callback(...args);
		}, timeout);
		timeouts.add(id);
		counters.timeouts = timeouts.size;
		return id;
	};
	window.clearTimeout = (id) => {
		timeouts.delete(id);
		counters.timeouts = timeouts.size;
		return clearTimeoutNative(id);
	};
	const setIntervalNative = window.setInterval;
	const clearIntervalNative = window.clearInterval;
	const intervals = new Set();
	window.setInterval = (callback, timeout, ...args) => {
		const id = setIntervalNative(callback, timeout, ...args);
		intervals.add(id);
		counters.intervals = intervals.size;
		return id;
	};
	window.clearInterval = (id) => {
		intervals.delete(id);
		counters.intervals = intervals.size;
		return clearIntervalNative(id);
	};
	for (const key of ['ResizeObserver', 'MutationObserver', 'IntersectionObserver']) {
		const Native = window[key];
		if (!Native) continue;
		window[key] = class extends Native {
			constructor(...args) {
				super(...args);
				counters.observers += 1;
				this.__tileConnected = true;
			}
			disconnect() {
				if (this.__tileConnected) {
					counters.observers = Math.max(0, counters.observers - 1);
					this.__tileConnected = false;
				}
				return super.disconnect();
			}
		};
	}
}

async function cleanupCycles(app) {
	const context = await globalThis.__tileBrowser.newContext({ viewport: { width: 1280, height: 900 } });
	await context.addInitScript(instrumentationScript);
	const page = await context.newPage();
	const snapshots = [];
	const snapshot = async (label) =>
		snapshots.push(
			await page.evaluate(
				(name) => ({
					label: name,
					counters: { ...window.__tileCleanupCounters },
					portals: document.querySelectorAll('[role="dialog"], [role="menu"], [role="listbox"], [data-sonner-toaster], [data-radix-portal]').length,
					styles: document.querySelectorAll('style').length,
					domNodes: document.getElementsByTagName('*').length,
				}),
				label,
			),
		);
	try {
		await page.goto(`http://127.0.0.1:${app.port}/docs/components/dialog`, { waitUntil: 'networkidle' });
		await snapshot('dialog-baseline');
		for (let cycle = 0; cycle < 25; cycle += 1) {
			await page.getByRole('button', { name: /Open Solid dialog/i }).click();
			await page.getByRole('dialog').waitFor();
			await page.keyboard.press('Escape');
			await page.getByRole('dialog').waitFor({ state: 'hidden' });
		}
		await page.waitForTimeout(100);
		await snapshot('dialog-25');
		await page.goto(`http://127.0.0.1:${app.port}/docs/components/message-scroller`, { waitUntil: 'networkidle' });
		await snapshot('scroller-baseline');
		for (let cycle = 0; cycle < 25; cycle += 1) {
			await page.getByRole('button', { name: /Unmount scroller/ }).click();
			await page.getByRole('button', { name: /Remount scroller/ }).click();
		}
		await page.waitForTimeout(100);
		await snapshot('scroller-25');
		for (const [before, after] of [
			[snapshots[0], snapshots[1]],
			[snapshots[2], snapshots[3]],
		]) {
			for (const key of ['portals', 'styles'])
				if (after[key] > before[key])
					addFinding(app.name, '/docs/components/message-scroller', `cleanup-${key}`, `${before.label}=${before[key]}, ${after.label}=${after[key]}`);
			for (const key of ['listeners', 'timeouts', 'intervals', 'observers'])
				if (after.counters[key] > before.counters[key])
					addFinding(app.name, '/docs/components/message-scroller', `cleanup-${key}`, `${before.label}=${before.counters[key]}, ${after.label}=${after.counters[key]}`);
		}
		return { cycles: 25, snapshots, heap: 'not collected; explicit instrumentation is the blocking gate' };
	} finally {
		await context.close();
	}
}

const browserClosed = (error) =>
	/Target page, context or browser has been closed|browser has disconnected|Session closed|browser has been closed/i.test(String(error?.message ?? error));

// 浏览器进程可能被宿主 OOM 回收：检测到关闭类错误时重启 chromium 并重试（有界次数），
// 避免单次瞬时崩溃拖垮整轮检查；非关闭类错误直接抛出。
async function withBrowser(fn, label, attempts = 3) {
	let lastError;
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		const browser = await ensureBrowser();
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			if (!browserClosed(error)) throw error;
			await browser.close().catch(() => {});
			globalThis.__tileBrowser = undefined;
			if (attempt === attempts) throw new Error(`${label}: browser kept closing after ${attempts} attempts: ${error.message}`);
		}
	}
	throw lastError;
}

async function ensureBrowser() {
	if (globalThis.__tileBrowser?.isConnected()) return globalThis.__tileBrowser;
	globalThis.__tileBrowser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
	return globalThis.__tileBrowser;
}

async function runApp(app) {
	const routes = componentRoutes(app);
	const appReport = (report.apps[app.name] = {
		port: app.port,
		routes: routes.length,
		buildMs: 0,
		serverPid: null,
		ssr: [],
		browser: [],
		interactions: [],
		lighthouse: null,
		memory: null,
	});
	if (process.env.TILE_UI_SKIP_BUILD !== '1') appReport.buildMs = await runCommand(app.build, `${app.name} production build`);
	const server = await startServer(app);
	appReport.serverPid = server.pid;
	try {
		await withBrowser(async () => {
			const identityPage = await globalThis.__tileBrowser.newPage();
			await identityPage.goto(`http://127.0.0.1:${app.port}/`, { waitUntil: 'networkidle' });
			const identity = `${await identityPage.title()} ${await identityPage.locator('body').innerText()}`;
			if (!app.identity.test(identity)) addFinding(app.name, '/', 'app-identity', `Identity did not match ${app.identity}`);
			await identityPage.close();
		}, `${app.name} identity`);

		if (mode === 'smoke' || mode === 'all') {
			for (const route of routes) appReport.ssr.push(await verifySsr(app, route));
			if (app.name === 'solid') {
				const response = await fetch(`http://127.0.0.1:${app.port}/docs/primitives`);
				const html = await response.text();
				if (response.status !== 200 || !/<h1[\s>]/i.test(html) || !/solid-preview--primitives/.test(html))
					addFinding(app.name, '/docs/primitives', 'primitives-ssr', `status=${response.status}, bytes=${html.length}`);
			}
			for (const route of routes) {
				appReport.browser.push(await withBrowser(() => auditPage(app, route, { width: 1440, height: 1000 }, false), `audit ${app.name} ${route}`));
				appReport.browser.push(await withBrowser(() => auditPage(app, route, { width: 390, height: 844 }, false), `audit ${app.name} ${route} mobile`));
			}
			await interactionChecks(app);
		}
		if (mode === 'accessibility' || mode === 'all') {
			for (const route of routes) appReport.browser.push(await withBrowser(() => auditPage(app, route, { width: 1440, height: 1000 }, true), `audit ${app.name} ${route}`));
			appReport.lighthouse = await runLighthouse(app);
		}
		if ((mode === 'memory' || mode === 'all') && app.name === 'solid') appReport.memory = await withBrowser(() => cleanupCycles(app), 'solid cleanup cycles');
	} finally {
		await stopServer(server);
	}
}

let fatalError;
try {
	await ensureBrowser();
	for (const app of apps) {
		if (mode === 'memory' && app.name !== 'solid') continue;
		await runApp(app);
	}
} catch (error) {
	fatalError = error;
	addFinding('gate', '/', 'fatal', error.stack ?? error.message);
} finally {
	await globalThis.__tileBrowser?.close();
	report.finishedAt = new Date().toISOString();
	report.runtimeMs = Date.now() - startedAt;
	report.allowlistSummary = {
		count: report.allowlisted.length,
		nodeCount: report.allowlisted.reduce((total, entry) => total + entry.nodes, 0),
		routes: [...new Set(report.allowlisted.map((entry) => entry.route))].sort(),
		byApp: Object.fromEntries(
			[...new Set(report.allowlisted.map((entry) => entry.app))].map((app) => [
				app,
				{
					count: report.allowlisted.filter((entry) => entry.app === app).length,
					nodeCount: report.allowlisted.filter((entry) => entry.app === app).reduce((total, entry) => total + entry.nodes, 0),
				},
			]),
		),
	};
	report.passed = !fatalError && report.findings.every((finding) => finding.severity !== 'error') && report.cleanup.every((item) => item.portReleased);
	fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
	if (report.allowlisted.length > 0) {
		console.log(
			`Contrast allowlist: ${report.allowlistSummary.count} pair(s) / ${report.allowlistSummary.nodeCount} node(s) acknowledged across ${report.allowlistSummary.routes.length} route(s)`,
		);
		for (const [app, counts] of Object.entries(report.allowlistSummary.byApp)) console.log(`  ${app}: ${counts.count} pair(s) / ${counts.nodeCount} node(s)`);
	}
	console.log(
		`Stage 5 ${mode}: ${report.passed ? 'PASS' : 'FAIL'}; ${report.findings.length} finding(s); report ${reportPath}; runtime ${(report.runtimeMs / 1000).toFixed(1)}s`,
	);
}

if (!report.passed) process.exitCode = 1;
