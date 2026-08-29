import type { JSX } from 'solid-js';

export type SolidEventHandler<T extends Element, E extends Event> = JSX.EventHandlerUnion<T, E>;

/** Solid ref 仅支持挂载时回调，不模拟 React object/null ref。 */
export type CallbackRef<T> = (element: T) => void;

/** 合并多个 Solid callback ref。 */
export function composeRefs<T>(...refs: Array<CallbackRef<T> | undefined>): CallbackRef<T> {
	return (element) => {
		for (const ref of refs) ref?.(element);
	};
}

/**
 * 调用 Solid 原生事件处理器，兼容函数与 [handler, data] 绑定形式。
 */
export function invokeEventHandler<E extends Event>(handler: unknown, event: E) {
	if (!handler) {
		return;
	}

	if (Array.isArray(handler)) {
		handler[0](handler[1], event);
		return;
	}

	(handler as (event: E) => void)(event);
}

/**
 * 依次调用事件处理器；前一个处理器阻止默认行为后，不再调用后续处理器。
 */
export function composeEventHandlers<E extends Event>(...handlers: unknown[]) {
	return (event: E) => {
		for (const handler of handlers) {
			if (event.defaultPrevented) {
				break;
			}
			invokeEventHandler(handler, event);
		}
	};
}
