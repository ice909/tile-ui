import assert from 'node:assert/strict';

for (const key of ['window', 'document', 'navigator']) Reflect.deleteProperty(globalThis, key);

const calls = { listeners: 0, intervals: 0, timeouts: 0 };
const originals = {
	addEventListener: globalThis.addEventListener,
	setInterval: globalThis.setInterval,
	setTimeout: globalThis.setTimeout,
};

Object.defineProperty(globalThis, 'addEventListener', {
	configurable: true,
	value: () => {
		calls.listeners += 1;
	},
	writable: true,
});
globalThis.setInterval = (...args) => {
	calls.intervals += 1;
	return originals.setInterval(...args);
};
globalThis.setTimeout = (...args) => {
	calls.timeouts += 1;
	return originals.setTimeout(...args);
};

try {
	const root = await import('@tile-ui/solid');
	const primitives = await import('@tile-ui/solid/primitives');
	assert.equal(typeof root.Button, 'function');
	assert.equal(typeof root.toast, 'function');
	assert.equal(typeof primitives.createWindowSize, 'function');
	assert.deepEqual(calls, { listeners: 0, intervals: 0, timeouts: 0 });
} finally {
	if (originals.addEventListener === undefined) Reflect.deleteProperty(globalThis, 'addEventListener');
	else Object.defineProperty(globalThis, 'addEventListener', { configurable: true, value: originals.addEventListener, writable: true });
	globalThis.setInterval = originals.setInterval;
	globalThis.setTimeout = originals.setTimeout;
}
