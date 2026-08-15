import type { MarkerVariant } from './marker.types';
import { capitalize } from '../../utils/helpers';

/**
 * Marker 组件样式类名键
 */
export const markerStyleKeys = {
	root: 'marker',
	icon: 'markerIcon',
	content: 'markerContent',
} as const;

/**
 * 获取 Marker 的变体类名键
 */
export function getMarkerVariantKey(variant: MarkerVariant = 'default'): string {
	return `variant${capitalize(variant)}`;
}
