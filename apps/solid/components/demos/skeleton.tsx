import { Skeleton } from '@tile-ui/solid';
export default function SkeletonDemo() {
	return (
		<div class="component-preview__stack" role="status" aria-label="Loading profile">
			<Skeleton style={{ height: '2.5rem', width: '2.5rem', 'border-radius': '999px' }} />
			<Skeleton style={{ height: '1rem', width: '14rem' }} />
		</div>
	);
}
