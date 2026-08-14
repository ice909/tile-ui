'use client';

import { ComponentPreview } from '@/components/component-preview';
import { demoRegistry } from '@/components/demo-registry';

export function ComponentDemo({ slug }: { slug: string }) {
	const demo = demoRegistry[slug];

	if (!demo) {
		return null;
	}

	return (
		<ComponentPreview title={demo.title} description={demo.description}>
			<demo.Component />
		</ComponentPreview>
	);
}
