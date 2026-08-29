import { Show } from 'solid-js';

import { solidPrimitiveDemoRegistry } from '../../components/primitive-demos';
import { primitivePreviewCodeMap } from '../generated/primitive-preview-code';
import { SourcePreview } from './source-preview';

export function PrimitiveDemo(props: { slug: string }) {
	const demo = () => solidPrimitiveDemoRegistry[props.slug];
	const code = () => primitivePreviewCodeMap[props.slug];

	return (
		<Show when={demo()} keyed>
			{(entry) => (
				<section class="solid-preview solid-preview--primitives">
					<div class="solid-preview__surface">
						<entry.Component />
					</div>
					<Show when={code()} keyed>
						{(source) => <SourcePreview source={source} />}
					</Show>
				</section>
			)}
		</Show>
	);
}
