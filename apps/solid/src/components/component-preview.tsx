import { Show, type JSX } from 'solid-js';
import type { PreviewCode } from '../generated/preview-code';
import { SourcePreview } from './source-preview';

export function ComponentPreview(props: { children: JSX.Element; code?: PreviewCode }) {
	return (
		<section class="solid-preview">
			<div class="solid-preview__surface">{props.children}</div>
			<Show when={props.code} keyed>
				{(source) => <SourcePreview source={source} />}
			</Show>
		</section>
	);
}
