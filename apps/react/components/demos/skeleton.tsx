import { Skeleton } from '@tile-ui/react';

export default function SkeletonDemo() {
	return (
		<div className="component-preview__stack">
			<div style={{ display: 'grid', gap: 8 }}>
				<Skeleton style={{ height: 16, width: '60%' }} />
				<Skeleton style={{ height: 16, width: '90%' }} />
				<Skeleton style={{ height: 16, width: '40%' }} />
			</div>
		</div>
	);
}
