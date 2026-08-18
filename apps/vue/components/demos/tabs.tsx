import { TTabs, TTabsList, TTabsTrigger, TTabsContent } from '@tile-ui/vue';

export default function TabsDemo() {
	return (
		<TTabs defaultValue="account">
			<TTabsList>
				<TTabsTrigger value="account">Account</TTabsTrigger>
				<TTabsTrigger value="settings">Settings</TTabsTrigger>
			</TTabsList>
			<TTabsContent value="account">
				<p class="component-preview__text">Account preferences live here.</p>
			</TTabsContent>
			<TTabsContent value="settings">
				<p class="component-preview__text">Settings live here.</p>
			</TTabsContent>
		</TTabs>
	);
}
