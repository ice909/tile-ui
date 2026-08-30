'use client';

import { useEffect, useRef, useState } from 'react';
import { homeShowcaseCodeLines as lines, homeShowcaseMeta, homeShowcaseStages } from '../lib/home-showcase-code';
import { HomeShowcaseDemo } from './home-showcase-demo';

/**
 * Homepage live-preview/source comparison implementation map:
 *
 * 1. `home-showcase-demo.tsx` is the only handwritten demo source and the component rendered on the right.
 * 2. `scripts/generate-home-showcase-code.mjs` reads that exact file, removes stage markers, runs Shiki with
 *    the TSX grammar and GitHub Dark theme, then writes `lib/home-showcase-code.ts` for the editor on the left.
 * 3. Matching `@showcase-stage-N-start/end` markers may wrap imports, state, and JSX in separate blocks.
 *    They connect every displayed source line to the rendered element that enters or leaves at the same stage.
 * 4. The timeline moves through adding -> idle for each stage, then removes stages in reverse. Idle preserves
 *    the quieter `added` diff; it must never reset completed lines to the base style.
 * 5. A stage can have several blocks, but only its final source line receives `data-stage-end` and one caret.
 * 6. Automatic editor scrolling follows that unique final line. Wheel, touch, pointer, or navigation-key input
 *    transfers scroll ownership to the user; leaving the editor allows later timeline steps to follow again.
 * 7. The separator controls one split percentage for pointer and keyboard input. CSS clips source on the left,
 *    offsets the full preview on the right, keeps the pegboard, and owns framework-specific height/safe spacing.
 *
 * Keep these files in sync through generation, not by copying source strings or matching syntax keywords here.
 */
const minimumSplit = 18;
const maximumSplit = 82;
type Phase = 'idle' | 'adding' | 'removing';
const stages = homeShowcaseStages.map(({ stage }) => stage);
// Keep completed stages in idle before reversing them so their quieter `added` diff remains visible.
const timeline: Array<{ stage: number; phase: Phase; duration: number }> = [
	{ stage: 0, phase: 'idle', duration: 1700 },
	...stages.flatMap((stage, index) => [
		{ stage, phase: 'adding' as const, duration: 1100 },
		{ stage, phase: 'idle' as const, duration: index === stages.length - 1 ? 2400 : 800 },
	]),
	...stages.toReversed().map((stage) => ({ stage, phase: 'removing' as const, duration: 900 })),
];
export function HomeCodeCompare() {
	const [split, setSplit] = useState(50);
	const [step, setStep] = useState(timeline[0]);
	const [autoScroll, setAutoScroll] = useState(true);
	const frame = useRef<HTMLDivElement>(null);
	const editor = useRef<HTMLDivElement>(null);
	const editorPointerDown = useRef(false);

	useEffect(() => {
		let index = 0;
		let timer: ReturnType<typeof setTimeout>;
		const advance = () => {
			const next = timeline[index];
			setStep(next);
			timer = setTimeout(() => {
				index = (index + 1) % timeline.length;
				advance();
			}, next.duration);
		};
		advance();
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		const element = editor.current;
		if (!element || !autoScroll) return;
		if (step.stage === 0) {
			element.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}
		const frameId = requestAnimationFrame(() => {
			// A stage can span imports, state, and JSX. Follow its one canonical final line, not every block end.
			const targets = element.querySelectorAll<HTMLElement>(`.code-line[data-stage="${step.stage}"][data-stage-end="true"]`);
			const target = targets.item(targets.length - 1);
			if (!target) return;
			if (step.phase === 'adding') {
				const editorBounds = element.getBoundingClientRect();
				const targetBounds = target.getBoundingClientRect();
				if (targetBounds.bottom <= editorBounds.bottom - 42) return;
			}
			const top = target.offsetTop - element.clientHeight / 2 + target.offsetHeight / 2;
			element.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
		});
		return () => cancelAnimationFrame(frameId);
	}, [autoScroll, step]);

	const visibleStage = step.stage;
	function updateFromPointer(clientX: number) {
		const bounds = frame.current?.getBoundingClientRect();
		if (!bounds) return;
		setSplit(Math.min(maximumSplit, Math.max(minimumSplit, ((clientX - bounds.left) / bounds.width) * 100)));
	}

	return (
		<section className="framework-code-story" aria-labelledby="react-code-story-title">
			<div className="framework-code-story__heading">
				<div>
					<p className="eyebrow">Rendered from the source</p>
					<h2 id="react-code-story-title">See it, it’s yours.</h2>
				</div>
				<p>Explore the component and its code.</p>
			</div>
			<div ref={frame} className="framework-code-compare" style={{ '--framework-compare-split': `${split}%` } as React.CSSProperties}>
				<div className="framework-code-compare__render" aria-label="Live React component preview">
					<div className="framework-code-compare__canvas">
						<div className="framework-code-compare__preview-label">
							<span>Live preview</span>
							<strong>Composable and interactive</strong>
						</div>
						<div className="framework-code-compare__demo">
							<HomeShowcaseDemo stage={visibleStage} phase={step.phase} />
						</div>
					</div>
				</div>
				<div className="framework-code-compare__code" aria-label="React component source">
					<div className="framework-code-compare__bar">
						<i />
						<i />
						<i />
						<strong>
							<svg className="framework-code-compare__file-icon framework-code-compare__file-icon--react" viewBox="0 0 24 24" aria-hidden="true">
								<circle cx="12" cy="12" r="2.1" fill="currentColor" />
								<ellipse cx="12" cy="12" rx="9" ry="3.7" />
								<ellipse cx="12" cy="12" rx="9" ry="3.7" transform="rotate(60 12 12)" />
								<ellipse cx="12" cy="12" rx="9" ry="3.7" transform="rotate(120 12 12)" />
							</svg>
							{homeShowcaseMeta.fileName}
						</strong>
						<small>{homeShowcaseMeta.language}</small>
					</div>
					<div
						ref={editor}
						className="framework-code-compare__highlight"
						onWheel={() => setAutoScroll(false)}
						onTouchMove={() => setAutoScroll(false)}
						onPointerDown={() => {
							// Any explicit editor gesture transfers scroll ownership to the user until they leave the editor.
							editorPointerDown.current = true;
							setAutoScroll(false);
						}}
						onPointerUp={() => (editorPointerDown.current = false)}
						onPointerCancel={() => (editorPointerDown.current = false)}
						onScroll={() => {
							if (editorPointerDown.current) setAutoScroll(false);
						}}
						onKeyDown={(event) => {
							if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) setAutoScroll(false);
						}}
						onMouseLeave={() => {
							editorPointerDown.current = false;
							setAutoScroll(true);
						}}>
						<pre>
							<code>
								{lines.map((line, index) => {
									const visible = line.stage === 0 || line.stage <= step.stage;
									// Idle means the edit completed, not that diff context disappeared.
									const active = line.stage === step.stage && line.stage > 0 && step.phase !== 'idle';
									const status = active ? step.phase : line.stage > 0 && visible ? 'added' : 'base';
									const isStageEnd = line.stage > 0 && !lines.slice(index + 1).some((next) => next.stage === line.stage);
									return (
										<span
											key={index}
											className="code-line"
											data-stage={line.stage}
											data-stage-end={isStageEnd || undefined}
											data-visible={visible}
											data-status={status}>
											<span dangerouslySetInnerHTML={{ __html: line.html }} />
											{status === 'adding' && isStageEnd && <i className="code-editing-caret" />}
										</span>
									);
								})}
							</code>
						</pre>
					</div>
				</div>
				<div className="framework-code-compare__line" aria-hidden="true" />
				<div
					className="framework-code-compare__handle"
					role="separator"
					tabIndex={0}
					aria-label="Resize source code preview"
					aria-orientation="vertical"
					aria-valuemin={minimumSplit}
					aria-valuemax={maximumSplit}
					aria-valuenow={Math.round(split)}
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
			<p className="framework-code-story__hint">Drag to compare · Use arrow keys when the divider is focused</p>
		</section>
	);
}
