import { Show } from 'solid-js';

import { solidDemoRegistry } from '../../components/demos';
import { previewCodeMap } from '../generated/preview-code';
import { SourcePreview } from './source-preview';

export function ComponentDemo(props: { slug: string }) {
	const demo = () => solidDemoRegistry[props.slug];
	const code = () => previewCodeMap[props.slug];

	return (
		<Show when={demo()} keyed>
			{(entry) => (
				<section class="solid-preview">
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
