import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from '@tile-ui/react';

export default function NavigationMenuDemo() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem value="docs">
					<NavigationMenuTrigger>Docs</NavigationMenuTrigger>
					<NavigationMenuContent>
						<div style={{ padding: 12 }}>
							<p className="component-preview__text">Documentation links live here.</p>
						</div>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem value="components">
					<NavigationMenuTrigger>Components</NavigationMenuTrigger>
					<NavigationMenuContent>
						<div style={{ padding: 12 }}>
							<p className="component-preview__text">Component links live here.</p>
						</div>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
