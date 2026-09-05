import type { JSX } from 'solid-js';
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	ChartContainer,
	Liveline,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Sidebar,
	SidebarContent,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	Toaster,
	toast,
} from '@tile-ui/solid';

const Slug = (props: { name: string; children: JSX.Element }) => <section data-slug={props.name}>{props.children}</section>;

export function CompleteAdvancedFixture(props: { namespace: string }) {
	return (
		<main data-stage5-root="advanced">
			<Slug name="carousel">
				<Carousel data-control="carousel" aria-label="Stage 5 carousel">
					<CarouselContent>
						<CarouselItem>One</CarouselItem>
						<CarouselItem>Two</CarouselItem>
					</CarouselContent>
					<CarouselPrevious data-control="carousel-previous" />
					<CarouselNext data-control="carousel-next" />
				</Carousel>
			</Slug>
			<Slug name="chart">
				<ChartContainer
					data-control="chart"
					title="Revenue"
					config={{ revenue: { label: 'Revenue', theme: { light: '#0f766e', dark: '#5eead4' } } }}
					data={[
						{ month: 'Jan', revenue: 12 },
						{ month: 'Feb', revenue: 18 },
					]}
					xKey="month"
					series={[{ key: 'revenue', type: 'area' }]}
					initialDimension={{ width: 480, height: 240 }}
				/>
			</Slug>
			<Slug name="liveline">
				<Liveline data={[{ time: 1, value: 42 }]} value={42} aria-label="Stage 5 live chart" />
			</Slug>
			<Slug name="resizable">
				<ResizablePanelGroup data-control="resizable" id={`${props.namespace}layout`} panelIds={[`${props.namespace}left`, `${props.namespace}right`]}>
					<ResizablePanel id={`${props.namespace}left`}>Left</ResizablePanel>
					<ResizableHandle data-control="resizable-handle" />
					<ResizablePanel id={`${props.namespace}right`}>Right</ResizablePanel>
				</ResizablePanelGroup>
			</Slug>
			<Slug name="sidebar">
				<SidebarProvider sidebarId={`${props.namespace}sidebar`} defaultOpen={false}>
					<Sidebar>
						<SidebarContent>Sidebar</SidebarContent>
					</Sidebar>
					<SidebarInset>
						<SidebarTrigger data-control="sidebar-trigger" />
						Content
					</SidebarInset>
				</SidebarProvider>
			</Slug>
			<Slug name="sonner">
				<Toaster data-control="toaster" />
				<button data-control="toast-create" onClick={() => toast.success('Stage 5 toast', { duration: 0 })}>
					Toast
				</button>
			</Slug>
		</main>
	);
}
