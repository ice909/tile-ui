import { createSignal } from 'solid-js';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@tile-ui/solid';

export default function ResizableDemo() {
	const [lastInput, setLastInput] = createSignal('Drag a separator or focus it and use arrows.');
	let horizontalHandle: HTMLDivElement | undefined;
	let verticalHandle: HTMLDivElement | undefined;

	function reportValue(label: string, handle: HTMLDivElement | undefined) {
		queueMicrotask(() => setLastInput(`${label}: ${handle?.getAttribute('aria-valuenow') ?? 'unknown'}%`));
	}

	return (
		<div class="component-preview__stack">
			<ResizablePanelGroup
				id="solid-resizable-horizontal-demo"
				panelIds={['solid-resizable-navigation', 'solid-resizable-canvas']}
				aria-label="Horizontal workspace"
				style={{ height: '10rem', border: '1px solid var(--border)', 'border-radius': '0.5rem' }}>
				<ResizablePanel id="solid-resizable-navigation" style={{ display: 'grid', 'place-items': 'center' }}>
					Navigation
				</ResizablePanel>
				<ResizableHandle
					ref={(element: HTMLDivElement) => (horizontalHandle = element)}
					withHandle
					onPointerMove={() => reportValue('Horizontal pointer size', horizontalHandle)}
					onKeyDown={(event: KeyboardEvent) => reportValue(`Horizontal ${event.key}${event.shiftKey ? ' + Shift' : ''}`, horizontalHandle)}
				/>
				<ResizablePanel id="solid-resizable-canvas" style={{ display: 'grid', 'place-items': 'center' }}>
					Canvas
				</ResizablePanel>
			</ResizablePanelGroup>
			<ResizablePanelGroup
				direction="vertical"
				panelIds={['solid-resizable-preview', 'solid-resizable-console']}
				aria-label="Vertical workspace"
				style={{ height: '10rem', border: '1px solid var(--border)', 'border-radius': '0.5rem' }}>
				<ResizablePanel id="solid-resizable-preview" style={{ display: 'grid', 'place-items': 'center' }}>
					Preview
				</ResizablePanel>
				<ResizableHandle
					ref={(element: HTMLDivElement) => (verticalHandle = element)}
					withHandle
					onPointerMove={() => reportValue('Vertical pointer size', verticalHandle)}
					onKeyDown={(event: KeyboardEvent) => reportValue(`Vertical ${event.key}${event.shiftKey ? ' + Shift' : ''}`, verticalHandle)}
				/>
				<ResizablePanel id="solid-resizable-console" style={{ display: 'grid', 'place-items': 'center' }}>
					Console
				</ResizablePanel>
			</ResizablePanelGroup>
			<output class="component-preview__text" aria-live="polite">
				{lastInput()}
			</output>
		</div>
	);
}
