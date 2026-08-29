import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuIndicator,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	NavigationMenuViewport,
} from '@tile-ui/solid';

function Menu(props: { shared: boolean }) {
	return (
		<NavigationMenu viewport={props.shared} data-viewport-mode={props.shared ? 'shared' : 'local'}>
			<NavigationMenuList>
				<NavigationMenuItem value="components">
					<NavigationMenuTrigger>Components</NavigationMenuTrigger>
					<NavigationMenuContent>
						<NavigationMenuLink href="/docs/components/select">Select</NavigationMenuLink>
						<NavigationMenuLink href="/docs/components/command">Command</NavigationMenuLink>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem value="guides">
					<NavigationMenuTrigger>Guides</NavigationMenuTrigger>
					<NavigationMenuContent>
						<NavigationMenuLink href="/docs/registry">Registry guide</NavigationMenuLink>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>
			<NavigationMenuIndicator />
			{props.shared && <NavigationMenuViewport />}
		</NavigationMenu>
	);
}

export default function NavigationMenuDemo() {
	return (
		<div class="component-preview__stack" data-demo-navigation-menu>
			<p>Shared viewport</p>
			<Menu shared />
			<p>Local content, viewport=false</p>
			<Menu shared={false} />
		</div>
	);
}
