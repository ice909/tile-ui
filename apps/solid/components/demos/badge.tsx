import { Badge } from '@tile-ui/solid';

export default function BadgeDemo() {
	return (
		<div class="button-group">
			<Badge>Solid</Badge>
			<Badge variant="secondary">SSR ready</Badge>
			<Badge variant="outline">Registry</Badge>
			<Badge variant="destructive">Breaking</Badge>
			<Badge variant="ghost">Preview</Badge>
		</div>
	);
}
