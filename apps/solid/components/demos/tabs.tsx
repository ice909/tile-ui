import { createSignal } from 'solid-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tile-ui/solid';

export default function TabsDemo() {
	const [outerValue, setOuterValue] = createSignal('package');
	const [innerValue, setInnerValue] = createSignal('package');
	return (
		<div class="component-preview__stack" data-demo-nested-tabs>
			<Tabs value={outerValue()} onValueChange={setOuterValue}>
				<TabsList>
					<TabsTrigger value="package" id="demo-tabs-package-trigger">
						Package
					</TabsTrigger>
					<TabsTrigger value="registry">Registry</TabsTrigger>
				</TabsList>
				<TabsContent value="package" id="demo-tabs-package-panel">
					<Tabs value={innerValue()} onValueChange={setInnerValue}>
						<TabsList>
							<TabsTrigger value="package">Inner package</TabsTrigger>
							<TabsTrigger value="registry">Inner registry</TabsTrigger>
						</TabsList>
						<TabsContent value="package">Import from the package root.</TabsContent>
						<TabsContent value="registry">Install transformed registry source.</TabsContent>
					</Tabs>
				</TabsContent>
				<TabsContent value="registry">Outer registry panel.</TabsContent>
			</Tabs>
			<p class="component-preview__text" data-tabs-state>
				Outer: {outerValue()}; inner: {innerValue()}. Each tab list handles its own arrow keys.
			</p>
		</div>
	);
}
