import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarTrigger } from '@tile-ui/vue';

export default function SidebarDemo() {
	return (
		<SidebarProvider style={{ minHeight: '220px' }}>
			<div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
				<Sidebar collapsible="icon" style={{ position: 'static', height: '220px' }}>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Menu</SidebarGroupLabel>
						</SidebarGroup>
					</SidebarContent>
				</Sidebar>
				<SidebarTrigger class="component-preview__action" />
			</div>
		</SidebarProvider>
	);
}
