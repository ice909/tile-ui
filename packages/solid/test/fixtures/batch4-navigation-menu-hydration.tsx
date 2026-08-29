import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuIndicator,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	NavigationMenuViewport,
} from '../../src/components/navigation-menu/navigation-menu';

export function Batch4NavigationMenuHydrationFixture() {
	return (
		<div data-id="batch4-navigation-menu-root">
			<NavigationMenu defaultValue="products" data-id="hydration-menu">
				<NavigationMenuList>
					<NavigationMenuItem value="disabled" disabled>
						<NavigationMenuTrigger>Disabled</NavigationMenuTrigger>
						<NavigationMenuContent>Disabled content</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem value="products">
						<NavigationMenuTrigger id="products-trigger">Products</NavigationMenuTrigger>
						<NavigationMenuContent id="products-content">
							<NavigationMenuLink href="/products" active>
								Products home
							</NavigationMenuLink>
						</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem value="company">
						<NavigationMenuTrigger>Company</NavigationMenuTrigger>
						<NavigationMenuContent>Company content</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
				<NavigationMenuIndicator />
			</NavigationMenu>
			<NavigationMenu defaultValue="manual" data-id="manual-hydration-menu">
				<NavigationMenuViewport id="manual-viewport" data-manual-ref="true" />
				<NavigationMenuList>
					<NavigationMenuItem value="manual">
						<NavigationMenuTrigger id="manual-trigger">Manual</NavigationMenuTrigger>
						<NavigationMenuContent id="manual-content">Manual content</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
			<NavigationMenu defaultValue="local" viewport={false} data-id="local-hydration-menu">
				<NavigationMenuList>
					<NavigationMenuItem value="local">
						<NavigationMenuTrigger id="local-trigger">Local</NavigationMenuTrigger>
						<NavigationMenuContent id="local-content">Local content</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		</div>
	);
}
