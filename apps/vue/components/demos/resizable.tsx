import { TResizablePanelGroup, TResizablePanel, TResizableHandle } from '@tile-ui/vue';

export default function ResizableDemo() {
	return (
		<TResizablePanelGroup direction="horizontal" style={{ height: '140px', display: 'flex', width: '100%' }}>
			<TResizablePanel style={{ background: 'var(--docs-surface-hover)' }}>
				<p class="component-preview__text">Left</p>
			</TResizablePanel>
			<TResizableHandle />
			<TResizablePanel style={{ background: 'var(--docs-surface-hover)' }}>
				<p class="component-preview__text">Right</p>
			</TResizablePanel>
		</TResizablePanelGroup>
	);
}
