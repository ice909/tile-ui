import { TBreadcrumb, TBreadcrumbList, TBreadcrumbItem, TBreadcrumbLink, TBreadcrumbSeparator, TBreadcrumbPage } from '@tile-ui/vue';

export default function BreadcrumbDemo() {
	return (
		<TBreadcrumb>
			<TBreadcrumbList>
				<TBreadcrumbItem>
					<TBreadcrumbLink href="/docs">Docs</TBreadcrumbLink>
				</TBreadcrumbItem>
				<TBreadcrumbSeparator />
				<TBreadcrumbItem>
					<TBreadcrumbLink href="/docs/components">Components</TBreadcrumbLink>
				</TBreadcrumbItem>
				<TBreadcrumbSeparator />
				<TBreadcrumbItem>
					<TBreadcrumbPage>Button</TBreadcrumbPage>
				</TBreadcrumbItem>
			</TBreadcrumbList>
		</TBreadcrumb>
	);
}
