import { createContext, createEffect, createSignal, createUniqueId, onCleanup, onMount, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { computeResizableSizes, getResizableDirectionCursor, getResizableStorageKey, RESIZABLE_MIN_SIZE, resizableStyleKeys } from '@tile-ui/core';
import type { ResizableDirection, ResizablePanelGroupBaseProps } from '@tile-ui/core';
import { invokeEventHandler } from '../../utils/events';
import styles from '@tile-ui/styles/scss/components/resizable.module.scss';

interface PanelRecord {
	token: number;
	id: string;
	element?: HTMLDivElement;
}

interface HandleRecord {
	token: number;
	element?: HTMLDivElement;
}

interface ResizableContextValue {
	direction: Accessor<ResizableDirection>;
	container: Accessor<HTMLDivElement | undefined>;
	mounted: Accessor<boolean>;
	registerPanel: (id: string) => number;
	setPanelElement: (token: number, element: HTMLDivElement) => void;
	unregisterPanel: (token: number) => void;
	registerHandle: () => number;
	setHandleElement: (token: number, element: HTMLDivElement) => void;
	unregisterHandle: (token: number) => void;
	panelSize: (token: number) => number;
	handleState: (token: number) => { index: number; before?: PanelRecord; after?: PanelRecord; value: number; maximum: number };
	resize: (index: number, delta: number) => void;
	setHandleValue: (index: number, value: number) => void;
}

const ResizableContext = createContext<ResizableContextValue>();

interface CursorSession {
	token: symbol;
	cursor: string;
}

interface DocumentCursorState {
	previous: string;
	sessions: CursorSession[];
}

const documentCursorStates = new WeakMap<Document, DocumentCursorState>();

function useResizable() {
	const context = useContext(ResizableContext);
	if (!context) throw new Error('Resizable sub-components must be used within <ResizablePanelGroup>.');
	return context;
}

function assignRef<T>(ref: unknown, element: T) {
	if (typeof ref === 'function') (ref as (element: T) => void)(element);
}

function orderedByDom<T extends { token: number; element?: HTMLElement }>(records: T[]) {
	return records.slice().sort((left, right) => {
		if (!left.element || !right.element || left.element === right.element) return left.token - right.token;
		return left.element.compareDocumentPosition(right.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
	});
}

function normalizeSizes(values: number[]) {
	const total = values.reduce((sum, value) => sum + value, 0);
	return total > 0 ? values.map((value) => (value / total) * 100) : values;
}

function validStoredSizes(value: unknown, count: number): value is number[] {
	if (!Array.isArray(value) || value.length !== count || count < 1) return false;
	const values = value as unknown[];
	return (
		values.every((item) => typeof item === 'number' && Number.isFinite(item) && item >= RESIZABLE_MIN_SIZE) &&
		Math.abs(values.reduce<number>((sum, item) => sum + (item as number), 0) - 100) < 0.01
	);
}

function acquireDocumentCursor(document: Document, cursor: string) {
	let state = documentCursorStates.get(document);
	if (!state) {
		state = { previous: document.body.style.cursor, sessions: [] };
		documentCursorStates.set(document, state);
	}
	const token = Symbol('resizable-cursor');
	state.sessions.push({ token, cursor });
	document.body.style.cursor = cursor;
	return token;
}

function releaseDocumentCursor(document: Document, token: symbol) {
	const state = documentCursorStates.get(document);
	if (!state) return;
	state.sessions = state.sessions.filter((session) => session.token !== token);
	const active = state.sessions[state.sessions.length - 1];
	if (active) {
		document.body.style.cursor = active.cursor;
		return;
	}
	document.body.style.cursor = state.previous;
	documentCursorStates.delete(document);
}

export interface ResizablePanelGroupProps extends JSX.HTMLAttributes<HTMLDivElement>, ResizablePanelGroupBaseProps {
	/** 服务端渲染时声明面板顺序，以生成完整的分隔器 ARIA 关系。 */
	panelIds?: readonly string[];
}

/** SolidJS Resizable 面板组：支持动态面板、持久化、指针和键盘调整。 */
export function ResizablePanelGroup(props: ParentProps<ResizablePanelGroupProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'style', 'ref', 'direction', 'id', 'panelIds']);
	const direction = (): ResizableDirection => local.direction ?? 'horizontal';
	const declaredPanelIds = (): readonly string[] => local.panelIds ?? [];
	const [container, setContainer] = createSignal<HTMLDivElement>();
	const [panels, setPanels] = createSignal<PanelRecord[]>([]);
	const [handles, setHandles] = createSignal<HandleRecord[]>([]);
	const [sizes, setSizes] = createSignal(new Map<number, number>());
	const [mounted, setMounted] = createSignal(false);
	const [persistenceReady, setPersistenceReady] = createSignal(false);
	const [orderVersion, setOrderVersion] = createSignal(0);
	let nextToken = 0;

	const orderedPanels = () => {
		orderVersion();
		return orderedByDom(panels());
	};
	const orderedHandles = () => {
		orderVersion();
		return orderedByDom(handles());
	};

	function equalSizes(records: PanelRecord[]) {
		const size = 100 / Math.max(records.length, 1);
		return new Map(records.map((record) => [record.token, size]));
	}

	function registerPanel(id: string) {
		const token = nextToken++;
		setPanels((current) => [...current, { token, id }]);
		return token;
	}

	function setPanelElement(token: number, element: HTMLDivElement) {
		setPanels((current) => current.map((record) => (record.token === token ? { ...record, element } : record)));
	}

	function unregisterPanel(token: number) {
		setPanels((current) => current.filter((record) => record.token !== token));
	}

	function registerHandle() {
		const token = nextToken++;
		setHandles((current) => [...current, { token }]);
		return token;
	}

	function setHandleElement(token: number, element: HTMLDivElement) {
		setHandles((current) => current.map((record) => (record.token === token ? { ...record, element } : record)));
	}

	function unregisterHandle(token: number) {
		setHandles((current) => current.filter((record) => record.token !== token));
	}

	function panelSize(token: number) {
		const records = orderedPanels();
		return sizes().get(token) ?? 100 / Math.max(records.length, 1);
	}

	function handleState(token: number) {
		const panelRecords = orderedPanels();
		const handle = handles().find((record) => record.token === token);
		let index = orderedHandles().findIndex((record) => record.token === token);
		const declaredIds = declaredPanelIds();
		if (!mounted() && declaredIds.length > 1) {
			index = Math.max(0, Math.min(index, declaredIds.length - 2));
			const equalSize = 100 / declaredIds.length;
			return {
				index,
				before: { token: -index - 1, id: declaredIds[index] },
				after: { token: -index - 2, id: declaredIds[index + 1] },
				value: equalSize,
				maximum: equalSize * 2 - RESIZABLE_MIN_SIZE,
			};
		}
		if (handle?.element) {
			const nextPanel = panelRecords.findIndex(
				(record) => !!record.element && !!(handle.element!.compareDocumentPosition(record.element) & Node.DOCUMENT_POSITION_FOLLOWING),
			);
			if (nextPanel > 0) index = nextPanel - 1;
		}
		index = Math.max(0, Math.min(index, Math.max(0, panelRecords.length - 2)));
		const before = panelRecords[index];
		const after = panelRecords[index + 1];
		const value = before ? panelSize(before.token) : RESIZABLE_MIN_SIZE;
		const maximum = before && after ? value + panelSize(after.token) - RESIZABLE_MIN_SIZE : 100 - RESIZABLE_MIN_SIZE;
		return { index, before, after, value, maximum };
	}

	function resize(index: number, delta: number) {
		if (!Number.isFinite(delta)) return;
		const records = orderedPanels();
		if (!records[index] || !records[index + 1]) return;
		const current = records.map((record) => panelSize(record.token));
		const next = computeResizableSizes(current, index, delta);
		setSizes(new Map(records.map((record, itemIndex) => [record.token, next[itemIndex]])));
	}

	function setHandleValue(index: number, value: number) {
		const records = orderedPanels();
		const before = records[index];
		if (!before) return;
		resize(index, value - panelSize(before.token));
	}

	onMount(() => {
		const observer = new MutationObserver(() => setOrderVersion((version) => version + 1));
		const root = container();
		if (root) observer.observe(root, { childList: true, subtree: true });
		onCleanup(() => observer.disconnect());

		const records = orderedPanels();
		let restored: number[] | undefined;
		if (local.id) {
			const key = getResizableStorageKey(local.id);
			try {
				const stored = window.localStorage.getItem(key);
				if (stored) {
					const parsed: unknown = JSON.parse(stored);
					if (validStoredSizes(parsed, records.length)) restored = parsed;
					else window.localStorage.removeItem(key);
				}
			} catch {
				try {
					window.localStorage.removeItem(key);
				} catch {
					// Storage may be unavailable in privacy-restricted documents.
				}
			}
		}
		setSizes(restored ? new Map(records.map((record, index) => [record.token, restored![index]])) : equalSizes(records));
		setMounted(true);
		setPersistenceReady(true);
	});

	createEffect(() => {
		if (!mounted()) return;
		const records = orderedPanels();
		const current = sizes();
		if (records.length === current.size && records.every((record) => current.has(record.token))) return;
		const retained = records.map((record) => current.get(record.token)).filter((value): value is number => value !== undefined);
		if (retained.length !== records.length) {
			setSizes(equalSizes(records));
			return;
		}
		const normalized = normalizeSizes(retained);
		setSizes(new Map(records.map((record, index) => [record.token, normalized[index]])));
	});

	createEffect(() => {
		if (!persistenceReady() || !local.id) return;
		const records = orderedPanels();
		const values = records.map((record) => sizes().get(record.token));
		if (!validStoredSizes(values, records.length)) return;
		try {
			window.localStorage.setItem(getResizableStorageKey(local.id), JSON.stringify(values));
		} catch {
			// Resizing remains functional when storage writes are denied.
		}
	});

	const context: ResizableContextValue = {
		direction,
		container,
		mounted,
		registerPanel,
		setPanelElement,
		unregisterPanel,
		registerHandle,
		setHandleElement,
		unregisterHandle,
		panelSize,
		handleState,
		resize,
		setHandleValue,
	};

	return (
		<ResizableContext.Provider value={context}>
			<div
				{...rest}
				ref={(element) => {
					setContainer(element);
					assignRef(local.ref, element);
				}}
				data-slot="resizable-panel-group"
				data-direction={direction()}
				id={local.id}
				class={`${styles[resizableStyleKeys.group]} ${local.class ?? ''}`}
				style={local.style}>
				{local.children}
			</div>
		</ResizableContext.Provider>
	);
}

export interface ResizablePanelProps extends JSX.HTMLAttributes<HTMLDivElement> {}

/** SolidJS ResizablePanel：注册到最近的面板组并响应布局变化。 */
export function ResizablePanel(props: ParentProps<ResizablePanelProps>) {
	const context = useResizable();
	const [local, rest] = splitProps(props, ['class', 'children', 'style', 'ref', 'id']);
	const generatedId = `tile-solid-resizable-panel-${createUniqueId()}`;
	const id = () => local.id ?? generatedId;
	const token = context.registerPanel(id());
	onCleanup(() => context.unregisterPanel(token));
	const flex = () => (context.mounted() ? `0 0 ${context.panelSize(token)}%` : '1 1 0%');

	return (
		<div
			{...rest}
			ref={(element) => {
				context.setPanelElement(token, element);
				assignRef(local.ref, element);
			}}
			id={id()}
			data-slot="resizable-panel"
			class={`${styles[resizableStyleKeys.panel]} ${local.class ?? ''}`}
			style={typeof local.style === 'string' ? `${local.style};flex:${flex()}` : { ...local.style, flex: flex() }}>
			{local.children}
		</div>
	);
}

export interface ResizableHandleProps extends JSX.HTMLAttributes<HTMLDivElement> {
	/** 显示居中的拖拽抓手。 */
	withHandle?: boolean;
}

/** SolidJS ResizableHandle：可聚焦的分隔器，支持指针捕获及文档级回退。 */
export function ResizableHandle(props: ParentProps<ResizableHandleProps>) {
	const context = useResizable();
	const [local, rest] = splitProps(props, [
		'class',
		'children',
		'ref',
		'withHandle',
		'tabIndex',
		'onKeyDown',
		'onPointerDown',
		'onPointerMove',
		'onPointerUp',
		'onPointerCancel',
		'onLostPointerCapture',
	]);
	const token = context.registerHandle();
	const [dragging, setDragging] = createSignal(false);
	let handle: HTMLDivElement | undefined;
	let activePointer: number | undefined;
	let startCoordinate = 0;
	let lastDelta = 0;
	let totalSize = 0;
	let cursorSession: symbol | undefined;
	let fallbackListening = false;

	function ownerDocument() {
		return handle?.ownerDocument ?? document;
	}

	function hasCapture(pointerId: number) {
		if (!handle?.hasPointerCapture) return false;
		try {
			return handle.hasPointerCapture(pointerId);
		} catch {
			return false;
		}
	}

	function releaseCapture(pointerId: number) {
		if (!handle?.releasePointerCapture || !hasCapture(pointerId)) return;
		try {
			handle.releasePointerCapture(pointerId);
		} catch {
			// Capture may already be gone after cancellation or detachment.
		}
	}

	function isHandleTarget(event: PointerEvent) {
		return event.target instanceof Node && !!handle?.contains(event.target);
	}

	function removeFallbackListeners() {
		if (!fallbackListening) return;
		fallbackListening = false;
		const document = ownerDocument();
		document.removeEventListener('pointermove', handleFallbackMove);
		document.removeEventListener('pointerup', handleFallbackUp);
		document.removeEventListener('pointercancel', handleFallbackCancel);
	}

	function restoreCursor() {
		if (!cursorSession) return;
		releaseDocumentCursor(ownerDocument(), cursorSession);
		cursorSession = undefined;
	}

	function finishDrag(pointerId: number, release: boolean) {
		if (activePointer !== pointerId) return;
		activePointer = undefined;
		setDragging(false);
		removeFallbackListeners();
		restoreCursor();
		if (release) releaseCapture(pointerId);
	}

	function move(event: PointerEvent) {
		if (activePointer !== event.pointerId) return;
		const coordinate = context.direction() === 'horizontal' ? event.clientX : event.clientY;
		if (!Number.isFinite(coordinate)) return;
		const delta = totalSize > 0 ? ((coordinate - startCoordinate) / totalSize) * 100 : 0;
		context.resize(context.handleState(token).index, delta - lastDelta);
		lastDelta = delta;
	}

	function handleFallbackMove(event: PointerEvent) {
		if (isHandleTarget(event) || activePointer !== event.pointerId) return;
		invokeEventHandler(local.onPointerMove, event);
		if (!event.defaultPrevented) move(event);
	}

	function handleFallbackUp(event: PointerEvent) {
		if (isHandleTarget(event) || activePointer !== event.pointerId) return;
		invokeEventHandler(local.onPointerUp, event);
		finishDrag(event.pointerId, false);
	}

	function handleFallbackCancel(event: PointerEvent) {
		if (isHandleTarget(event) || activePointer !== event.pointerId) return;
		invokeEventHandler(local.onPointerCancel, event);
		finishDrag(event.pointerId, false);
	}

	function addFallbackListeners() {
		if (fallbackListening) return;
		fallbackListening = true;
		const document = ownerDocument();
		document.addEventListener('pointermove', handleFallbackMove);
		document.addEventListener('pointerup', handleFallbackUp);
		document.addEventListener('pointercancel', handleFallbackCancel);
	}

	onCleanup(() => {
		if (activePointer !== undefined) finishDrag(activePointer, true);
		else restoreCursor();
		removeFallbackListeners();
		context.unregisterHandle(token);
	});

	const state = () => context.handleState(token);
	const orientation = () => (context.direction() === 'horizontal' ? 'vertical' : 'horizontal');

	return (
		<div
			{...rest}
			ref={(element) => {
				handle = element;
				context.setHandleElement(token, element);
				assignRef(local.ref, element);
			}}
			role="separator"
			tabIndex={local.tabIndex ?? 0}
			aria-orientation={orientation()}
			aria-controls={[state().before?.id, state().after?.id].filter(Boolean).join(' ') || undefined}
			aria-valuemin={RESIZABLE_MIN_SIZE}
			aria-valuemax={state().maximum}
			aria-valuenow={state().value}
			data-slot="resizable-handle"
			data-active={dragging()}
			class={`${styles[resizableStyleKeys.handle]} ${local.class ?? ''}`}
			onKeyDown={(event) => {
				invokeEventHandler(local.onKeyDown, event);
				if (event.defaultPrevented) return;
				const current = state();
				const step = event.shiftKey ? 10 : 1;
				let next: number | undefined;
				switch (event.key) {
					case 'Home':
						next = RESIZABLE_MIN_SIZE;
						break;
					case 'End':
						next = current.maximum;
						break;
					case 'ArrowLeft':
						next = context.direction() === 'horizontal' ? current.value - step : undefined;
						break;
					case 'ArrowRight':
						next = context.direction() === 'horizontal' ? current.value + step : undefined;
						break;
					case 'ArrowUp':
						next = context.direction() === 'vertical' ? current.value - step : undefined;
						break;
					case 'ArrowDown':
						next = context.direction() === 'vertical' ? current.value + step : undefined;
						break;
				}
				if (next !== undefined) {
					event.preventDefault();
					context.setHandleValue(current.index, next);
				}
			}}
			onPointerDown={(event) => {
				invokeEventHandler(local.onPointerDown, event);
				if (event.defaultPrevented || event.button !== 0 || !event.isPrimary || !handle || activePointer !== undefined) return;
				const container = context.container();
				if (!container || !state().after) return;
				event.preventDefault();
				const rect = container.getBoundingClientRect();
				totalSize = context.direction() === 'horizontal' ? rect.width : rect.height;
				startCoordinate = context.direction() === 'horizontal' ? event.clientX : event.clientY;
				lastDelta = 0;
				activePointer = event.pointerId;
				setDragging(true);
				cursorSession = acquireDocumentCursor(handle.ownerDocument, getResizableDirectionCursor(context.direction()));
				try {
					handle.setPointerCapture?.(event.pointerId);
				} catch {
					// Document listeners continue the drag when capture is unavailable.
				}
				if (!hasCapture(event.pointerId)) addFallbackListeners();
			}}
			onPointerMove={(event) => {
				invokeEventHandler(local.onPointerMove, event);
				if (!event.defaultPrevented && activePointer === event.pointerId && (hasCapture(event.pointerId) || fallbackListening)) move(event);
			}}
			onPointerUp={(event) => {
				invokeEventHandler(local.onPointerUp, event);
				finishDrag(event.pointerId, true);
			}}
			onPointerCancel={(event) => {
				invokeEventHandler(local.onPointerCancel, event);
				finishDrag(event.pointerId, true);
			}}
			onLostPointerCapture={(event) => {
				invokeEventHandler(local.onLostPointerCapture, event);
				finishDrag(event.pointerId, false);
			}}>
			{local.children}
			{local.withHandle && (
				<div class={styles[resizableStyleKeys.handleBar]}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true">
						<circle cx="9" cy="12" r="1" />
						<circle cx="15" cy="12" r="1" />
						<circle cx="9" cy="5" r="1" />
						<circle cx="15" cy="5" r="1" />
						<circle cx="9" cy="19" r="1" />
						<circle cx="15" cy="19" r="1" />
					</svg>
				</div>
			)}
		</div>
	);
}

export default ResizablePanelGroup;
