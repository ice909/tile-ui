import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../src/components/resizable/resizable';

export function Batch5ResizableHydrationFixture() {
	return (
		<ResizablePanelGroup id="hydration-layout" panelIds={['hydration-left', 'hydration-right']} data-id="resizable-root">
			<ResizablePanel id="hydration-left">Left</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel id="hydration-right">Right</ResizablePanel>
		</ResizablePanelGroup>
	);
}
