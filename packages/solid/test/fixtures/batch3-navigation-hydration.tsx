import { createSignal } from 'solid-js';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../src/components/pagination/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/tabs/tabs';

export function Batch3NavigationHydrationFixture() {
	const [value, setValue] = createSignal('two');
	return (
		<div data-id="batch3-navigation-root">
			<Tabs value={value()} onValueChange={setValue}>
				<TabsList>
					<TabsTrigger value="one">One</TabsTrigger>
					<TabsTrigger value="disabled" disabled>
						Disabled
					</TabsTrigger>
					<TabsTrigger value="two">Two</TabsTrigger>
				</TabsList>
				<TabsContent value="one">Panel one</TabsContent>
				<TabsContent value="disabled">Panel disabled</TabsContent>
				<TabsContent value="two">Panel two</TabsContent>
			</Tabs>
			<Tabs data-id="fallback-tabs" defaultValue="missing">
				<TabsList>
					<TabsTrigger value="disabled" disabled>
						Disabled
					</TabsTrigger>
					<TabsTrigger value="fallback">Fallback</TabsTrigger>
				</TabsList>
				<TabsContent value="fallback">Fallback panel</TabsContent>
			</Tabs>
			<Tabs data-id="custom-id-tabs" defaultValue="content-first">
				<TabsContent value="content-first" id="custom-content-first-panel">
					Content first panel
				</TabsContent>
				<TabsList>
					<TabsTrigger value="content-first" id="custom-content-first-trigger">
						Content first
					</TabsTrigger>
					<TabsTrigger value="trigger-first" id="custom-trigger-first-trigger">
						Trigger first
					</TabsTrigger>
				</TabsList>
				<TabsContent value="trigger-first" id="custom-trigger-first-panel">
					Trigger first panel
				</TabsContent>
			</Tabs>
			<Tabs data-id="nested-outer-tabs" defaultValue="shared">
				<TabsContent value="shared" id="nested-outer-shared-panel">
					Outer shared panel
					<Tabs data-id="nested-inner-tabs" defaultValue="shared">
						<TabsContent value="shared" id="nested-inner-shared-panel">
							Inner shared panel
						</TabsContent>
						<TabsList>
							<TabsTrigger value="shared" id="nested-inner-shared-trigger">
								Inner shared
							</TabsTrigger>
							<TabsTrigger value="other" id="nested-inner-other-trigger">
								Inner other
							</TabsTrigger>
						</TabsList>
						<TabsContent value="other" id="nested-inner-other-panel">
							Inner other panel
						</TabsContent>
					</Tabs>
				</TabsContent>
				<TabsList>
					<TabsTrigger value="shared" id="nested-outer-shared-trigger">
						Outer shared
					</TabsTrigger>
					<TabsTrigger value="other" id="nested-outer-other-trigger">
						Outer other
					</TabsTrigger>
				</TabsList>
				<TabsContent value="other" id="nested-outer-other-panel">
					Outer other panel
				</TabsContent>
			</Tabs>
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious href="/page/1" />
					</PaginationItem>
					<PaginationItem>
						<PaginationLink href="/page/2" isActive>
							2
						</PaginationLink>
					</PaginationItem>
					<PaginationItem>
						<PaginationNext href="/page/3" />
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}
