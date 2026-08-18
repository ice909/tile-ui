import { TButton } from '@tile-ui/vue';

export default function ButtonDemo() {
	return (
		<div class="component-preview__stack">
			<div class="button-group">
				<TButton>Default</TButton>
				<TButton variant="secondary">Secondary</TButton>
				<TButton variant="outline">Outline</TButton>
				<TButton variant="ghost">Ghost</TButton>
				<TButton variant="destructive">Destructive</TButton>
				<TButton loading>Loading</TButton>
			</div>
		</div>
	);
}
