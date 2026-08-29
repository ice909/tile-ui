const keys = [
	'window',
	'document',
	'Document',
	'navigator',
	'Node',
	'Element',
	'HTMLElement',
	'HTMLAnchorElement',
	'HTMLBodyElement',
	'HTMLButtonElement',
	'HTMLFormElement',
	'HTMLHeadElement',
	'HTMLImageElement',
	'HTMLInputElement',
	'HTMLLabelElement',
	'HTMLOptionElement',
	'HTMLSelectElement',
	'HTMLTextAreaElement',
	'SVGElement',
	'Event',
	'CustomEvent',
	'FocusEvent',
	'InputEvent',
	'KeyboardEvent',
	'MouseEvent',
	'PointerEvent',
	'FormData',
	'MutationObserver',
	'ResizeObserver',
	'DOMParser',
	'DOMRect',
	'getComputedStyle',
	'requestAnimationFrame',
	'cancelAnimationFrame',
	'matchMedia',
	'localStorage',
	'sessionStorage',
	'_$HY',
];

export function snapshotGlobals() {
	return new Map(keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
}

export function installGlobals(window) {
	const before = snapshotGlobals();
	const values = { _$HY: window._$HY };
	for (const key of keys) {
		if (key === '_$HY') continue;
		let value = window[key];
		if (key === 'getComputedStyle' && value) value = value.bind(window);
		if (key === 'requestAnimationFrame' && !value) value = (callback) => window.setTimeout(() => callback(Date.now()), 0);
		if (key === 'cancelAnimationFrame' && !value) value = window.clearTimeout.bind(window);
		if (key === 'matchMedia' && !value) value = () => ({ addEventListener() {}, matches: false, media: '', removeEventListener() {} });
		if (value !== undefined) values[key] = value;
	}
	for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, value, writable: true });
	return () => restoreGlobals(before);
}

export function restoreGlobals(before) {
	for (const [key, descriptor] of [...before].reverse()) {
		if (descriptor === undefined) Reflect.deleteProperty(globalThis, key);
		else Object.defineProperty(globalThis, key, descriptor);
	}
}
