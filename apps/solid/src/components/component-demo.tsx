import { Show } from 'solid-js';
import { solidDemoRegistry } from '../../components/demos';
import { previewCodeMap } from '../generated/preview-code';
import { ComponentPreview } from './component-preview';
import { DemoVariants } from './demo-variants';

export function ComponentDemo(props: { slug: string }) {
	return (
		<Show when={solidDemoRegistry[props.slug]} keyed>
			{(entry) => (
				<Show
					when={entry.variants?.length ? entry.variants : undefined}
					keyed
					fallback={
						<ComponentPreview code={previewCodeMap[props.slug]}>
							<entry.Component />
						</ComponentPreview>
					}>
					{(variants) => <DemoVariants slug={props.slug} title={entry.title} variants={variants} />}
				</Show>
			)}
		</Show>
	);
}
