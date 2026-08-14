import type { InputOtpMode } from './input-otp.types';

/**
 * InputOTP 组件样式类名键
 */
export const inputOtpStyleKeys = {
	root: 'root',
	group: 'group',
	slot: 'slot',
	caret: 'caret',
	separator: 'separator',
} as const;

/**
 * 默认 OTP 长度
 */
export const INPUT_OTP_DEFAULT_LENGTH = 4;

/**
 * 拆分 OTP 字符串为字符数组 (仅保留前 maxLength 个字符)
 */
export function splitOtpValue(value: string, maxLength: number = INPUT_OTP_DEFAULT_LENGTH): string[] {
	const chars = Array.from(value).slice(0, maxLength);
	const result: string[] = [];
	for (let i = 0; i < maxLength; i++) {
		result.push(chars[i] ?? '');
	}
	return result;
}

/**
 * 拼接字符数组为 OTP 字符串
 */
export function joinOtpValue(chars: string[], maxLength: number = INPUT_OTP_DEFAULT_LENGTH): string {
	return chars.slice(0, maxLength).join('');
}

/**
 * 根据输入模式判断字符是否合法
 */
export function isOtpCharAllowed(char: string, mode: InputOtpMode = 'alphanumeric'): boolean {
	if (char.length !== 1) {
		return false;
	}
	switch (mode) {
		case 'numeric':
			return /[0-9]/.test(char);
		case 'alphanumeric':
			return /[a-zA-Z0-9]/.test(char);
		default:
			return true;
	}
}

/**
 * 计算下一个可聚焦的槽位索引
 */
export function getNextOtpIndex(index: number, maxLength: number): number | null {
	const next = index + 1;
	return next < maxLength ? next : null;
}

/**
 * 计算上一个可聚焦的槽位索引
 */
export function getPrevOtpIndex(index: number): number | null {
	const prev = index - 1;
	return prev >= 0 ? prev : null;
}
