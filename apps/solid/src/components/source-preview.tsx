import { Show, createSignal, onCleanup } from 'solid-js';

type PreviewCode = { raw: string; preview: string; full: string };

function legacyCopyToClipboard(value: string) {
	const textarea = document.createElement('textarea');
	textarea.value = value;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	textarea.style.pointerEvents = 'none';
	document.body.append(textarea);
	textarea.focus();
	textarea.select();
	textarea.setSelectionRange(0, value.length);

	let copied = false;
	try {
		copied = document.execCommand('copy');
	} catch {
		copied = false;
	}
	textarea.remove();
	return copied;
}

async function copyToClipboard(value: string) {
	if (typeof window === 'undefined' || !value) return false;
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(value);
			return true;
		} catch {
			return legacyCopyToClipboard(value);
		}
	}
	return legacyCopyToClipboard(value);
}

function CopyButton(props: { value: string }) {
	const [copied, setCopied] = createSignal(false);
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	onCleanup(() => {
		if (resetTimer !== undefined) clearTimeout(resetTimer);
	});

	return (
		<button
			type="button"
			data-slot="copy-button"
			data-copied={copied()}
			aria-label="Copy code"
			onClick={async () => {
				if (!(await copyToClipboard(props.value))) return;
				setCopied(true);
				if (resetTimer !== undefined) clearTimeout(resetTimer);
				resetTimer = setTimeout(() => {
					resetTimer = undefined;
					setCopied(false);
				}, 2000);
			}}>
			<span class="icon-copy">
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<rect width="14" height="14" x="8" y="8" rx="2" />
					<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
				</svg>
			</span>
			<span class="icon-check">
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="m5 12 4 4L19 6" />
				</svg>
			</span>
		</button>
	);
}

export function SourcePreview(props: { source: PreviewCode }) {
	const [expanded, setExpanded] = createSignal(false);
	const showToggle = () => props.source.raw.split('\n').length > 3;

	return (
		<Show
			when={expanded() || !showToggle()}
			fallback={
				<div class="solid-preview__code-peek">
					<div class="solid-preview__highlight" data-rehype-pretty-code-figure="" innerHTML={props.source.preview} />
					<div class="solid-preview__code-fade" aria-hidden="true" />
					<button type="button" class="solid-preview__code-toggle" aria-expanded="false" onClick={() => setExpanded(true)}>
						View Code
					</button>
				</div>
			}>
			<div class="solid-preview__code">
				<figure class="mdx-figure" data-rehype-pretty-code-figure="">
					<CopyButton value={props.source.raw} />
					<div class="solid-preview__highlight" innerHTML={props.source.full} />
				</figure>
			</div>
		</Show>
	);
}
