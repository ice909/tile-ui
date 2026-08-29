import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { For, Show, createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getResizableStorageKey } from '@tile-ui/core';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../src/components/resizable/resizable';

const disposers: Array<() => void> = [];
const execFileAsync = promisify(execFile);

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function pointer(type: string, init: PointerEventInit = {}) {
	const event = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent;
	Object.defineProperties(event, {
		pointerId: { value: init.pointerId ?? 1 },
		clientX: { value: init.clientX ?? 0 },
		clientY: { value: init.clientY ?? 0 },
		button: { value: init.button ?? 0 },
		isPrimary: { value: init.isPrimary ?? true },
	});
	return event;
}

function panels(container: ParentNode) {
	return Array.from(container.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]'));
}

function sizes(container: ParentNode) {
	return panels(container).map((panel) => Number.parseFloat(panel.style.flexBasis));
}

async function tick() {
	await Promise.resolve();
	await Promise.resolve();
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	document.body.style.cursor = '';
	localStorage.clear();
	vi.restoreAllMocks();
});

describe('Batch 5 Resizable lane', () => {
	it('exposes the full family, callback refs, attrs, equal initial sizes, and separator ARIA', () => {
		const refs: HTMLElement[] = [];
		const container = mount(() => (
			<ResizablePanelGroup ref={(element) => refs.push(element)} id="workspace-layout" class="group-user" aria-label="Workspace">
				<ResizablePanel ref={(element) => refs.push(element)} id="left-panel" class="panel-user">
					Left
				</ResizablePanel>
				<ResizableHandle ref={(element) => refs.push(element)} withHandle class="handle-user" />
				<ResizablePanel id="right-panel">Right</ResizablePanel>
			</ResizablePanelGroup>
		));
		const group = container.querySelector('[data-slot="resizable-panel-group"]') as HTMLElement;
		const handle = container.querySelector('[role="separator"]') as HTMLElement;
		expect(refs).toHaveLength(3);
		expect(group.className).toContain('group-user');
		expect(group.id).toBe('workspace-layout');
		expect(group.getAttribute('aria-label')).toBe('Workspace');
		expect(group.hasAttribute('aria-orientation')).toBe(false);
		expect(panels(container)[0].className).toContain('panel-user');
		expect(handle.className).toContain('handle-user');
		expect(sizes(container)).toEqual([50, 50]);
		expect(handle.tabIndex).toBe(0);
		expect(handle.getAttribute('aria-orientation')).toBe('vertical');
		expect(handle.getAttribute('aria-controls')).toBe('left-panel right-panel');
		expect([handle.getAttribute('aria-valuemin'), handle.getAttribute('aria-valuemax'), handle.getAttribute('aria-valuenow')]).toEqual(['10', '90', '50']);
		expect(handle.querySelector('svg')).not.toBeNull();
	});

	it('tracks keyed DOM reorders while preserving panel identity sizes and persistence order', async () => {
		const key = getResizableStorageKey('reordered-layout');
		const first = { id: 'reorder-a', label: 'A' };
		const second = { id: 'reorder-b', label: 'B' };
		let reorder!: () => void;
		const container = mount(() => {
			const [items, setItems] = createSignal([first, second]);
			reorder = () => setItems([second, first]);
			return (
				<ResizablePanelGroup id="reordered-layout" panelIds={['reorder-a', 'reorder-b', 'reorder-c']}>
					<For each={items()}>
						{(item) => (
							<>
								<ResizablePanel id={item.id}>{item.label}</ResizablePanel>
								<ResizableHandle data-owner={item.id} />
							</>
						)}
					</For>
					<ResizablePanel id="reorder-c">C</ResizablePanel>
				</ResizablePanelGroup>
			);
		});
		const originalPanels = new Map(panels(container).map((panel) => [panel.id, panel]));
		const originalHandles = new Map(Array.from(container.querySelectorAll<HTMLElement>('[data-owner]'), (handle) => [handle.dataset.owner, handle]));
		const firstHandle = container.querySelector('[data-owner="reorder-a"]') as HTMLElement;
		firstHandle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true }));
		const sizesById = new Map(panels(container).map((panel) => [panel.id, Number.parseFloat(panel.style.flexBasis)]));

		reorder();
		await tick();
		expect(panels(container).map((panel) => panel.id)).toEqual(['reorder-b', 'reorder-a', 'reorder-c']);
		for (const panel of panels(container)) {
			expect(panel).toBe(originalPanels.get(panel.id));
			expect(Number.parseFloat(panel.style.flexBasis)).toBe(sizesById.get(panel.id));
		}
		const handles = Array.from(container.querySelectorAll<HTMLElement>('[role="separator"]'));
		for (const handle of handles) {
			if (handle.dataset.owner) expect(handle).toBe(originalHandles.get(handle.dataset.owner));
		}
		expect(handles.map((handle) => handle.getAttribute('aria-controls'))).toEqual(['reorder-b reorder-a', 'reorder-a reorder-c']);
		expect(handles.map((handle) => Number(handle.getAttribute('aria-valuenow')))).toEqual([sizesById.get('reorder-b'), sizesById.get('reorder-a')]);
		expect(JSON.parse(localStorage.getItem(key)!)).toEqual([sizesById.get('reorder-b'), sizesById.get('reorder-a'), sizesById.get('reorder-c')]);
	});

	it('supports axis-aware arrows, Shift steps, Home/End, and cancellable tuple keyboard handlers', () => {
		const calls: string[] = [];
		const horizontal = mount(() => (
			<ResizablePanelGroup>
				<ResizablePanel />
				<ResizableHandle onKeyDown={[(label: string) => calls.push(label), 'horizontal']} />
				<ResizablePanel />
			</ResizablePanelGroup>
		));
		const horizontalHandle = horizontal.querySelector('[role="separator"]') as HTMLElement;
		horizontalHandle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		horizontalHandle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true }));
		expect(sizes(horizontal)).toEqual([61, 39]);
		horizontalHandle.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
		expect(sizes(horizontal)).toEqual([90, 10]);
		horizontalHandle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
		expect(sizes(horizontal)).toEqual([10, 90]);
		const crossAxis = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
		horizontalHandle.dispatchEvent(crossAxis);
		expect(crossAxis.defaultPrevented).toBe(false);
		expect(calls).toEqual(['horizontal', 'horizontal', 'horizontal', 'horizontal', 'horizontal']);

		const vertical = mount(() => (
			<ResizablePanelGroup direction="vertical">
				<ResizablePanel />
				<ResizableHandle onKeyDown={(event) => event.key === 'ArrowDown' && event.preventDefault()} />
				<ResizablePanel />
			</ResizablePanelGroup>
		));
		const verticalHandle = vertical.querySelector('[role="separator"]') as HTMLElement;
		verticalHandle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
		expect(sizes(vertical)).toEqual([50, 50]);
		verticalHandle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true, cancelable: true }));
		expect(sizes(vertical)).toEqual([40, 60]);
		expect(verticalHandle.getAttribute('aria-orientation')).toBe('horizontal');
	});

	it('keeps the active document cursor until overlapping handle sessions all finish', () => {
		const horizontal = mount(() => (
			<ResizablePanelGroup>
				<ResizablePanel />
				<ResizableHandle />
				<ResizablePanel />
			</ResizablePanelGroup>
		));
		const vertical = mount(() => (
			<ResizablePanelGroup direction="vertical">
				<ResizablePanel />
				<ResizableHandle />
				<ResizablePanel />
			</ResizablePanelGroup>
		));
		const horizontalGroup = horizontal.querySelector('[data-slot="resizable-panel-group"]') as HTMLElement;
		const verticalGroup = vertical.querySelector('[data-slot="resizable-panel-group"]') as HTMLElement;
		const horizontalHandle = horizontal.querySelector('[role="separator"]') as HTMLElement;
		const verticalHandle = vertical.querySelector('[role="separator"]') as HTMLElement;
		vi.spyOn(horizontalGroup, 'getBoundingClientRect').mockReturnValue({ width: 200, height: 100 } as DOMRect);
		vi.spyOn(verticalGroup, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 200 } as DOMRect);
		for (const handle of [horizontalHandle, verticalHandle]) {
			const captured = new Set<number>();
			Object.defineProperties(handle, {
				setPointerCapture: { configurable: true, value: (id: number) => captured.add(id) },
				hasPointerCapture: { configurable: true, value: (id: number) => captured.has(id) },
				releasePointerCapture: { configurable: true, value: (id: number) => captured.delete(id) },
			});
		}

		document.body.style.cursor = 'crosshair';
		horizontalHandle.dispatchEvent(pointer('pointerdown', { pointerId: 20, clientX: 100 }));
		expect(document.body.style.cursor).toBe('col-resize');
		verticalHandle.dispatchEvent(pointer('pointerdown', { pointerId: 21, clientY: 100 }));
		expect(document.body.style.cursor).toBe('row-resize');
		horizontalHandle.dispatchEvent(pointer('pointerup', { pointerId: 20 }));
		expect(document.body.style.cursor).toBe('row-resize');
		verticalHandle.dispatchEvent(pointer('pointercancel', { pointerId: 21 }));
		expect(document.body.style.cursor).toBe('crosshair');

		horizontalHandle.dispatchEvent(pointer('pointerdown', { pointerId: 22, clientX: 100 }));
		verticalHandle.dispatchEvent(pointer('pointerdown', { pointerId: 23, clientY: 100 }));
		verticalHandle.dispatchEvent(pointer('pointerup', { pointerId: 23 }));
		expect(document.body.style.cursor).toBe('col-resize');
		horizontalHandle.dispatchEvent(pointer('pointerup', { pointerId: 22 }));
		expect(document.body.style.cursor).toBe('crosshair');
	});

	it('restores only validated storage after mount, removes invalid data, and persists changes', () => {
		const validKey = getResizableStorageKey('valid-layout');
		localStorage.setItem(validKey, JSON.stringify([30, 70]));
		const valid = mount(() => (
			<ResizablePanelGroup id="valid-layout">
				<ResizablePanel />
				<ResizableHandle />
				<ResizablePanel />
			</ResizablePanelGroup>
		));
		expect(sizes(valid)).toEqual([30, 70]);
		(valid.querySelector('[role="separator"]') as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		expect(JSON.parse(localStorage.getItem(validKey)!)).toEqual([31, 69]);

		for (const [id, value] of [
			['bad-json', '{'],
			['bad-count', '[25,25,50]'],
			['bad-number', '[null,100]'],
			['bad-min', '[5,95]'],
			['bad-total', '[30,30]'],
		] as const) {
			const key = getResizableStorageKey(id);
			localStorage.setItem(key, value);
			const invalid = mount(() => (
				<ResizablePanelGroup id={id}>
					<ResizablePanel />
					<ResizableHandle />
					<ResizablePanel />
				</ResizablePanelGroup>
			));
			expect(sizes(invalid)).toEqual([50, 50]);
			expect(localStorage.getItem(key)).toBe('[50,50]');
		}
	});

	it('registers and unregisters dynamic panels and handles by live DOM order', async () => {
		let setMiddle!: (value: boolean) => void;
		const container = mount(() => {
			const [middle, updateMiddle] = createSignal(true);
			setMiddle = updateMiddle;
			return (
				<ResizablePanelGroup>
					<ResizablePanel id="dynamic-a">A</ResizablePanel>
					<ResizableHandle />
					<Show when={middle()}>
						<ResizablePanel id="dynamic-b">B</ResizablePanel>
						<ResizableHandle />
					</Show>
					<ResizablePanel id="dynamic-c">C</ResizablePanel>
				</ResizablePanelGroup>
			);
		});
		expect(sizes(container)).toEqual([100 / 3, 100 / 3, 100 / 3]);
		setMiddle(false);
		await tick();
		expect(sizes(container)).toEqual([50, 50]);
		const handle = container.querySelector('[role="separator"]') as HTMLElement;
		expect(handle.getAttribute('aria-controls')).toBe('dynamic-a dynamic-c');
		handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		expect(sizes(container)).toEqual([51, 49]);
		setMiddle(true);
		await tick();
		expect(sizes(container)).toEqual([100 / 3, 100 / 3, 100 / 3]);
		expect(Array.from(container.querySelectorAll('[role="separator"]'), (item) => item.getAttribute('aria-controls'))).toEqual(['dynamic-a dynamic-b', 'dynamic-b dynamic-c']);
	});

	it('clamps horizontal and vertical pointer resizing and cleans capture, cancel, lost capture, fallback, cursor, and unmount state', () => {
		const calls: string[] = [];
		const container = mount(() => (
			<ResizablePanelGroup>
				<ResizablePanel />
				<ResizableHandle
					onPointerMove={[(label: string) => calls.push(label), 'move']}
					onPointerCancel={[(label: string) => calls.push(label), 'cancel']}
					onLostPointerCapture={[(label: string) => calls.push(label), 'lost']}
				/>
				<ResizablePanel />
			</ResizablePanelGroup>
		));
		const group = container.querySelector('[data-slot="resizable-panel-group"]') as HTMLElement;
		const handle = container.querySelector('[role="separator"]') as HTMLElement;
		vi.spyOn(group, 'getBoundingClientRect').mockReturnValue({ width: 200, height: 100 } as DOMRect);
		const captured = new Set<number>();
		Object.defineProperties(handle, {
			setPointerCapture: { configurable: true, value: (id: number) => captured.add(id) },
			hasPointerCapture: { configurable: true, value: (id: number) => captured.has(id) },
			releasePointerCapture: { configurable: true, value: (id: number) => captured.delete(id) },
		});
		document.body.style.cursor = 'wait';
		handle.dispatchEvent(pointer('pointerdown', { pointerId: 3, clientX: 100 }));
		expect([captured.has(3), handle.dataset.active, document.body.style.cursor]).toEqual([true, 'true', 'col-resize']);
		handle.dispatchEvent(pointer('pointerdown', { pointerId: 30, clientX: 0 }));
		expect(captured.has(30)).toBe(false);
		handle.dispatchEvent(pointer('pointermove', { pointerId: 3, clientX: Number.NaN }));
		expect(sizes(container)).toEqual([50, 50]);
		handle.dispatchEvent(pointer('pointermove', { pointerId: 3, clientX: 300 }));
		expect(sizes(container)).toEqual([90, 10]);
		handle.dispatchEvent(pointer('pointercancel', { pointerId: 3 }));
		expect([captured.has(3), handle.dataset.active, document.body.style.cursor]).toEqual([false, 'false', 'wait']);
		handle.dispatchEvent(pointer('pointerdown', { pointerId: 4, clientX: 100 }));
		handle.dispatchEvent(pointer('lostpointercapture', { pointerId: 4 }));
		handle.dispatchEvent(pointer('pointermove', { pointerId: 4, clientX: 0 }));
		expect(calls).toEqual(['move', 'move', 'cancel', 'lost', 'move']);

		Object.defineProperties(handle, {
			setPointerCapture: {
				configurable: true,
				value: () => {
					throw new DOMException('unsupported');
				},
			},
			hasPointerCapture: { configurable: true, value: () => false },
		});
		handle.dispatchEvent(pointer('pointerdown', { pointerId: 5, clientX: 100 }));
		document.dispatchEvent(pointer('pointermove', { pointerId: 5, clientX: 0 }));
		expect(sizes(container)).toEqual([40, 60]);
		document.dispatchEvent(pointer('pointerup', { pointerId: 5 }));
		document.dispatchEvent(pointer('pointermove', { pointerId: 5, clientX: 200 }));
		expect(sizes(container)).toEqual([40, 60]);

		handle.dispatchEvent(pointer('pointerdown', { pointerId: 6, clientX: 100 }));
		const dispose = disposers.pop()!;
		dispose();
		expect(document.body.style.cursor).toBe('wait');
		document.dispatchEvent(pointer('pointermove', { pointerId: 6, clientX: 200 }));

		const vertical = mount(() => (
			<ResizablePanelGroup direction="vertical">
				<ResizablePanel />
				<ResizableHandle />
				<ResizablePanel />
			</ResizablePanelGroup>
		));
		const verticalGroup = vertical.querySelector('[data-slot="resizable-panel-group"]') as HTMLElement;
		const verticalHandle = vertical.querySelector('[role="separator"]') as HTMLElement;
		vi.spyOn(verticalGroup, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 200 } as DOMRect);
		Object.defineProperties(verticalHandle, {
			setPointerCapture: { configurable: true, value: () => {} },
			hasPointerCapture: { configurable: true, value: () => true },
			releasePointerCapture: { configurable: true, value: () => {} },
		});
		verticalHandle.dispatchEvent(pointer('pointerdown', { pointerId: 7, clientY: 100 }));
		verticalHandle.dispatchEvent(pointer('pointermove', { pointerId: 7, clientY: 40 }));
		expect(sizes(vertical)).toEqual([20, 80]);
		verticalHandle.dispatchEvent(pointer('pointerup', { pointerId: 7 }));
	});

	it('renders equal deterministic SSR sizes and hydrates in place before applying validated storage', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch5-resizable-'));
		const packageRoot = path.resolve(import.meta.dirname, '..');
		const stylesRoot = path.resolve(import.meta.dirname, '../../styles/scss');
		const solidRoot = path.resolve(packageRoot, 'node_modules/solid-js');
		const coreEntry = path.resolve(packageRoot, '../core/src/index.ts');
		const stylesPackageRoot = path.resolve(packageRoot, '../styles');
		const fixture = path.resolve(import.meta.dirname, 'fixtures/batch5-resizable-hydration.tsx');
		const serverEntry = path.join(outputRoot, 'server-entry.tsx');
		const clientEntry = path.join(outputRoot, 'client-entry.tsx');
		const buildScript = path.join(outputRoot, 'build.mjs');
		const viteUrl = pathToFileURL(path.resolve(import.meta.dirname, '../node_modules/vite/dist/node/index.js')).href;
		const solidPluginUrl = pathToFileURL(path.resolve(import.meta.dirname, '../node_modules/vite-plugin-solid/dist/esm/index.mjs')).href;
		await Promise.all([
			writeFile(
				serverEntry,
				`import { Batch5ResizableHydrationFixture as Fixture } from ${JSON.stringify(fixture)}; import { generateHydrationScript, renderToString } from 'solid-js/web'; export const renderFixture = () => ({ html: renderToString(() => <Fixture />, { renderId: 'batch5-' }), hydrationScript: generateHydrationScript(), renderId: 'batch5-' });`,
			),
			writeFile(
				clientEntry,
				`import { Batch5ResizableHydrationFixture as Fixture } from ${JSON.stringify(fixture)}; import { hydrate } from 'solid-js/web'; export const hydrateFixture = (container, renderId) => hydrate(() => <Fixture />, container, { renderId });`,
			),
			writeFile(
				buildScript,
				`import { build } from ${JSON.stringify(viteUrl)}; import solid from ${JSON.stringify(solidPluginUrl)}; const root = ${JSON.stringify(packageRoot)}; const alias = { 'solid-js': ${JSON.stringify(solidRoot)}, '@tile-ui/core': ${JSON.stringify(coreEntry)}, '@tile-ui/styles': ${JSON.stringify(stylesPackageRoot)} }; const css = { preprocessorOptions: { scss: { loadPaths: [${JSON.stringify(stylesRoot)}] } } }; await build({ root, plugins: [solid({ ssr: true })], logLevel: 'silent', css, resolve: { alias }, ssr: { noExternal: true, resolve: { conditions: ['node'] } }, build: { ssr: ${JSON.stringify(serverEntry)}, outDir: ${JSON.stringify(path.join(outputRoot, 'server'))}, rollupOptions: { output: { entryFileNames: 'fixture.mjs' } } } }); await build({ root, plugins: [solid({ solid: { hydratable: true } })], logLevel: 'silent', css, resolve: { alias, conditions: ['browser'] }, build: { outDir: ${JSON.stringify(path.join(outputRoot, 'client'))}, lib: { entry: ${JSON.stringify(clientEntry)}, formats: ['es'], fileName: () => 'fixture.mjs' }, rollupOptions: { output: { inlineDynamicImports: true } } } });`,
			),
		]);
		try {
			await execFileAsync(process.execPath, [buildScript], { cwd: packageRoot });
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${btoa(serverCode)}`);
			const first = server.renderFixture();
			const second = server.renderFixture();
			expect(second.html).toBe(first.html);
			expect(first.html.match(/flex:1 1 0%/g)).toHaveLength(2);
			expect(first.html).not.toContain('30%');
			expect(first.html).toContain('aria-controls="hydration-left hydration-right"');
			expect(first.html).toContain('aria-valuenow="50"');
			expect(first.html).not.toContain('aria-orientation="horizontal" data-id="resizable-root"');

			localStorage.setItem(getResizableStorageKey('hydration-layout'), '[30,70]');
			document.body.innerHTML = `<div id="batch5-app">${first.html}</div>`;
			const hydrationCode = first.hydrationScript.match(/<script[^>]*>([\s\S]*)<\/script>/)?.[1];
			if (!hydrationCode) throw new Error('Missing Solid hydration script.');
			window.eval(hydrationCode);
			const hydrationState = (window as typeof window & { _$HY?: unknown })._$HY;
			Object.defineProperty(globalThis, '_$HY', { configurable: true, value: hydrationState, writable: true });
			const container = document.querySelector('#batch5-app') as HTMLElement;
			const group = container.querySelector('[data-id="resizable-root"]') as HTMLElement;
			const originalPanels = panels(container);
			const originalHandle = container.querySelector('[role="separator"]') as HTMLElement;
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${btoa(`const _$HY = globalThis._$HY;\n${clientCode}`)}`);
			client.hydrateFixture(container, first.renderId);
			(window as typeof window & { _$HY: { fe(): void } })._$HY.fe();
			await tick();
			expect(container.querySelector('[data-id="resizable-root"]')).toBe(group);
			expect(panels(container)).toEqual(originalPanels);
			expect(container.querySelector('[role="separator"]')).toBe(originalHandle);
			expect(originalHandle.getAttribute('aria-controls')).toBe('hydration-left hydration-right');
			expect(originalHandle.getAttribute('aria-valuenow')).toBe('30');
			expect(sizes(container)).toEqual([30, 70]);
		} finally {
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
			await rm(outputRoot, { recursive: true, force: true });
		}
	}, 30_000);
});
