import { TNavigationMenu, TNavigationMenuList, TNavigationMenuItem, TNavigationMenuTrigger, TNavigationMenuContent, TNavigationMenuViewport } from '@tile-ui/vue';

export default function NavigationMenuDemo() {
	return (
		<TNavigationMenu>
			<TNavigationMenuList>
				<TNavigationMenuItem value="docs">
					<TNavigationMenuTrigger>Docs</TNavigationMenuTrigger>
					<TNavigationMenuContent>
						<div style={{ padding: '12px' }}>
							<p class="component-preview__text">Documentation links live here.</p>
						</div>
					</TNavigationMenuContent>
				</TNavigationMenuItem>
				<TNavigationMenuItem value="components">
					<TNavigationMenuTrigger>Components</TNavigationMenuTrigger>
					<TNavigationMenuContent>
						<div style={{ padding: '12px' }}>
							<p class="component-preview__text">Component links live here.</p>
						</div>
					</TNavigationMenuContent>
				</TNavigationMenuItem>
			</TNavigationMenuList>
			<TNavigationMenuViewport />
		</TNavigationMenu>
	);
}
