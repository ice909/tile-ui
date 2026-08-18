import { TSidebarProvider, TSidebar, TSidebarContent, TSidebarGroup, TSidebarGroupLabel, TSidebarTrigger } from '@tile-ui/vue';

export default function SidebarDemo() {
	return (
		<TSidebarProvider style={{ minHeight: '220px' }}>
			<div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
				<TSidebar collapsible="icon" style={{ position: 'static', height: '220px' }}>
					<TSidebarContent>
						<TSidebarGroup>
							<TSidebarGroupLabel>Menu</TSidebarGroupLabel>
						</TSidebarGroup>
					</TSidebarContent>
				</TSidebar>
				<TSidebarTrigger class="component-preview__action" />
			</div>
		</TSidebarProvider>
	);
}
