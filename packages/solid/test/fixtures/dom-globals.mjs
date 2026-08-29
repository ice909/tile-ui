export const DOM_GLOBAL_KEYS = [
	'window',
	'document',
	'navigator',
	'Node',
	'Element',
	'HTMLElement',
	'HTMLAnchorElement',
	'HTMLButtonElement',
	'HTMLFormElement',
	'HTMLImageElement',
	'HTMLInputElement',
	'HTMLLabelElement',
	'HTMLOptGroupElement',
	'HTMLOptionElement',
	'HTMLSelectElement',
	'HTMLTextAreaElement',
	'Event',
	'CustomEvent',
	'FocusEvent',
	'InputEvent',
	'KeyboardEvent',
	'MouseEvent',
	'PointerEvent',
	'FormData',
	'MutationObserver',
	'DOMParser',
	'getComputedStyle',
];

/** 将浏览器 bundle 使用的 jsdom 全局安装到 Node，并返回完整恢复函数。 */
export function installDomGlobals(window, extras = {}) {
	const previous = new Map();
	const values = new Map(DOM_GLOBAL_KEYS.map((key) => [key, window[key]]));
	for (const [key, value] of Object.entries(extras)) values.set(key, value);

	for (const [key, value] of values) {
		if (value === undefined) continue;
		previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
		Object.defineProperty(globalThis, key, {
			configurable: true,
			value: typeof value === 'function' && key === 'getComputedStyle' ? value.bind(window) : value,
			writable: true,
		});
	}

	let restored = false;
	return () => {
		if (restored) return;
		restored = true;
		for (const [key, descriptor] of [...previous].reverse()) {
			if (descriptor === undefined) delete globalThis[key];
			else Object.defineProperty(globalThis, key, descriptor);
		}
	};
}
