import type { FieldMessageVariant } from './field.types';
import { capitalize } from '../../utils/helpers';

/**
 * Field 相关辅助 ID 集合
 */
export interface FieldIds {
	id: string;
	labelId: string;
	descriptionId: string;
	messageId: string;
}

/**
 * 根据名称生成 Field 相关的辅助 ID（纯函数）
 */
export function getFieldIds(name?: string): FieldIds {
	const base = name ?? 'field';
	return {
		id: base,
		labelId: `${base}-label`,
		descriptionId: `${base}-description`,
		messageId: `${base}-message`,
	};
}

/**
 * Field 组件样式类名键
 */
export const fieldStyleKeys = {
	root: 'root',
	label: 'label',
	description: 'description',
	message: 'message',
} as const;

/**
 * 获取 FieldMessage 的样式类名键（含变体）
 */
export function getFieldMessageStyleKeys(variant: FieldMessageVariant = 'default') {
	return {
		base: 'message',
		variant: `variant${capitalize(variant)}`,
	};
}
