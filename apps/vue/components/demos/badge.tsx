import { TBadge } from '@tile-ui/vue';

export default function BadgeDemo() {
	return (
		<div class="button-group">
			<TBadge>Default</TBadge>
			<TBadge variant="secondary">Secondary</TBadge>
			<TBadge variant="destructive">Destructive</TBadge>
			<TBadge variant="outline">Outline</TBadge>
			<TBadge variant="ghost">Ghost</TBadge>
			<TBadge variant="link">Link</TBadge>
		</div>
	);
}
