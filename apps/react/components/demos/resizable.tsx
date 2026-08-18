import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@tile-ui/react';

export default function ResizableDemo() {
	return (
		<ResizablePanelGroup direction="horizontal" style={{ height: 140, display: 'flex', width: '100%' }}>
			<ResizablePanel style={{ background: 'var(--docs-surface-hover)' }}>
				<p className="component-preview__text">Left</p>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel style={{ background: 'var(--docs-surface-hover)' }}>
				<p className="component-preview__text">Right</p>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
