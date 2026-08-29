import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(appRoot, file), 'utf8');
const docs = read('content/docs/primitives.mdx');
const demo = read('components/primitive-demos/primitives.tsx');
const demoRegistry = read('components/primitive-demos/index.ts');
const componentRegistry = read('components/demos/index.ts');
const renderer = read('src/components/primitive-demo.tsx');
const route = read('src/routes/docs/[...slug].tsx');
const generator = read('scripts/generate-primitive-preview-code.mjs');

const sections = ['Introduction', 'Package install', 'Package usage', 'SSR contract', 'Cleanup contract', 'Primitive groups', 'Registry install', 'API reference', 'Related docs'];
let previousSection = -1;
for (const section of sections) {
	const index = docs.indexOf(`## ${section}`);
	assert.ok(index > previousSection, `Missing or out-of-order primitive docs section: ${section}`);
	previousSection = index;
}

const packageApis = [
	'createLocalStorage',
	'createSessionStorage',
	'createWindowSize',
	'createMediaQuery',
	'createIsMobile',
	'createOnlineStatus',
	'createScrollPosition',
	'createMousePosition',
	'createCopyToClipboard',
	'createKeyPress',
	'createClickOutside',
];
for (const name of packageApis) {
	assert.match(docs, new RegExp(`\\b${name}\\b`), `Primitive docs missing ${name}`);
	assert.match(demo, new RegExp(`\\b${name}\\b`), `Primitive demo missing ${name}`);
}

const registryNames = ['create-local-storage', 'create-media-query', 'create-copy-to-clipboard'];
for (const name of registryNames) assert.match(docs, new RegExp(`(?:/r/|\\x60)${name}(?:\\.json|\\x60)`), `Primitive docs missing registry item ${name}`);
assert.doesNotMatch(docs, /\/r\/(?:storage|media|events)\.json/);
assert.match(docs, /`create-local-storage`\s*\| `createLocalStorage`, `createSessionStorage`/);
assert.match(docs, /`create-media-query`\s*\| `createWindowSize`, `createMediaQuery`, `createIsMobile`, `createOnlineStatus`, `createScrollPosition`/);
assert.match(docs, /`create-copy-to-clipboard`\s*\| `createCopyToClipboard`/);
assert.match(docs, /createClickOutside`, `createKeyPress`, and `createMousePosition` remain package-only in this registry lane/);
assert.match(docs, /Accessor<Element \| null \| undefined>/);
assert.match(docs, /createClickOutside\(panelElement, \(\) => setOpen\(false\)\)/);

assert.match(demo, /role="status" aria-live="polite" aria-atomic="true"/);
assert.doesNotMatch(demo, /(?:windowSize|scroll|mouse)\(\).*aria-live/);
assert.match(demo, /let outsideTarget: HTMLElement \| undefined;/);
assert.match(demo, /createClickOutside\(\(\) => outsideTarget, props\.onOutsidePress\)/);
assert.match(demo, /<section ref=\{\(element\) => \(outsideTarget = element\)\}/);
assert.match(renderer, /onCleanup\(\(\) =>/);
assert.match(renderer, /copyGeneration/);
assert.match(renderer, /clearTimeout\(resetTimer\)/);
assert.match(renderer, /setCopyState\('idle'\);\s*try/);
assert.match(renderer, /Unable to copy source\. Select the code and copy it manually\./);

assert.match(demoRegistry, /primitives:/);
assert.doesNotMatch(componentRegistry, /primitive-demos|\bprimitives:/);
assert.match(route, /slug\(\) === 'primitives'/);
assert.match(generator, /components\/primitive-demos/);
assert.match(generator, /raw = fs\.readFileSync/);
assert.match(generator, /primitive-preview-code\.ts/);

console.log('Solid primitive docs/demo lane source contracts passed.');
