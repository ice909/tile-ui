import { computed, defineComponent, h, inject, provide, type InjectionKey, type PropType, type Ref } from 'vue';
import { normalizeDirection } from '@tile-ui/core';
import type { DirectionValue } from '@tile-ui/core';

const DirectionContextKey: InjectionKey<Ref<DirectionValue>> = Symbol('tile-direction');

export const TDirectionProvider = defineComponent({
	name: 'TDirectionProvider',
	props: {
		dir: { type: String as PropType<DirectionValue>, default: undefined },
		direction: { type: String as PropType<DirectionValue>, default: undefined },
	},
	setup(props, { slots }) {
		const dir = computed(() => normalizeDirection(props.direction ?? props.dir));
		provide(DirectionContextKey, dir);
		return () => h('div', { dir: dir.value }, slots.default?.());
	},
});

/**
 * 读取当前阅读方向 (需在 TDirectionProvider 内使用)
 */
export function useDirection(): Ref<DirectionValue> {
	return inject(
		DirectionContextKey,
		computed(() => 'ltr' as DirectionValue),
	);
}

export default TDirectionProvider;
