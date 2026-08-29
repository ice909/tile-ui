import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarInset,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarSeparator,
	SidebarTrigger,
} from '@tile-ui/solid';

export default function SidebarDemo() {
	return (
		<SidebarProvider defaultOpen style={{ 'min-height': '26rem', border: '1px solid var(--border)', 'border-radius': '0.75rem', overflow: 'hidden' }}>
			<Sidebar collapsible="icon">
				<SidebarHeader>
					<SidebarInput aria-label="Search projects" placeholder="Search projects" />
				</SidebarHeader>
				<SidebarSeparator />
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Workspace</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton isActive tooltip="Overview">
										<span aria-hidden="true">O</span>
										<span>Overview</span>
									</SidebarMenuButton>
									<SidebarMenuBadge>4</SidebarMenuBadge>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton tooltip="Components">
										<span aria-hidden="true">C</span>
										<span>Components</span>
									</SidebarMenuButton>
									<SidebarMenuSub>
										<SidebarMenuSubItem>
											<SidebarMenuSubButton href="/docs/components/button">Button</SidebarMenuSubButton>
										</SidebarMenuSubItem>
										<SidebarMenuSubItem>
											<SidebarMenuSubButton href="/docs/components/sidebar" isActive>
												Sidebar
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									</SidebarMenuSub>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
			<SidebarInset>
				<header style={{ display: 'flex', 'align-items': 'center', gap: '0.75rem', padding: '1rem', 'border-bottom': '1px solid var(--border)' }}>
					<SidebarTrigger />
					<strong>Tile workspace</strong>
				</header>
				<section style={{ padding: '1.5rem' }}>
					<h3 style={{ margin: 0 }}>Overview</h3>
					<p>Collapse the desktop rail or open the focused mobile sheet with the same trigger.</p>
				</section>
			</SidebarInset>
		</SidebarProvider>
	);
}
