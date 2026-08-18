import { Tabs, TabsList, TabsTrigger, TabsContent } from '@tile-ui/react';

export default function TabsDemo() {
	return (
		<Tabs defaultValue="account">
			<TabsList>
				<TabsTrigger value="account">Account</TabsTrigger>
				<TabsTrigger value="settings">Settings</TabsTrigger>
			</TabsList>
			<TabsContent value="account">
				<p className="component-preview__text">Account preferences live here.</p>
			</TabsContent>
			<TabsContent value="settings">
				<p className="component-preview__text">Settings live here.</p>
			</TabsContent>
		</Tabs>
	);
}
