import { computed, defineComponent, inject, provide, type ComputedRef, type InjectionKey, type PropType } from 'vue';

export type PortalContainer = Element | null;

const PortalContainerKey: InjectionKey<ComputedRef<PortalContainer>> = Symbol('tile-portal-container');

export const PortalProvider = defineComponent({
	name: 'PortalProvider',
	props: {
		container: { type: Object as PropType<PortalContainer>, default: null },
	},
	setup(props, { slots }) {
		const parentContainer = inject(
			PortalContainerKey,
			computed(() => null),
		);

		provide(
			PortalContainerKey,
			computed(() => props.container ?? parentContainer.value),
		);

		return () => slots.default?.();
	},
});

export function usePortalContainer(container?: () => PortalContainer | undefined): ComputedRef<Element | string> {
	const contextContainer = inject(
		PortalContainerKey,
		computed(() => null),
	);

	return computed(() => container?.() ?? contextContainer.value ?? 'body');
}
