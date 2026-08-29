import { useContext, type Context } from 'solid-js';

/**
 * 读取必需上下文，并在缺少 Provider 时提供明确错误。
 */
export function useRequiredContext<T>(context: Context<T | undefined>, name: string): T {
	const value = useContext(context);
	if (value === undefined) {
		throw new Error(`${name} must be used within its provider.`);
	}
	return value;
}
