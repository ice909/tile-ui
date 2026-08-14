import type { AlertVariant } from './alert.types';
import { capitalize } from '../../utils/helpers';

/**
 * Alert 组件样式类名键
 */
export const alertStyleKeys = {
	title: 'title',
	description: 'description',
} as const;

/**
 * 获取 Alert 的样式类名键
 */
export function getAlertStyleKeys(variant: AlertVariant = 'default') {
	return {
		base: 'alert',
		variant: `variant${capitalize(variant)}`,
	};
}
