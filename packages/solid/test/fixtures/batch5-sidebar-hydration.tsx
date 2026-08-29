import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
	type SidebarProps,
} from '../../src/components/sidebar/sidebar';

const divergentRuntimeId = { id: 'divergent-sidebar' } as unknown as SidebarProps;

export function Batch5SidebarHydrationFixture() {
	return (
		<SidebarProvider defaultOpen={false} sidebarId="hydration-sidebar" data-id="provider">
			<Sidebar {...divergentRuntimeId} collapsible="icon">
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Workspace</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton tooltip="Dashboard">Dashboard</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuSkeleton showIcon />
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
			<SidebarInset>
				<SidebarTrigger id="hydration-trigger" />
				<SidebarRail id="hydration-rail" />
				<main>Content</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
