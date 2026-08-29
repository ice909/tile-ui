import { createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js';

import { homeShowcaseCodeLines } from '../generated/home-showcase-code';
import { HomeShowcaseDemo } from './home-showcase-demo';

const minimumSplit = 18;
const maximumSplit = 82;

function escapeCode(value: string) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

type EditPhase = 'idle' | 'locating' | 'preparing' | 'adding' | 'removing';

function highlightSource(stage: number, phase: EditPhase) {
	const jsxBlocks = new Map<number, number>();
	for (const line of homeShowcaseCodeLines) jsxBlocks.set(line.stage, Math.max(jsxBlocks.get(line.stage) ?? 0, line.block));
	let insertedCaret = false;
	return homeShowcaseCodeLines
		.map((line, index) => {
			const isCurrent = line.stage !== 0 && line.stage === stage;
			const isJsxBlock = line.stage !== 0 && line.block === jsxBlocks.get(line.stage);
			const visible =
				line.stage === 0 ||
				line.stage < stage ||
				(line.stage === stage && phase !== 'locating' && phase !== 'preparing') ||
				(isCurrent && !isJsxBlock && phase !== 'locating');
			const active = isCurrent && phase !== 'idle' && phase !== 'locating' && phase !== 'preparing';
			const status = active ? phase : line.stage !== 0 && visible ? 'added' : 'base';
			const isStageEnd = line.stage !== 0 && homeShowcaseCodeLines[index + 1]?.stage !== line.stage;
			const stageEnd = isStageEnd ? ' data-stage-end="true"' : '';
			const editingCaret = isStageEnd && status === 'adding' ? '<span class="code-editing-caret" aria-hidden="true"></span>' : '';
			let insertionCaret = '';
			let insertionAnchor = '';
			if (phase === 'locating' && isCurrent && isJsxBlock && !insertedCaret) {
				insertedCaret = true;
				insertionAnchor = `<span class="code-insertion-anchor" data-stage="${line.stage}" data-insertion-anchor="true"></span>`;
			}
			if (phase === 'preparing' && isCurrent && isJsxBlock && !insertedCaret) {
				insertedCaret = true;
				const indentation = line.source.match(/^\s*/)?.[0] ?? '';
				insertionCaret = `<span class="code-line code-line--insertion" data-stage="${line.stage}" data-insertion="true">${escapeCode(indentation)}<span class="code-insertion-caret" aria-hidden="true"></span></span>`;
			}
			return `${insertionAnchor}${insertionCaret}<span class="code-line" data-line="${index + 1}" data-stage="${line.stage}" data-visible="${visible}" data-status="${status}"${stageEnd}>${line.html}${editingCaret}</span>`;
		})
		.join('');
}

const editTimeline: Array<{ stage: number; phase: EditPhase; duration: number }> = [
	{ stage: 0, phase: 'idle', duration: 1800 },
	{ stage: 1, phase: 'locating', duration: 650 },
	{ stage: 1, phase: 'preparing', duration: 900 },
	{ stage: 1, phase: 'adding', duration: 1000 },
	{ stage: 1, phase: 'idle', duration: 850 },
	{ stage: 2, phase: 'locating', duration: 650 },
	{ stage: 2, phase: 'preparing', duration: 900 },
	{ stage: 2, phase: 'adding', duration: 1000 },
	{ stage: 2, phase: 'idle', duration: 850 },
	{ stage: 3, phase: 'locating', duration: 650 },
	{ stage: 3, phase: 'preparing', duration: 900 },
	{ stage: 3, phase: 'adding', duration: 1000 },
	{ stage: 3, phase: 'idle', duration: 2600 },
	{ stage: 3, phase: 'removing', duration: 900 },
	{ stage: 2, phase: 'idle', duration: 550 },
	{ stage: 2, phase: 'removing', duration: 900 },
	{ stage: 1, phase: 'idle', duration: 550 },
	{ stage: 1, phase: 'removing', duration: 900 },
];

export function HomeCodeCompare() {
	const [split, setSplit] = createSignal(50);
	const [editStep, setEditStep] = createSignal(editTimeline[0]);
	const [autoScroll, setAutoScroll] = createSignal(true);
	let frame: HTMLDivElement | undefined;
	let editor: HTMLDivElement | undefined;
	let editorPointerDown = false;
	let timelineTimer: ReturnType<typeof setTimeout> | undefined;
	const highlightedShowcaseSource = createMemo(() => highlightSource(editStep().stage, editStep().phase));

	onMount(() => {
		let index = 0;
		const advance = () => {
			const step = editTimeline[index];
			setEditStep(step);
			timelineTimer = setTimeout(() => {
				index = (index + 1) % editTimeline.length;
				advance();
			}, step.duration);
		};
		advance();
	});

	onCleanup(() => {
		if (timelineTimer !== undefined) clearTimeout(timelineTimer);
	});

	createEffect(() => {
		const { stage, phase } = editStep();
		if (!editor || !autoScroll()) return;
		if (stage === 0) {
			editor.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}
		if (phase === 'idle' || phase === 'preparing') return;
		queueMicrotask(() => {
			const targets = editor?.querySelectorAll<HTMLElement>(`.code-line[data-stage="${stage}"][data-stage-end="true"]`);
			const target = phase === 'locating' ? editor?.querySelector<HTMLElement>(`[data-stage="${stage}"][data-insertion-anchor="true"]`) : targets?.item(targets.length - 1);
			if (!editor || !target) return;
			if (phase === 'adding') {
				const editorBounds = editor.getBoundingClientRect();
				const targetBounds = target.getBoundingClientRect();
				if (targetBounds.bottom <= editorBounds.bottom - 42) return;
			}
			const top = target.offsetTop - editor.clientHeight / 2 + target.offsetHeight / 2;
			editor.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
		});
	});

	const updateFromPointer = (clientX: number) => {
		if (!frame) return;
		const bounds = frame.getBoundingClientRect();
		const next = ((clientX - bounds.left) / bounds.width) * 100;
		setSplit(Math.min(maximumSplit, Math.max(minimumSplit, next)));
	};

	return (
		<section class="solid-code-story" aria-labelledby="solid-code-story-title">
			<div class="solid-code-story__heading">
				<div>
					<p class="solid-kicker">Rendered from the source</p>
					<h2 id="solid-code-story-title">See the component. Own the code.</h2>
				</div>
				<p>Drag the divider to move between an interactive Solid workspace and the exact source that renders it.</p>
			</div>
			<div ref={(element) => (frame = element)} class="solid-code-compare" style={{ '--solid-compare-split': `${split()}%` }}>
				<div class="solid-code-compare__render" aria-label="Live Solid component preview">
					<div class="solid-code-compare__canvas">
						<div class="solid-code-compare__preview-label">
							<span>Live preview</span>
							<strong>Fine-grained and interactive</strong>
						</div>
						<div class="solid-code-compare__demo">
							<HomeShowcaseDemo
								stage={editStep().phase === 'locating' || editStep().phase === 'preparing' ? editStep().stage - 1 : editStep().stage}
								phase={editStep().phase}
							/>
						</div>
					</div>
				</div>
				<div class="solid-code-compare__code" aria-label="Solid component source">
					<div class="solid-code-compare__bar">
						<span />
						<span />
						<span />
						<strong>
							<svg class="solid-code-compare__file-icon" viewBox="0 0 24 24" aria-hidden="true">
								<path d="M11.558.788A9.082 9.082 0 0 0 9.776.99l-.453.15c-.906.303-1.656.755-2.1 1.348L4.887 6.468c.426-.387.974-.698 1.643-.894l.614-.154a8.82 8.82 0 0 1 1.777-.206c2.916-.053 6.033 1.148 8.423 2.36 2.317 1.175 3.888 2.32 3.987 2.39L24 5.518c-.082-.06-1.66-1.21-3.991-2.386C17.616 1.926 14.488.736 11.558.788ZM8.924 5.366a8.634 8.634 0 0 0-1.745.203l-.606.151c-1.278.376-2.095 1.16-2.43 2.108-.334.948-.188 2.065.487 3.116.33.43.747.813 1.216 1.147L12.328 10a6.943 6.943 0 0 1 6.013 1.013l2.844-.963c-.17-.124-1.663-1.2-3.91-2.34-2.379-1.206-5.479-2.396-8.352-2.344Zm5.435 4.497a6.791 6.791 0 0 0-1.984.283L2.94 13.189 0 18.334l9.276-2.992a6.945 6.945 0 0 1 7.408 2.314c.695.903.89 1.906.66 2.808l2.572-4.63c.595-1.041.45-2.225-.302-3.429a6.792 6.792 0 0 0-5.255-2.543Zm-3.031 5.341a6.787 6.787 0 0 0-2.006.283L.008 18.492c.175.131 2.02 1.498 4.687 2.768 2.797 1.332 6.37 2.467 9.468 1.712l.454-.152c1.278-.376 2.134-1.162 2.487-2.09.353-.93.207-2.004-.541-2.978a6.791 6.791 0 0 0-5.237-2.548Z" />
							</svg>
							workspace.tsx
						</strong>
						<small>TSX</small>
					</div>
					<div
						ref={(element) => (editor = element)}
						class="solid-code-compare__highlight"
						onWheel={() => setAutoScroll(false)}
						onTouchMove={() => setAutoScroll(false)}
						onPointerDown={() => (editorPointerDown = true)}
						onPointerUp={() => (editorPointerDown = false)}
						onPointerCancel={() => (editorPointerDown = false)}
						onScroll={() => {
							if (editorPointerDown) setAutoScroll(false);
						}}
						onKeyDown={(event) => {
							if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) setAutoScroll(false);
						}}
						onMouseLeave={() => {
							editorPointerDown = false;
							setAutoScroll(true);
						}}>
						<pre>
							<code innerHTML={highlightedShowcaseSource()} />
						</pre>
					</div>
				</div>
				<div class="solid-code-compare__line" aria-hidden="true" />
				<div
					class="solid-code-compare__handle"
					role="separator"
					tabindex="0"
					aria-label="Resize source code preview"
					aria-orientation="vertical"
					aria-valuemin={minimumSplit}
					aria-valuemax={maximumSplit}
					aria-valuenow={Math.round(split())}
					onPointerDown={(event) => {
						event.currentTarget.setPointerCapture(event.pointerId);
						updateFromPointer(event.clientX);
					}}
					onPointerMove={(event) => {
						if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event.clientX);
					}}
					onKeyDown={(event) => {
						if (event.key === 'ArrowLeft') setSplit((value) => Math.max(minimumSplit, value - 4));
						else if (event.key === 'ArrowRight') setSplit((value) => Math.min(maximumSplit, value + 4));
						else if (event.key === 'Home') setSplit(minimumSplit);
						else if (event.key === 'End') setSplit(maximumSplit);
						else return;
						event.preventDefault();
					}}>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
					</svg>
				</div>
			</div>
			<p class="solid-code-story__hint">Drag to compare · Use arrow keys when the divider is focused</p>
		</section>
	);
}
