import { Button } from '@tile-ui/vue';

export default function ButtonDemo() {
	return (
		<div class="component-preview__stack">
			<div class="button-group">
				<Button>Default</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="destructive">Destructive</Button>
				<Button loading>Loading</Button>
			</div>
		</div>
	);
}
