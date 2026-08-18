import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarTrigger } from '@tile-ui/react';

export default function SidebarDemo() {
	return (
		<SidebarProvider style={{ minHeight: 220 }}>
			<div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
				<Sidebar collapsible="icon" style={{ position: 'static', height: 220 }}>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Menu</SidebarGroupLabel>
						</SidebarGroup>
					</SidebarContent>
				</Sidebar>
				<SidebarTrigger className="component-preview__action" />
			</div>
		</SidebarProvider>
	);
}
