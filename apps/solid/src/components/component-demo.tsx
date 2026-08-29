import { Show, createSignal } from 'solid-js';

import { solidDemoRegistry } from '../../components/demos';
import { previewCodeMap } from '../generated/preview-code';

export function ComponentDemo(props: { slug: string }) {
	const demo = () => solidDemoRegistry[props.slug];
	const code = () => previewCodeMap[props.slug];
	const [expanded, setExpanded] = createSignal(false);
	const [copyState, setCopyState] = createSignal<'idle' | 'success' | 'failure'>('idle');
	const sourceId = () => `solid-preview-source-${props.slug}`;

	async function copySource() {
		const source = code()?.raw;
		if (!source || typeof document === 'undefined') return;
		try {
			if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(source);
			else {
				const textarea = document.createElement('textarea');
				textarea.value = source;
				textarea.setAttribute('readonly', '');
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.append(textarea);
				textarea.select();
				const copied = document.execCommand('copy');
				textarea.remove();
				if (!copied) throw new Error('Copy command was rejected.');
			}
			setCopyState('success');
		} catch {
			setCopyState('failure');
		}
		setTimeout(() => setCopyState('idle'), 2200);
	}

	return (
		<Show when={demo()} keyed>
			{(entry) => (
				<section class="solid-preview">
					<header>
						<div>
							<p>Live Solid preview</p>
							<h2>{entry.title}</h2>
							<span>{entry.description}</span>
						</div>
						<span class="solid-preview__ssr">SSR + hydrated</span>
					</header>
					<div class="solid-preview__surface">
						<entry.Component />
					</div>
					<Show when={code()} keyed>
						{(source) => (
							<div class="solid-preview__code">
								<div class="solid-preview__codebar">
									<span>{props.slug}.tsx · exact rendered source</span>
									<button type="button" onClick={() => void copySource()}>
										{copyState() === 'success' ? 'Copied' : copyState() === 'failure' ? 'Copy failed' : 'Copy'}
									</button>
									<span class="sr-only" aria-live="polite">
										{copyState() === 'success'
											? 'Source copied to clipboard.'
											: copyState() === 'failure'
												? 'Unable to copy source. Select the code and copy it manually.'
												: ''}
									</span>
								</div>
								<div id={sourceId()} class="solid-preview__highlight" tabindex="-1" innerHTML={expanded() ? source.full : source.preview} />
								<button
									class="solid-preview__toggle"
									type="button"
									aria-controls={sourceId()}
									aria-expanded={expanded()}
									onClick={() => setExpanded((value) => !value)}>
									{expanded() ? 'Collapse source' : 'View complete source'}
								</button>
							</div>
						)}
					</Show>
				</section>
			)}
		</Show>
	);
}
