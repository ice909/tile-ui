import { defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { homeShowcaseCodeLines as lines, homeShowcaseMeta, homeShowcaseStages } from '../lib/home-showcase-code';
import HomeShowcaseDemo from './home-showcase-demo.vue';

/**
 * Homepage live-preview/source comparison implementation map:
 *
 * 1. `home-showcase-demo.vue` is a real SFC, the only handwritten demo source, and the component rendered here.
 * 2. `scripts/generate-home-showcase-code.mjs` reads that SFC, removes stage markers, highlights it with Shiki's
 *    Vue grammar and GitHub Dark theme, and writes the line metadata consumed by this editor.
 * 3. A stage can span multiple non-adjacent blocks such as imports, refs, and template nodes. The same stage
 *    controls source visibility and the real rendered element, preventing display/runtime drift.
 * 4. Each stage enters as `adding`, settles as persistent `added` during idle, and leaves as `removing` in reverse.
 * 5. Only the final line across all blocks in the active stage gets `data-stage-end` and the single editing caret.
 * 6. Timeline scrolling follows that line only while automatic ownership is active. Any direct scroll gesture or
 *    navigation key pauses following so animation never fights the reader's natural vertical scrolling.
 * 7. Pointer and keyboard separator input update the same bounded split. Shared SCSS owns clipping, pegboard,
 *    vertical-only editor scrolling, responsive container behavior, framework height, and final-card safety space.
 *
 * Do not reintroduce a source string, hand-written token rules, a fake Vue example, or card-level overflow hiding.
 */
const minimumSplit = 18;
const maximumSplit = 82;
type Phase = 'idle' | 'adding' | 'removing';
const stages = homeShowcaseStages.map(({ stage }) => stage);
// Completed stages stay highlighted during idle; removal then unwinds them in reverse order.
const timeline: Array<{ stage: number; phase: Phase; duration: number }> = [
	{ stage: 0, phase: 'idle', duration: 1700 },
	...stages.flatMap((stage, index) => [
		{ stage, phase: 'adding' as const, duration: 1100 },
		{ stage, phase: 'idle' as const, duration: index === stages.length - 1 ? 2400 : 800 },
	]),
	...stages.toReversed().map((stage) => ({ stage, phase: 'removing' as const, duration: 900 })),
];
export const HomeCodeCompare = defineComponent({
	name: 'HomeCodeCompare',
	setup() {
		const split = ref(50);
		const step = ref(timeline[0]);
		const autoScroll = ref(true);
		let frame: HTMLDivElement | undefined;
		let editor: HTMLDivElement | undefined;
		let editorPointerDown = false;
		let timer: ReturnType<typeof setTimeout> | undefined;

		onMounted(() => {
			let index = 0;
			const advance = () => {
				const next = timeline[index];
				step.value = next;
				timer = setTimeout(() => {
					index = (index + 1) % timeline.length;
					advance();
				}, next.duration);
			};
			advance();
		});
		onBeforeUnmount(() => {
			if (timer) clearTimeout(timer);
		});

		watch(
			() => [step.value.stage, step.value.phase, autoScroll.value] as const,
			async ([stage, phase, enabled]) => {
				await nextTick();
				if (!editor || !enabled) return;
				if (stage === 0) {
					editor.scrollTo({ top: 0, behavior: 'smooth' });
					return;
				}
				// Multiple source blocks can share a stage, but scrolling and the caret target one canonical final line.
				const targets = editor.querySelectorAll<HTMLElement>(`.code-line[data-stage="${stage}"][data-stage-end="true"]`);
				const target = targets.item(targets.length - 1);
				if (!target) return;
				if (phase === 'adding') {
					const editorBounds = editor.getBoundingClientRect();
					const targetBounds = target.getBoundingClientRect();
					if (targetBounds.bottom <= editorBounds.bottom - 42) return;
				}
				const top = target.offsetTop - editor.clientHeight / 2 + target.offsetHeight / 2;
				editor.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
			},
		);

		function updateFromPointer(clientX: number) {
			const bounds = frame?.getBoundingClientRect();
			if (!bounds) return;
			split.value = Math.min(maximumSplit, Math.max(minimumSplit, ((clientX - bounds.left) / bounds.width) * 100));
		}

		return () => {
			const visibleStage = step.value.stage;
			return (
				<section class="framework-code-story" aria-labelledby="vue-code-story-title">
					<div class="framework-code-story__heading">
						<div>
							<p class="eyebrow">Rendered from the source</p>
							<h2 id="vue-code-story-title">See it, it’s yours.</h2>
						</div>
						<p>Explore the component and its code.</p>
					</div>
					<div
						ref={(element) => {
							if (element instanceof HTMLDivElement) frame = element;
						}}
						class="framework-code-compare"
						style={{ '--framework-compare-split': `${split.value}%` }}>
						<div class="framework-code-compare__render" aria-label="Live Vue component preview">
							<div class="framework-code-compare__canvas">
								<div class="framework-code-compare__preview-label">
									<span>Live preview</span>
									<strong>Reactive and interactive</strong>
								</div>
								<div class="framework-code-compare__demo">
									<HomeShowcaseDemo stage={visibleStage} phase={step.value.phase} />
								</div>
							</div>
						</div>
						<div class="framework-code-compare__code" aria-label="Vue component source">
							<div class="framework-code-compare__bar">
								<i />
								<i />
								<i />
								<strong>
									<svg class="framework-code-compare__file-icon framework-code-compare__file-icon--vue" viewBox="0 0 24 24" aria-hidden="true">
										<path d="M2 4h4.3L12 14l5.7-10H22L12 21 2 4Z" fill="currentColor" />
										<path d="M6.7 4H10l2 3.5L14 4h3.3L12 13.3 6.7 4Z" fill="var(--docs-surface, #0d1117)" />
									</svg>
									{homeShowcaseMeta.fileName}
								</strong>
								<small>{homeShowcaseMeta.language}</small>
							</div>
							<div
								ref={(element) => {
									if (element instanceof HTMLDivElement) editor = element;
								}}
								class="framework-code-compare__highlight"
								onWheel={() => (autoScroll.value = false)}
								onTouchmove={() => (autoScroll.value = false)}
								onPointerdown={() => {
									// Respect natural scrolling: explicit interaction pauses timeline-driven following.
									editorPointerDown = true;
									autoScroll.value = false;
								}}
								onPointerup={() => (editorPointerDown = false)}
								onPointercancel={() => (editorPointerDown = false)}
								onScroll={() => {
									if (editorPointerDown) autoScroll.value = false;
								}}
								onKeydown={(event: KeyboardEvent) => {
									if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) autoScroll.value = false;
								}}
								onMouseleave={() => {
									editorPointerDown = false;
									autoScroll.value = true;
								}}>
								<pre>
									<code>
										{lines.map((line, index) => {
											const visible = line.stage === 0 || line.stage <= step.value.stage;
											// Preserve the quiet added diff in idle instead of resetting completed lines to base.
											const active = line.stage === step.value.stage && line.stage > 0 && step.value.phase !== 'idle';
											const status = active ? step.value.phase : line.stage > 0 && visible ? 'added' : 'base';
											const isStageEnd = line.stage > 0 && !lines.slice(index + 1).some((next) => next.stage === line.stage);
											return (
												<span
													class="code-line"
													data-stage={line.stage}
													data-stage-end={isStageEnd || undefined}
													data-visible={visible}
													data-status={status}>
													<span innerHTML={line.html} />
													{status === 'adding' && isStageEnd && <i class="code-editing-caret" />}
												</span>
											);
										})}
									</code>
								</pre>
							</div>
						</div>
						<div class="framework-code-compare__line" aria-hidden="true" />
						<div
							class="framework-code-compare__handle"
							role="separator"
							tabindex="0"
							aria-label="Resize source code preview"
							aria-orientation="vertical"
							aria-valuemin={minimumSplit}
							aria-valuemax={maximumSplit}
							aria-valuenow={Math.round(split.value)}
							onPointerdown={(event: PointerEvent) => {
								(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
								updateFromPointer(event.clientX);
							}}
							onPointermove={(event: PointerEvent) => {
								if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) updateFromPointer(event.clientX);
							}}
							onKeydown={(event: KeyboardEvent) => {
								if (event.key === 'ArrowLeft') split.value = Math.max(minimumSplit, split.value - 4);
								else if (event.key === 'ArrowRight') split.value = Math.min(maximumSplit, split.value + 4);
								else if (event.key === 'Home') split.value = minimumSplit;
								else if (event.key === 'End') split.value = maximumSplit;
								else return;
								event.preventDefault();
							}}>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
							</svg>
						</div>
					</div>
					<p class="framework-code-story__hint">Drag to compare · Use arrow keys when the divider is focused</p>
				</section>
			);
		};
	},
});
