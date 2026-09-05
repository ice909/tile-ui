import { createSignal, createUniqueId, Show } from 'solid-js';
import { variantKey } from '../../../common/lib/preview-variants';
import type { SolidDemo } from '../../components/demos';
import { ComponentPreview } from './component-preview';
import { previewCodeMap } from '../generated/preview-code';

export function DemoVariants(props: { slug: string; title: string; variants: NonNullable<SolidDemo['variants']> }) {
	const instance = createUniqueId();
	const [active, setActive] = createSignal(0);
	return (
		<div class="demo-variants">
			<div class="solid-preview__tabs" role="tablist" aria-label={`${props.title} scenarios`}>
				{props.variants.map((scenario, index) => (
					<button
						type="button"
						role="tab"
						id={`${instance}-tab-${index}`}
						aria-controls={`${instance}-panel-${index}`}
						aria-selected={active() === index}
						tabIndex={active() === index ? 0 : -1}
						onClick={() => setActive(index)}
						onKeyDown={(event) => {
							const next = variantKey(event, index, props.variants.length);
							if (next !== null) {
								setActive(next);
								document.getElementById(`${instance}-tab-${next}`)?.focus();
							}
						}}>
						{scenario.title}
					</button>
				))}
			</div>
			<Show when={props.variants[active()]} keyed>
				{(scenario) => {
					const Demo = scenario.Component;
					return (
						<div role="tabpanel" id={`${instance}-panel-${active()}`} aria-labelledby={`${instance}-tab-${active()}`}>
							<ComponentPreview code={previewCodeMap[`${props.slug}/${scenario.id}`]}>
								<Demo />
							</ComponentPreview>
						</div>
					);
				}}
			</Show>
		</div>
	);
}
