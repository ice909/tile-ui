import { Show, createSignal, onCleanup } from 'solid-js';

import { solidPrimitiveDemoRegistry } from '../../components/primitive-demos';
import { primitivePreviewCodeMap } from '../generated/primitive-preview-code';

export function PrimitiveDemo(props: { slug: string }) {
	const demo = () => solidPrimitiveDemoRegistry[props.slug];
	const code = () => primitivePreviewCodeMap[props.slug];
	const [expanded, setExpanded] = createSignal(false);
	const [copyState, setCopyState] = createSignal<'idle' | 'success' | 'failure'>('idle');
	const sourceId = () => `solid-primitive-preview-source-${props.slug}`;
	let copyGeneration = 0;
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	onCleanup(() => {
		copyGeneration += 1;
		if (resetTimer !== undefined) clearTimeout(resetTimer);
	});

	async function copySource() {
		const source = code()?.raw;
		if (!source || typeof document === 'undefined') return;
		const generation = ++copyGeneration;
		if (resetTimer !== undefined) {
			clearTimeout(resetTimer);
			resetTimer = undefined;
		}
		setCopyState('idle');
		try {
			if (!navigator.clipboard?.writeText) throw new Error('Clipboard API not available');
			await navigator.clipboard.writeText(source);
			if (generation !== copyGeneration) return;
			setCopyState('success');
		} catch {
			if (generation !== copyGeneration) return;
			setCopyState('failure');
		}
		resetTimer = setTimeout(() => {
			if (generation !== copyGeneration) return;
			resetTimer = undefined;
			setCopyState('idle');
		}, 2200);
	}

	return (
		<Show when={demo()} keyed>
			{(entry) => (
				<section class="solid-preview solid-preview--primitives">
					<header>
						<div>
							<p>Live primitive preview</p>
							<h2>{entry.title}</h2>
							<span>{entry.description}</span>
						</div>
						<span class="solid-preview__ssr">deterministic SSR</span>
					</header>
					<div class="solid-preview__surface">
						<entry.Component />
					</div>
					<Show when={code()} keyed>
						{(source) => (
							<div class="solid-preview__code">
								<div class="solid-preview__codebar">
									<span>components/primitive-demos/{props.slug}.tsx · exact rendered source</span>
									<button type="button" onClick={() => void copySource()}>
										{copyState() === 'success' ? 'Copied' : copyState() === 'failure' ? 'Copy failed' : 'Copy'}
									</button>
									<span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
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
