'use client';

import { ComponentPreview, PreviewCodeProvider } from '@/components/component-preview';
import { demoRegistry } from '@/components/demos';
import { previewCodeMap } from '@/lib/preview-code';
import { DemoVariants } from './demo-variants';

export function ComponentDemo({ slug }: { slug: string }) {
	const demo = demoRegistry[slug];

	if (!demo) {
		return null;
	}
	if (demo.variants?.length) return <DemoVariants key={slug} slug={slug} title={demo.title} variants={demo.variants} />;

	return (
		<PreviewCodeProvider value={previewCodeMap[slug] ?? null}>
			<ComponentPreview title={demo.title} description={demo.description}>
				<demo.Component />
			</ComponentPreview>
		</PreviewCodeProvider>
	);
}
