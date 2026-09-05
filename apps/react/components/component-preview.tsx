'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import { CopyButton } from '@/components/copy-button';
import type { PreviewCode } from '@/lib/preview-code';

const PreviewCodeContext = createContext<PreviewCode | null>(null);

export function PreviewCodeProvider({ value, children }: { value: PreviewCode | null; children: ReactNode }) {
	return <PreviewCodeContext.Provider value={value}>{children}</PreviewCodeContext.Provider>;
}

export function ComponentPreview({ code, children }: { title?: string; description?: string; code?: PreviewCode | null; children?: ReactNode }) {
	const contextCode = useContext(PreviewCodeContext);
	const payload = code ?? contextCode;
	const [expanded, setExpanded] = useState(false);

	return (
		<figure className="component-preview">
			<div className="component-preview__surface">{children}</div>
			{payload ? <PreviewCodeBlock payload={payload} expanded={expanded} onExpand={() => setExpanded(true)} /> : null}
		</figure>
	);
}

function PreviewCodeBlock({ payload, expanded, onExpand }: { payload: PreviewCode; expanded: boolean; onExpand: () => void }) {
	const showToggle = payload.raw.split('\n').length > 3;
	return expanded || !showToggle ? (
		<div className="component-preview__code">
			<figure className="mdx-figure" data-rehype-pretty-code-figure="">
				<CopyButton value={payload.raw} />
				<div dangerouslySetInnerHTML={{ __html: payload.full }} />
			</figure>
		</div>
	) : (
		<div className="component-preview__code-peek">
			<div className="component-preview__code-peek-pre" data-rehype-pretty-code-figure="" dangerouslySetInnerHTML={{ __html: payload.preview }} />
			<div className="component-preview__code-fade" aria-hidden="true" />
			<button type="button" className="component-preview__code-toggle" aria-expanded={false} onClick={onExpand}>
				View Code
			</button>
		</div>
	);
}
