'use client';

import { useId, useState } from 'react';
import { variantKey } from '../../common/lib/preview-variants';
import type { Demo as DemoEntry } from './demos';
import { ComponentPreview } from './component-preview';
import { previewCodeMap } from '../lib/preview-code';

export function DemoVariants({ slug, title, variants }: { slug: string; title: string; variants: NonNullable<DemoEntry['variants']> }) {
	const instance = useId();
	const [active, setActive] = useState(0);
	const Demo = variants[active].Component;
	return (
		<div className="demo-variants">
			<div className="component-preview-tabs__list" role="tablist" aria-label={`${title} scenarios`}>
				{variants.map((scenario, index) => (
					<button
						key={scenario.id}
						type="button"
						role="tab"
						id={`${instance}-tab-${index}`}
						aria-controls={`${instance}-panel-${index}`}
						aria-selected={active === index}
						tabIndex={active === index ? 0 : -1}
						onClick={() => setActive(index)}
						onKeyDown={(event) => {
							const next = variantKey(event, index, variants.length);
							if (next !== null) {
								setActive(next);
								document.getElementById(`${instance}-tab-${next}`)?.focus();
							}
						}}>
						{scenario.title}
					</button>
				))}
			</div>
			<div role="tabpanel" id={`${instance}-panel-${active}`} aria-labelledby={`${instance}-tab-${active}`}>
				<ComponentPreview key={variants[active].id} code={previewCodeMap[`${slug}/${variants[active].id}`]}>
					<Demo />
				</ComponentPreview>
			</div>
		</div>
	);
}
