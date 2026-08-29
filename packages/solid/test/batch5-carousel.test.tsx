import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { For, createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../src/components/carousel/carousel';

const execFileAsync = promisify(execFile);
const disposers: Array<() => void> = [];
let resizeObservers: MockResizeObserver[] = [];

class MockResizeObserver {
	readonly observed = new Set<Element>();
	disconnected = false;
	constructor(private readonly callback: ResizeObserverCallback) {
		resizeObservers.push(this);
	}
	observe(element: Element) {
		this.observed.add(element);
	}
	disconnect() {
		this.disconnected = true;
		this.observed.clear();
	}
	trigger() {
		this.callback([], this as unknown as ResizeObserver);
	}
}

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function setGeometry(element: Element, geometry: Partial<Record<'clientHeight' | 'clientWidth' | 'scrollHeight' | 'scrollWidth' | 'scrollTop' | 'scrollLeft', number>>) {
	for (const [key, value] of Object.entries(geometry)) Object.defineProperty(element, key, { configurable: true, value, writable: true });
}

function setItemRect(element: Element, left: number, top = 0) {
	Object.defineProperty(element, 'getBoundingClientRect', {
		configurable: true,
		value: () => ({ bottom: top + 100, height: 100, left, right: left + 100, top, width: 100, x: left, y: top, toJSON: () => ({}) }),
	});
}

async function frame() {
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

beforeEach(() => {
	resizeObservers = [];
	vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Solid Batch 5 Carousel lane', () => {
	it('exposes the complete family, callback refs, native attrs, region naming, and slide positions', async () => {
		const refs: Element[] = [];
		const container = mount(() => (
			<Carousel ref={(element) => refs.push(element)} aria-labelledby="carousel-title" class="root-user">
				<CarouselContent ref={(element) => refs.push(element)} class="content-user" data-content="yes">
					<CarouselItem ref={(element) => refs.push(element)}>One</CarouselItem>
					<CarouselItem aria-label="Custom slide">Two</CarouselItem>
				</CarouselContent>
				<CarouselPrevious ref={(element) => refs.push(element)} />
				<CarouselNext ref={(element) => refs.push(element)} />
			</Carousel>
		));
		await frame();
		const root = container.querySelector<HTMLElement>('[data-slot="carousel"]')!;
		const viewport = container.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
		const inner = container.querySelector<HTMLElement>('[data-slot="carousel-container"]')!;
		const items = container.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]');
		expect(root.getAttribute('role')).toBe('region');
		expect(root.getAttribute('aria-roledescription')).toBe('carousel');
		expect(root.getAttribute('aria-labelledby')).toBe('carousel-title');
		expect(root.className).toContain('root-user');
		expect(inner.className).toContain('content-user');
		expect(inner.dataset.content).toBe('yes');
		expect(items[0].getAttribute('aria-roledescription')).toBe('slide');
		expect(items[0].getAttribute('aria-label')).toBe('1 of 2');
		expect(items[1].getAttribute('aria-label')).toBe('Custom slide');
		expect(refs).toEqual([root, viewport, items[0], container.querySelector('[data-slot="carousel-previous"]'), container.querySelector('[data-slot="carousel-next"]')]);
	});

	it('measures scroll state with fractional endpoint tolerance and preserves cancellable pointer and scroll handlers', async () => {
		const calls: string[] = [];
		const scrollTo = vi.fn();
		const container = mount(() => (
			<Carousel onPointerDown={() => calls.push('pointer')}>
				<CarouselContent onScroll={() => calls.push('scroll')}>
					<CarouselItem>One</CarouselItem>
					<CarouselItem>Two</CarouselItem>
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext
					onClick={(event) => {
						calls.push('click');
						event.preventDefault();
					}}
				/>
			</Carousel>
		));
		const viewport = container.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
		const items = container.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]');
		setGeometry(viewport, { clientWidth: 100, scrollWidth: 300, scrollLeft: 0 });
		setItemRect(items[0], 0);
		setItemRect(items[1], 100);
		Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo });
		resizeObservers[0].trigger();
		await frame();
		const previous = container.querySelector<HTMLButtonElement>('[data-slot="carousel-previous"]')!;
		const next = container.querySelector<HTMLButtonElement>('[data-slot="carousel-next"]')!;
		container.querySelector<HTMLElement>('[data-slot="carousel"]')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
		expect(previous.disabled).toBe(true);
		expect(next.disabled).toBe(false);
		next.click();
		expect(calls).toEqual(['pointer', 'click']);
		expect(scrollTo).not.toHaveBeenCalled();
		viewport.scrollLeft = 199.4;
		viewport.dispatchEvent(new Event('scroll'));
		expect(calls).toEqual(['pointer', 'click', 'scroll']);
		expect(previous.disabled).toBe(false);
		expect(next.disabled).toBe(true);
	});

	it('handles axis keys and leaves focusable, widget, editable, media, and cross-axis descendant arrows native', async () => {
		let setOrientation!: (orientation: 'horizontal' | 'vertical') => void;
		const scrollTo = vi.fn();
		const container = mount(() => {
			const [orientation, updateOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal');
			setOrientation = updateOrientation;
			return (
				<Carousel orientation={orientation()} tabIndex={0}>
					<CarouselContent>
						<CarouselItem>
							<input aria-label="Slide input" />
							<div data-id="tabbable" tabIndex={0}>
								Focusable custom element
							</div>
							<div data-id="widget" role="slider">
								Custom widget
							</div>
							<div data-id="editable" contentEditable>
								Editable
							</div>
							<audio data-id="audio" controls />
						</CarouselItem>
						<CarouselItem>Two</CarouselItem>
					</CarouselContent>
				</Carousel>
			);
		});
		const root = container.querySelector<HTMLElement>('[data-slot="carousel"]')!;
		const viewport = container.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
		const items = container.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]');
		setGeometry(viewport, { clientHeight: 100, clientWidth: 100, scrollHeight: 200, scrollWidth: 200, scrollLeft: 0, scrollTop: 0 });
		setItemRect(items[0], 0, 0);
		setItemRect(items[1], 100, 100);
		Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo });
		resizeObservers[0].trigger();
		await frame();
		const horizontal = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
		root.dispatchEvent(horizontal);
		expect(horizontal.defaultPrevented).toBe(true);
		expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'smooth', left: 100 });
		for (const target of [
			container.querySelector('input'),
			container.querySelector('[data-id="tabbable"]'),
			container.querySelector('[data-id="widget"]'),
			container.querySelector('[data-id="editable"]'),
			container.querySelector('[data-id="audio"]'),
		]) {
			const interactiveArrow = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
			target!.dispatchEvent(interactiveArrow);
			expect(interactiveArrow.defaultPrevented).toBe(false);
		}
		const crossAxis = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
		root.dispatchEvent(crossAxis);
		expect(crossAxis.defaultPrevented).toBe(false);
		setOrientation('vertical');
		await frame();
		expect(root.dataset.orientation).toBe('vertical');
		const vertical = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
		root.dispatchEvent(vertical);
		expect(vertical.defaultPrevented).toBe(true);
		expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'smooth', top: 100 });
	});

	it('scopes labels, navigation, and observers to direct items of each nested carousel', async () => {
		const outerScrollTo = vi.fn();
		const innerScrollTo = vi.fn();
		const container = mount(() => (
			<Carousel aria-label="Outer" data-id="outer">
				<CarouselContent>
					<CarouselItem data-id="outer-one">
						<Carousel aria-label="Inner" data-id="inner">
							<CarouselContent>
								<CarouselItem data-id="inner-one">Inner one</CarouselItem>
								<CarouselItem data-id="inner-two">Inner two</CarouselItem>
								<CarouselItem data-id="inner-three">Inner three</CarouselItem>
							</CarouselContent>
							<CarouselNext />
						</Carousel>
					</CarouselItem>
					<CarouselItem data-id="outer-two">Outer two</CarouselItem>
				</CarouselContent>
				<CarouselNext />
			</Carousel>
		));
		const outerRoot = container.querySelector<HTMLElement>('[data-id="outer"]')!;
		const innerRoot = container.querySelector<HTMLElement>('[data-id="inner"]')!;
		const outerViewport = outerRoot.querySelector<HTMLElement>(':scope > [data-slot="carousel-content"]')!;
		const innerViewport = innerRoot.querySelector<HTMLElement>(':scope > [data-slot="carousel-content"]')!;
		const outerItems = [container.querySelector<HTMLElement>('[data-id="outer-one"]')!, container.querySelector<HTMLElement>('[data-id="outer-two"]')!];
		const innerItems = Array.from(innerRoot.querySelectorAll<HTMLElement>('[data-id^="inner-"]'));
		setGeometry(outerViewport, { clientWidth: 100, scrollWidth: 200, scrollLeft: 0 });
		setGeometry(innerViewport, { clientWidth: 100, scrollWidth: 300, scrollLeft: 0 });
		outerItems.forEach((item, index) => setItemRect(item, index * 100));
		innerItems.forEach((item, index) => setItemRect(item, index * 100));
		Object.defineProperty(outerViewport, 'scrollTo', { configurable: true, value: outerScrollTo });
		Object.defineProperty(innerViewport, 'scrollTo', { configurable: true, value: innerScrollTo });
		for (const observer of resizeObservers) observer.trigger();
		await frame();
		expect(outerItems.map((item) => item.getAttribute('aria-label'))).toEqual(['1 of 2', '2 of 2']);
		expect(innerItems.map((item) => item.getAttribute('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3']);
		outerRoot.querySelector<HTMLButtonElement>(':scope > [data-slot="carousel-next"]')!.click();
		expect(outerScrollTo).toHaveBeenCalledWith({ behavior: 'smooth', left: 100 });
		expect(innerScrollTo).not.toHaveBeenCalled();
		innerRoot.querySelector<HTMLButtonElement>(':scope > [data-slot="carousel-next"]')!.click();
		expect(innerScrollTo).toHaveBeenCalledWith({ behavior: 'smooth', left: 100 });
		const outerObserver = resizeObservers.find((observer) => observer.observed.has(outerViewport) && !observer.disconnected)!;
		const innerObserver = resizeObservers.find((observer) => observer.observed.has(innerViewport) && !observer.disconnected)!;
		expect(Array.from(outerObserver.observed)).toEqual(expect.arrayContaining([outerViewport, ...outerItems]));
		expect(innerItems.some((item) => outerObserver.observed.has(item))).toBe(false);
		expect(Array.from(innerObserver.observed)).toEqual(expect.arrayContaining([innerViewport, ...innerItems]));
		expect(outerItems.some((item) => innerObserver.observed.has(item))).toBe(false);
	});

	it('measures a constrained vertical viewport like the demo and enables its controls', async () => {
		const scrollTo = vi.fn();
		const container = mount(() => (
			<Carousel orientation="vertical" aria-label="Vertical demo">
				<CarouselContent viewportStyle={{ height: '10rem' }}>
					<CarouselItem>One</CarouselItem>
					<CarouselItem>Two</CarouselItem>
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
		));
		const viewport = container.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
		const items = container.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]');
		expect(viewport.style.height).toBe('10rem');
		setGeometry(viewport, { clientHeight: 160, scrollHeight: 320, scrollTop: 0 });
		setItemRect(items[0], 0, 0);
		setItemRect(items[1], 0, 160);
		Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo });
		for (const observer of resizeObservers) observer.trigger();
		await frame();
		expect(container.querySelector<HTMLButtonElement>('[data-slot="carousel-previous"]')!.disabled).toBe(true);
		const next = container.querySelector<HTMLButtonElement>('[data-slot="carousel-next"]')!;
		expect(next.disabled).toBe(false);
		next.click();
		expect(scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: 160 });
	});

	it('rebinds resize observation for dynamic children, updates labels, and disconnects observers on cleanup', async () => {
		let add!: () => void;
		const container = mount(() => {
			const [count, setCount] = createSignal(2);
			add = () => setCount(3);
			return (
				<Carousel>
					<CarouselContent>
						<For each={Array.from({ length: count() }, (_, index) => index)}>{(index) => <CarouselItem>{index + 1}</CarouselItem>}</For>
					</CarouselContent>
					<CarouselNext />
				</Carousel>
			);
		});
		const viewport = container.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
		setGeometry(viewport, { clientWidth: 100, scrollWidth: 300 });
		await frame();
		add();
		await Promise.resolve();
		await frame();
		const items = container.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]');
		expect(items).toHaveLength(3);
		expect(items[2].getAttribute('aria-label')).toBe('3 of 3');
		expect(resizeObservers.at(-1)?.observed.has(items[2])).toBe(true);
		for (const dispose of disposers.splice(0)) dispose();
		expect(resizeObservers.every((observer) => observer.disconnected)).toBe(true);
	});

	it('guards every provider-dependent sub-component', () => {
		expect(() => mount(() => <CarouselContent />)).toThrow('Carousel sub-components must be used within <Carousel>.');
		expect(() => mount(() => <CarouselItem />)).toThrow('Carousel sub-components must be used within <Carousel>.');
		expect(() => mount(() => <CarouselPrevious />)).toThrow('Carousel sub-components must be used within <Carousel>.');
		expect(() => mount(() => <CarouselNext />)).toThrow('Carousel sub-components must be used within <Carousel>.');
	});

	it('feature-detects observers and supports RTL negative scroll offsets', async () => {
		vi.stubGlobal('ResizeObserver', undefined);
		vi.stubGlobal('MutationObserver', undefined);
		const scrollTo = vi.fn();
		const container = mount(() => (
			<Carousel dir="rtl">
				<CarouselContent>
					<CarouselItem>One</CarouselItem>
					<CarouselItem>Two</CarouselItem>
				</CarouselContent>
				<CarouselNext />
			</Carousel>
		));
		const viewport = container.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
		const items = container.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]');
		setGeometry(viewport, { clientWidth: 100, scrollWidth: 200, scrollLeft: 0 });
		setItemRect(items[0], 100);
		setItemRect(items[1], 0);
		Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo });
		await frame();
		container.querySelector<HTMLButtonElement>('[data-slot="carousel-next"]')!.click();
		expect(scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', left: -100 });
	});
});

describe('Solid Batch 5 Carousel SSR and hydration', () => {
	it('renders deterministic disabled controls and hydrates without replacing nodes before measurement', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch5-carousel-'));
		const packageRoot = path.resolve(import.meta.dirname, '..');
		const stylesRoot = path.resolve(import.meta.dirname, '../../styles/scss');
		const solidRoot = path.resolve(packageRoot, 'node_modules/solid-js');
		const coreEntry = path.resolve(packageRoot, '../core/src/index.ts');
		const stylesPackageRoot = path.resolve(packageRoot, '../styles');
		const serverEntry = path.resolve(import.meta.dirname, 'fixtures/batch5-carousel-server.tsx');
		const clientEntry = path.resolve(import.meta.dirname, 'fixtures/batch5-carousel-client.tsx');
		const buildScript = path.join(outputRoot, 'build.mjs');
		const viteUrl = pathToFileURL(path.resolve(packageRoot, 'node_modules/vite/dist/node/index.js')).href;
		const solidPluginUrl = pathToFileURL(path.resolve(packageRoot, 'node_modules/vite-plugin-solid/dist/esm/index.mjs')).href;
		await writeFile(
			buildScript,
			`import { build } from ${JSON.stringify(viteUrl)};
			import solid from ${JSON.stringify(solidPluginUrl)};
			const root = ${JSON.stringify(packageRoot)};
			const stylesRoot = ${JSON.stringify(stylesRoot)};
			const alias = { 'solid-js': ${JSON.stringify(solidRoot)}, '@tile-ui/core': ${JSON.stringify(coreEntry)}, '@tile-ui/styles': ${JSON.stringify(stylesPackageRoot)} };
			await build({ root, plugins: [solid({ ssr: true })], logLevel: 'silent', css: { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } }, resolve: { alias }, ssr: { noExternal: true, resolve: { conditions: ['node'] } }, build: { ssr: ${JSON.stringify(serverEntry)}, outDir: ${JSON.stringify(path.join(outputRoot, 'server'))}, rollupOptions: { output: { entryFileNames: 'fixture.mjs' } } } });
			await build({ root, plugins: [solid({ solid: { hydratable: true } })], logLevel: 'silent', css: { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } }, resolve: { alias, conditions: ['browser'] }, build: { outDir: ${JSON.stringify(path.join(outputRoot, 'client'))}, lib: { entry: ${JSON.stringify(clientEntry)}, formats: ['es'], fileName: () => 'fixture.mjs' }, rollupOptions: { output: { inlineDynamicImports: true } } } });`,
		);
		try {
			await execFileAsync(process.execPath, [buildScript], { cwd: packageRoot });
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${btoa(serverCode)}`);
			const fixture = server.renderBatch5CarouselFixture() as { html: string; hydrationScript: string; renderId: string };
			expect(fixture.html.match(/disabled/g)).toHaveLength(2);
			expect(fixture.html).toContain('aria-label="Hydration carousel"');
			expect(fixture.html).not.toContain('aria-label="1 of 2"');
			document.body.innerHTML = `<div id="batch5-carousel-app">${fixture.html}</div>`;
			const hydrationCode = fixture.hydrationScript.match(/<script[^>]*>([\s\S]*)<\/script>/)?.[1];
			if (!hydrationCode) throw new Error('Missing Solid hydration script.');
			window.eval(hydrationCode);
			const hydrationState = (window as typeof window & { _$HY?: unknown })._$HY;
			Object.defineProperty(globalThis, '_$HY', { configurable: true, value: hydrationState, writable: true });
			const container = document.querySelector('#batch5-carousel-app') as HTMLElement;
			const root = container.querySelector('[data-id="hydration-carousel"]');
			const viewport = container.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
			const next = container.querySelector<HTMLButtonElement>('[data-id="hydration-next"]')!;
			setGeometry(viewport, { clientWidth: 100, scrollWidth: 200, scrollLeft: 0 });
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${btoa(`const _$HY = globalThis._$HY;\n${clientCode}`)}`);
			client.hydrateBatch5CarouselFixture(container, fixture.renderId);
			(window as typeof window & { _$HY: { fe(): void } })._$HY.fe();
			await frame();
			expect(container.querySelector('[data-id="hydration-carousel"]')).toBe(root);
			expect(container.querySelector('[data-id="hydration-next"]')).toBe(next);
			expect(next.disabled).toBe(false);
			expect(container.querySelector('[data-slot="carousel-item"]')?.getAttribute('aria-label')).toBe('1 of 2');
		} finally {
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
			await rm(outputRoot, { recursive: true, force: true });
		}
	}, 30_000);
});
