import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@tile-ui/vue';

export default function ResizableDemo() {
	return (
		<ResizablePanelGroup direction="horizontal" style={{ height: '140px', display: 'flex', width: '100%' }}>
			<ResizablePanel style={{ background: 'var(--docs-surface-hover)' }}>
				<p class="component-preview__text">Left</p>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel style={{ background: 'var(--docs-surface-hover)' }}>
				<p class="component-preview__text">Right</p>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
