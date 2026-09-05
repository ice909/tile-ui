import { defineComponent, h, inject, ref, useId, type ComputedRef, type PropType } from 'vue';
import { variantKey } from '../../common/lib/preview-variants';
import type { VueDemo } from './demos';
import { DocPreview } from './doc-preview';
import type { PreviewCodePayload } from '../lib/docs';

export const DemoVariants = defineComponent({
	name: 'DemoVariants',
	props: {
		title: { type: String, required: true },
		variants: { type: Array as PropType<NonNullable<VueDemo['variants']>>, required: true },
	},
	setup(props) {
		const instance = useId();
		const active = ref(0);
		const sources = inject<ComputedRef<Record<string, PreviewCodePayload>>>('preview-variant-code');
		return () => {
			const selected = props.variants[active.value];
			const Demo = selected.Component;
			return (
				<div class="demo-variants">
					<div class="component-preview-tabs__list" role="tablist" aria-label={`${props.title} scenarios`}>
						{props.variants.map((scenario, index) => (
							<button
								type="button"
								role="tab"
								id={`${instance}-tab-${index}`}
								aria-controls={`${instance}-panel-${index}`}
								aria-selected={active.value === index}
								tabindex={active.value === index ? 0 : -1}
								onClick={() => {
									active.value = index;
								}}
								onKeydown={(event: KeyboardEvent) => {
									const next = variantKey(event, index, props.variants.length);
									if (next !== null) {
										active.value = next;
										document.getElementById(`${instance}-tab-${next}`)?.focus();
									}
								}}>
								{scenario.title}
							</button>
						))}
					</div>
					<div role="tabpanel" id={`${instance}-panel-${active.value}`} aria-labelledby={`${instance}-tab-${active.value}`}>
						<DocPreview key={selected.id} title={selected.title} code={sources?.value[selected.id]}>
							{h(Demo)}
						</DocPreview>
					</div>
				</div>
			);
		};
	},
});
