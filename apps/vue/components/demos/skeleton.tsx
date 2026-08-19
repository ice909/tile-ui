import { Skeleton } from '@tile-ui/vue';

export default function SkeletonDemo() {
	return (
		<div class="component-preview__stack">
			<div style={{ display: 'grid', gap: '8px' }}>
				<Skeleton style={{ height: '16px', width: '60%' }} />
				<Skeleton style={{ height: '16px', width: '90%' }} />
				<Skeleton style={{ height: '16px', width: '40%' }} />
			</div>
		</div>
	);
}
