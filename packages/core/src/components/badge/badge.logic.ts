import type { BadgeVariant } from './badge.types';
import { capitalize } from '../../utils/helpers';

/**
 * 获取 Badge 的样式类名键
 */
export function getBadgeStyleKeys(variant: BadgeVariant = 'default') {
	return {
		base: 'badge',
		variant: `variant${capitalize(variant)}`,
	};
}
