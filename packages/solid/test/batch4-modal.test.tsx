import { execFileSync } from 'node:child_process';
import { Show, createSignal, type JSX } from 'solid-js';
import { delegateEvents, render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	type AlertDialogContentProps,
} from '../src/components/alert-dialog/alert-dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '../src/components/drawer/drawer';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '../src/components/sheet/sheet';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function mountInDocument(document: Document, node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function click(element: Element) {
	element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

function pointerDown(element: Element) {
	element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true, cancelable: true }));
}

function escape() {
	document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
}

async function settle() {
	await Promise.resolve();
	for (let depth = 0; depth < 4; depth += 1) {
		await new Promise((resolve) => setTimeout(resolve, 0));
		await Promise.resolve();
	}
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	document.body.style.overflow = '';
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('Solid AlertDialog modal lane', () => {
	it('supports uncontrolled state, custom portal/IDs, registered labels, refs, cancellable events, and Cancel initial focus', async () => {
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const changes: boolean[] = [];
		const refs: Element[] = [];
		const container = mount(() => (
			<AlertDialog onOpenChange={(open) => changes.push(open)}>
				<AlertDialogTrigger ref={(element) => refs.push(element)} onClick={[(_label: string, _event: MouseEvent) => undefined, 'trigger']}>
					Delete
				</AlertDialogTrigger>
				<AlertDialogContent ref={(element) => refs.push(element)} id="custom-alert" container={portal} size="sm" data-native="content">
					<AlertDialogHeader>
						<AlertDialogTitle id="custom-alert-title">Confirm</AlertDialogTitle>
						<AlertDialogDescription id="custom-alert-description">This cannot be undone.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction>Continue</AlertDialogAction>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		));
		const trigger = container.querySelector('button')!;
		trigger.focus();
		click(trigger);
		await settle();
		const content = portal.querySelector('[role="alertdialog"]') as HTMLDivElement;
		const cancel = [...portal.querySelectorAll('button')].find((button) => button.textContent === 'Cancel')!;
		expect(content.id).toBe('custom-alert');
		expect(content.dataset.size).toBe('sm');
		expect(content.dataset.native).toBe('content');
		expect(content.getAttribute('aria-labelledby')).toBe('custom-alert-title');
		expect(content.getAttribute('aria-describedby')).toBe('custom-alert-description');
		expect(document.activeElement).toBe(cancel);
		expect(document.body.style.overflow).toBe('hidden');
		expect(refs).toEqual([trigger, content]);
		click(cancel);
		expect(changes).toEqual([true, false]);
		expect(portal.querySelector('[role="alertdialog"]')).toBeNull();
		expect(document.activeElement).toBe(trigger);
	});

	it('keeps controlled state external, honors prevented actions, and never dismisses on outside interaction', async () => {
		let setOpen!: (open: boolean) => void;
		const changes: boolean[] = [];
		const outside = document.createElement('button');
		const outsideClicks = vi.fn();
		outside.addEventListener('click', outsideClicks);
		document.body.appendChild(outside);
		const outsideEvents: string[] = [];
		mount(() => {
			const [open, update] = createSignal(true);
			setOpen = update;
			return (
				<AlertDialog open={open()} onOpenChange={(next) => changes.push(next)}>
					<AlertDialogContent onPointerDownOutside={() => outsideEvents.push('pointer')} onInteractOutside={(event) => outsideEvents.push(event.originalEvent.type)}>
						<AlertDialogTitle>Confirm</AlertDialogTitle>
						<AlertDialogAction onClick={(event) => event.preventDefault()}>Keep open</AlertDialogAction>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
					</AlertDialogContent>
				</AlertDialog>
			);
		});
		await settle();
		pointerDown(outside);
		click(outside);
		expect(outsideEvents).toEqual(['pointer', 'pointerdown']);
		expect(outsideClicks).not.toHaveBeenCalled();
		expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
		click([...document.querySelectorAll('button')].find((button) => button.textContent === 'Keep open')!);
		expect(changes).toEqual([]);
		escape();
		expect(changes).toEqual([false]);
		expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
		setOpen(false);
		expect(document.querySelector('[role="alertdialog"]')).toBeNull();
	});

	it('reactively synchronizes changing content/title/description IDs without dangling relationships', async () => {
		let setCustom!: (custom: boolean) => void;
		let setLabels!: (labels: boolean) => void;
		const container = mount(() => {
			const [custom, updateCustom] = createSignal(false);
			const [labels, updateLabels] = createSignal(true);
			setCustom = updateCustom;
			setLabels = updateLabels;
			return (
				<AlertDialog defaultOpen>
					<AlertDialogTrigger>Delete</AlertDialogTrigger>
					<AlertDialogContent id={custom() ? 'changed-content' : undefined}>
						<Show when={labels()}>
							<AlertDialogTitle id={custom() ? 'changed-title' : undefined}>Confirm</AlertDialogTitle>
							<AlertDialogDescription id={custom() ? 'changed-description' : undefined}>Description</AlertDialogDescription>
						</Show>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
					</AlertDialogContent>
				</AlertDialog>
			);
		});
		await settle();
		const trigger = container.querySelector('button')!;
		let content = document.querySelector('[role="alertdialog"]') as HTMLDivElement;
		expect(trigger.getAttribute('aria-controls')).toBe(content.id);
		expect(content.getAttribute('aria-labelledby')).toBe(content.querySelector('h2')?.id);
		expect(content.getAttribute('aria-describedby')).toBe(content.querySelector('p')?.id);
		setCustom(true);
		await settle();
		content = document.querySelector('[role="alertdialog"]') as HTMLDivElement;
		expect(content.id).toBe('changed-content');
		expect(trigger.getAttribute('aria-controls')).toBe('changed-content');
		expect(content.getAttribute('aria-labelledby')).toBe('changed-title');
		expect(content.getAttribute('aria-describedby')).toBe('changed-description');
		setLabels(false);
		await settle();
		expect(content.hasAttribute('aria-labelledby')).toBe(false);
		expect(content.hasAttribute('aria-describedby')).toBe(false);
	});
});

describe('Solid Sheet modal lane', () => {
	it('suppresses iframe-realm outside activation in the owning document', async () => {
		const iframe = document.createElement('iframe');
		document.body.appendChild(iframe);
		const iframeDocument = iframe.contentDocument!;
		const iframeView = iframe.contentWindow!;
		const realm = iframeView as Window & typeof globalThis;
		delegateEvents(['click', 'pointerdown'], iframeDocument);
		const portal = iframeDocument.createElement('div');
		iframeDocument.body.appendChild(portal);
		const outside = iframeDocument.createElement('button');
		const activations = vi.fn();
		outside.addEventListener('click', activations);
		iframeDocument.body.appendChild(outside);
		const container = mountInDocument(iframeDocument, () => (
			<Sheet>
				<SheetTrigger>Open sheet</SheetTrigger>
				<SheetContent container={portal}>
					<SheetTitle>Settings</SheetTitle>
				</SheetContent>
			</Sheet>
		));
		const trigger = container.querySelector('button') as HTMLButtonElement;
		trigger.focus();
		trigger.dispatchEvent(new realm.MouseEvent('click', { bubbles: true, cancelable: true, view: iframeView }));
		await settle();
		outside.dispatchEvent(new realm.MouseEvent('pointerdown', { bubbles: true, composed: true, cancelable: true, view: iframeView }));
		outside.dispatchEvent(new realm.MouseEvent('click', { bubbles: true, cancelable: true, view: iframeView }));
		expect(portal.querySelector('[role="dialog"]')).toBeNull();
		expect(activations).not.toHaveBeenCalled();
		outside.dispatchEvent(new realm.MouseEvent('click', { bubbles: true, cancelable: true, view: iframeView }));
		expect(activations).toHaveBeenCalledOnce();
	});

	it('supports side state, close button/footer, generated labels, outside dismissal, focus trap, and restoration', async () => {
		const container = mount(() => (
			<Sheet>
				<SheetTrigger>Open sheet</SheetTrigger>
				<SheetContent side="left">
					<SheetHeader>
						<SheetTitle>Settings</SheetTitle>
						<SheetDescription>Configure options.</SheetDescription>
					</SheetHeader>
					<button>First</button>
					<button>Last</button>
					<SheetFooter>
						<SheetClose>Footer close</SheetClose>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		));
		const trigger = container.querySelector('button')!;
		trigger.focus();
		click(trigger);
		await settle();
		const content = document.querySelector('[role="dialog"]') as HTMLDivElement;
		expect(content.dataset.side).toBe('left');
		expect(content.getAttribute('aria-labelledby')).toBe(content.querySelector('h2')?.id);
		expect(content.getAttribute('aria-describedby')).toBe(content.querySelector('p')?.id);
		expect(document.querySelector('button[aria-label="关闭"]')).not.toBeNull();
		const buttons = content.querySelectorAll('button');
		buttons[buttons.length - 1].focus();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
		expect(content.contains(document.activeElement)).toBe(true);
		pointerDown(trigger);
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		expect(document.activeElement).toBe(trigger);
	});

	it('closes on outside pointer while suppressing exactly one underlying button activation', async () => {
		const outside = document.createElement('button');
		const activations = vi.fn();
		outside.addEventListener('click', activations);
		document.body.appendChild(outside);
		mount(() => (
			<Sheet defaultOpen>
				<SheetContent>
					<SheetTitle>Settings</SheetTitle>
				</SheetContent>
			</Sheet>
		));
		await settle();
		pointerDown(outside);
		click(outside);
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		expect(activations).not.toHaveBeenCalled();
		click(outside);
		expect(activations).toHaveBeenCalledOnce();
	});
});

describe('Solid Drawer modal lane', () => {
	it('uses the directional entrance layout while preserving content styles', async () => {
		const frames: FrameRequestCallback[] = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
			frames.push(callback);
			return frames.length;
		});
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
		for (const [direction, transform] of [
			['top', 'translateY(-100%)'],
			['bottom', 'translateY(100%)'],
			['left', 'translateX(-100%)'],
			['right', 'translateX(100%)'],
		] as const) {
			mount(() => (
				<Drawer defaultOpen direction={direction}>
					<DrawerContent showCloseButton={false} style={{ color: 'red' }} aria-label={`${direction} drawer`} />
				</Drawer>
			));
			await settle();
			const content = document.querySelector(`[aria-label="${direction} drawer"]`) as HTMLDivElement;
			expect(content.style.transform).toBe(transform);
			expect(content.style.opacity).toBe('0');
			expect(content.style.color).toBe('red');
			frames.shift()?.(0);
			expect(content.style.transform).toBe('');
			expect(content.style.opacity).toBe('');
			expect(content.style.color).toBe('red');
			for (const dispose of disposers.splice(0)) dispose();
			document.body.innerHTML = '';
		}
	});

	it('renders visible content when the owner window has no animation frame API', async () => {
		vi.stubGlobal('requestAnimationFrame', undefined);
		vi.stubGlobal('cancelAnimationFrame', undefined);
		mount(() => (
			<Drawer defaultOpen direction="left">
				<DrawerContent showCloseButton={false} style={{ color: 'red' }} aria-label="fallback drawer" />
			</Drawer>
		));
		await settle();
		const content = document.querySelector('[aria-label="fallback drawer"]') as HTMLDivElement;
		expect(content.dataset.direction).toBe('left');
		expect(content.style.transform).toBe('');
		expect(content.style.opacity).toBe('');
		expect(content.style.color).toBe('red');
	});

	it('renders all directions and public structural parts with callback refs', async () => {
		for (const direction of ['top', 'bottom', 'left', 'right'] as const) {
			let contentRef: HTMLDivElement | undefined;
			const container = mount(() => (
				<Drawer defaultOpen direction={direction}>
					<DrawerTrigger>Open</DrawerTrigger>
					<DrawerContent ref={(element) => (contentRef = element)} showCloseButton={false}>
						<DrawerHeader>
							<DrawerTitle id={`${direction}-title`}>Title</DrawerTitle>
							<DrawerDescription>Description</DrawerDescription>
						</DrawerHeader>
						<DrawerFooter>
							<DrawerClose>Close</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
			));
			await settle();
			expect(contentRef?.dataset.direction).toBe(direction);
			expect(contentRef?.querySelector('h2')?.id).toBe(`${direction}-title`);
			click([...document.querySelectorAll('button')].find((button) => button.textContent === 'Close')!);
			expect(container.querySelector('[role="dialog"]')).toBeNull();
			for (const dispose of disposers.splice(0)) dispose();
			document.body.innerHTML = '';
		}
	});

	it('keeps nonmodal drawers free of overlay, trap, lock, and restoration while top-layer Escape dismisses', async () => {
		const outside = document.createElement('button');
		document.body.appendChild(outside);
		const changes: boolean[] = [];
		const escapes: string[] = [];
		const container = mount(() => (
			<Drawer modal={false} onOpenChange={(open) => changes.push(open)}>
				<DrawerTrigger>Open tools</DrawerTrigger>
				<DrawerContent onEscapeKeyDown={() => escapes.push('escape')}>
					<DrawerTitle>Tools</DrawerTitle>
					<button>Inside</button>
				</DrawerContent>
			</Drawer>
		));
		const trigger = container.querySelector('button')!;
		trigger.focus();
		click(trigger);
		await settle();
		const content = document.querySelector('[role="dialog"]') as HTMLDivElement;
		expect(content.hasAttribute('aria-modal')).toBe(false);
		expect(document.body.style.overflow).toBe('');
		expect(document.querySelector('[data-state="open"]:not([role])')).toBeNull();
		const inside = [...content.querySelectorAll('button')].find((button) => button.textContent === 'Inside')!;
		inside.focus();
		escape();
		expect(escapes).toEqual(['escape']);
		expect(changes).toEqual([true, false]);
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		expect(document.activeElement).not.toBe(trigger);
		expect(document.activeElement).toBe(document.body);
	});

	it('suppresses one underlying link activation for modal outside dismissal', async () => {
		const outside = document.createElement('a');
		outside.href = '#destination';
		const activations = vi.fn((event: MouseEvent) => event.preventDefault());
		outside.addEventListener('click', activations);
		document.body.appendChild(outside);
		mount(() => (
			<Drawer defaultOpen>
				<DrawerContent>
					<DrawerTitle>Tools</DrawerTitle>
				</DrawerContent>
			</Drawer>
		));
		await settle();
		pointerDown(outside);
		click(outside);
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		expect(activations).not.toHaveBeenCalled();
		click(outside);
		expect(activations).toHaveBeenCalledOnce();
	});

	it('allows underlying activation when a nonmodal outside pointer closes the drawer', async () => {
		const outside = document.createElement('button');
		const activations = vi.fn();
		outside.addEventListener('click', activations);
		document.body.appendChild(outside);
		mount(() => (
			<Drawer defaultOpen modal={false}>
				<DrawerContent>
					<DrawerTitle>Tools</DrawerTitle>
				</DrawerContent>
			</Drawer>
		));
		await settle();
		pointerDown(outside);
		click(outside);
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		expect(activations).toHaveBeenCalledOnce();
	});
});

describe('Solid deeply nested modal lane', () => {
	it('restores each exact trigger while Escape unwinds nested modal portals', async () => {
		const container = mount(() => (
			<Sheet>
				<SheetTrigger>Open sheet</SheetTrigger>
				<SheetContent showCloseButton={false}>
					<SheetTitle>Outer</SheetTitle>
					<Drawer>
						<DrawerTrigger>Open drawer</DrawerTrigger>
						<DrawerContent showCloseButton={false}>
							<DrawerTitle>Middle</DrawerTitle>
							<AlertDialog>
								<AlertDialogTrigger>Open alert</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogTitle>Inner</AlertDialogTitle>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
								</AlertDialogContent>
							</AlertDialog>
						</DrawerContent>
					</Drawer>
				</SheetContent>
			</Sheet>
		));
		const sheetTrigger = container.querySelector('button') as HTMLButtonElement;
		sheetTrigger.focus();
		click(sheetTrigger);
		await settle();
		const drawerTrigger = [...document.querySelectorAll('button')].find((button) => button.textContent === 'Open drawer')!;
		click(drawerTrigger);
		await settle();
		const alertTrigger = [...document.querySelectorAll('button')].find((button) => button.textContent === 'Open alert')!;
		click(alertTrigger);
		await settle();
		escape();
		expect(document.activeElement).toBe(alertTrigger);
		escape();
		expect(document.activeElement).toBe(drawerTrigger);
		escape();
		expect(document.activeElement).toBe(sheetTrigger);
	});

	it('dismisses only the top layer and reference-counts scroll lock through three portal levels', async () => {
		const changes: string[] = [];
		mount(() => (
			<Sheet defaultOpen onOpenChange={(open) => changes.push(`sheet:${open}`)}>
				<SheetContent showCloseButton={false}>
					<SheetTitle>Outer</SheetTitle>
					<Drawer defaultOpen onOpenChange={(open) => changes.push(`drawer:${open}`)}>
						<DrawerContent showCloseButton={false}>
							<DrawerTitle>Middle</DrawerTitle>
							<AlertDialog defaultOpen onOpenChange={(open) => changes.push(`alert:${open}`)}>
								<AlertDialogContent>
									<AlertDialogTitle>Inner</AlertDialogTitle>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
								</AlertDialogContent>
							</AlertDialog>
						</DrawerContent>
					</Drawer>
				</SheetContent>
			</Sheet>
		));
		await settle();
		expect(document.querySelectorAll('[role="dialog"], [role="alertdialog"]')).toHaveLength(3);
		expect(document.body.style.overflow).toBe('hidden');
		escape();
		expect(changes).toEqual(['alert:false']);
		expect(document.querySelectorAll('[role="dialog"], [role="alertdialog"]')).toHaveLength(2);
		expect(document.body.style.overflow).toBe('hidden');
		escape();
		expect(changes).toEqual(['alert:false', 'drawer:false']);
		expect(document.body.style.overflow).toBe('hidden');
		escape();
		expect(changes).toEqual(['alert:false', 'drawer:false', 'sheet:false']);
		expect(document.body.style.overflow).toBe('');
	});

	it('suppresses activation through only the top nested modal and leaves the lower layer open', async () => {
		const outside = document.createElement('button');
		const activations = vi.fn();
		outside.addEventListener('click', activations);
		document.body.appendChild(outside);
		const changes: string[] = [];
		mount(() => (
			<Sheet defaultOpen onOpenChange={(open) => changes.push(`sheet:${open}`)}>
				<SheetContent>
					<SheetTitle>Outer</SheetTitle>
					<Drawer defaultOpen onOpenChange={(open) => changes.push(`drawer:${open}`)}>
						<DrawerContent>
							<DrawerTitle>Inner</DrawerTitle>
						</DrawerContent>
					</Drawer>
				</SheetContent>
			</Sheet>
		));
		await settle();
		pointerDown(outside);
		click(outside);
		expect(changes).toEqual(['drawer:false']);
		expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
		expect(activations).not.toHaveBeenCalled();
		click(outside);
		expect(activations).toHaveBeenCalledOnce();
	});
});

describe('Solid modal SSR hydration lane', () => {
	it('is deterministic when closed and hydrates default-open portals from stable root markup', () => {
		expect(() => execFileSync(process.execPath, ['test/fixtures/batch4-modal-ssr.mjs'], { cwd: process.cwd(), stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 })).not.toThrow();
	});
});

it('rejects unsupported asChild and element-valued refs at the public type boundary', () => {
	// @ts-expect-error Solid modal triggers intentionally do not implement asChild.
	const unsupported: Parameters<typeof SheetTrigger>[0] = { asChild: true };
	// @ts-expect-error Wrapper refs are callback-only.
	const invalidRef: AlertDialogContentProps = { ref: document.createElement('div') };
	expect([unsupported, invalidRef]).toHaveLength(2);
});
