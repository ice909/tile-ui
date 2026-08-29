import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { computeResizableSizes, getResizableDirectionCursor, getResizableStorageKey, resizableStyleKeys } from '@tile-ui/core';
import type { ResizableDirection, ResizablePanelGroupBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/resizable.module.scss';

interface ResizableContextValue {
	direction: ResizableDirection;
	containerRef: React.RefObject<HTMLDivElement | null>;
	getSize: (index: number) => number;
	registerPanel: () => number;
	registerHandle: () => number;
	resize: (index: number, delta: number) => void;
}

const ResizableContext = createContext<ResizableContextValue | null>(null);

function useResizable(): ResizableContextValue {
	const context = useContext(ResizableContext);
	if (!context) {
		throw new Error('Resizable sub-components must be used within <ResizablePanelGroup>.');
	}
	return context;
}

export interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement>, ResizablePanelGroupBaseProps {}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, ResizablePanelGroupProps>(({ className = '', direction = 'horizontal', id, children, ...props }, ref) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const panelCountRef = useRef(0);
	const [panelCount, setPanelCount] = useState(0);
	const [sizes, setSizes] = useState<number[]>(() => {
		if (!id || typeof window === 'undefined') {
			return [];
		}
		const stored = window.localStorage.getItem(getResizableStorageKey(id));
		if (!stored) {
			return [];
		}
		try {
			const parsed = JSON.parse(stored);
			return Array.isArray(parsed) ? parsed.map((item: unknown) => Number(item)) : [];
		} catch {
			return [];
		}
	});

	useEffect(() => {
		if (!id || sizes.length === 0) {
			return;
		}
		window.localStorage.setItem(getResizableStorageKey(id), JSON.stringify(sizes));
	}, [id, sizes]);

	const registerPanel = useCallback(() => {
		const index = panelCountRef.current;
		panelCountRef.current += 1;
		setPanelCount(panelCountRef.current);
		return index;
	}, []);

	const registerHandle = useCallback(() => {
		return Math.max(0, panelCountRef.current - 1);
	}, []);

	const getSize = useCallback(
		(index: number) => {
			return sizes[index] ?? 100 / Math.max(panelCount, 1);
		},
		[sizes, panelCount],
	);

	const resize = useCallback((index: number, delta: number) => {
		setSizes((prev) => {
			const total = Math.max(panelCountRef.current, 2);
			const current = Array.from({ length: total }, (_item, itemIndex) => prev[itemIndex] ?? 100 / total);
			return computeResizableSizes(current, index, delta);
		});
	}, []);

	function setContainerRef(element: HTMLDivElement | null) {
		containerRef.current = element;
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	return (
		<ResizableContext.Provider value={{ direction, containerRef, getSize, registerPanel, registerHandle, resize }}>
			<div ref={setContainerRef} data-slot="resizable-panel-group" data-direction={direction} className={`${styles[resizableStyleKeys.group]} ${className}`} {...props}>
				{children}
			</div>
		</ResizableContext.Provider>
	);
});
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

export interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {}

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(({ className = '', style, children, ...props }, ref) => {
	const { getSize, registerPanel } = useResizable();
	const [index, setIndex] = useState(-1);
	const registeredRef = useRef(false);

	useEffect(() => {
		if (registeredRef.current) {
			return;
		}
		registeredRef.current = true;
		setIndex(registerPanel());
	}, [registerPanel]);

	const size = index >= 0 ? getSize(index) : undefined;

	return (
		<div
			ref={ref}
			data-slot="resizable-panel"
			className={`${styles[resizableStyleKeys.panel]} ${className}`}
			style={{ ...style, flex: size !== undefined ? `0 0 ${size}%` : undefined }}
			{...props}>
			{children}
		</div>
	);
});
ResizablePanel.displayName = 'ResizablePanel';

export interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
	withHandle?: boolean;
}

const ResizableHandle = React.forwardRef<HTMLDivElement, ResizableHandleProps>(({ className = '', withHandle = false, ...props }, ref) => {
	const { direction, containerRef, registerHandle, resize } = useResizable();
	const [index, setIndex] = useState(-1);
	const [dragging, setDragging] = useState(false);
	const registeredRef = useRef(false);

	useEffect(() => {
		if (registeredRef.current) {
			return;
		}
		registeredRef.current = true;
		setIndex(registerHandle());
	}, [registerHandle]);

	function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
		if (index < 0) {
			return;
		}
		event.preventDefault();
		const container = containerRef.current;
		if (!container) {
			return;
		}
		const rect = container.getBoundingClientRect();
		const total = direction === 'horizontal' ? rect.width : rect.height;
		const startCoord = direction === 'horizontal' ? event.clientX : event.clientY;
		let lastDeltaPercent = 0;

		setDragging(true);
		document.body.style.cursor = getResizableDirectionCursor(direction);

		function handlePointerMove(moveEvent: PointerEvent) {
			const coord = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
			const deltaPercent = total > 0 ? ((coord - startCoord) / total) * 100 : 0;
			const step = deltaPercent - lastDeltaPercent;
			resize(index, step);
			lastDeltaPercent = deltaPercent;
		}

		function handlePointerUp() {
			setDragging(false);
			document.body.style.cursor = '';
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
		}

		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	}

	return (
		<div
			ref={ref}
			role="separator"
			aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
			data-slot="resizable-handle"
			data-active={dragging}
			onPointerDown={handlePointerDown}
			className={`${styles[resizableStyleKeys.handle]} ${className}`}
			{...props}>
			{withHandle && (
				<div className={styles[resizableStyleKeys.handleBar]}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
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
});
ResizableHandle.displayName = 'ResizableHandle';

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
export default ResizablePanelGroup;
