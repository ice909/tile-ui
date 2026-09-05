import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { getDemoSlugs, getDemoSource, getPreviewSlugs, getDemoVariantIds } from './demo-files.mjs';
import { variantKey } from '../apps/common/lib/preview-variants.ts';

const ts = createRequire(new URL('../apps/react/package.json', import.meta.url))('typescript');
const titles = ['Live line', 'Crypto', 'Multi-line', 'Candlesticks', 'Dashboard', 'Size variants'];
const ids = ['line', 'crypto', 'multi', 'candle', 'dashboard', 'sizes'];
for (const framework of ['react', 'vue', 'solid']) {
	test(`${framework}: optional variants leave ordinary demo discovery unchanged`, () => {
		assert.deepEqual(getDemoVariantIds(framework, 'button'), []);
		assert.deepEqual(getDemoVariantIds(framework, 'liveline'), [...ids].sort());
		assert.ok(getPreviewSlugs(framework).includes('button'));
		assert.ok(!getPreviewSlugs(framework).some((slug) => slug.startsWith('button/')));
	});
	test(`${framework}: generated variant sources preserve imports and contain only their own render scenario`, () => {
		assert.ok(!getDemoSlugs(framework).some((slug) => slug.includes('/')));
		const sources = ids.map((id, index) => {
			const slug = `liveline/${id}`;
			assert.ok(getPreviewSlugs(framework).includes(slug));
			const source = getDemoSource(framework, slug);
			const parsed = ts.createSourceFile('demo.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
			assert.equal(parsed.parseDiagnostics.length, 0);
			const imports = parsed.statements.filter(ts.isImportDeclaration).map((node) => node.moduleSpecifier.text);
			assert.ok(imports.includes(framework === 'solid' ? 'solid-js' : framework));
			assert.ok(imports.includes(`@tile-ui/${framework}`));
			assert.ok(!imports.some((name) => name.startsWith('.') || name.startsWith('@/')));
			assert.match(source, /<Liveline\b/);
			assert.match(source, /function seedDemoFeed/);
			assert.doesNotMatch(source, /ComponentPreview|previewCodeMap|role="tablist"|type Scenario/);
			assert.ok(source.includes(`<h3>{'${titles[index]}'}</h3>`));
			for (const title of titles.filter((_, other) => other !== index)) assert.ok(!source.includes(`<h3>{'${title}'}</h3>`));
			if (id === 'line') {
				assert.match(source, /degen=\{false\}/);
				assert.match(source, /disabled=\{false\}/);
			}
			return source;
		});
		assert.equal(new Set(sources).size, 6);
		assert.equal(getDemoSource(framework, 'liveline'), sources[0]);
	});
}

test('variant keyboard navigation uses the supplied count, not Liveline scenario count', () => {
	for (const count of [1, 2, 7]) {
		let prevented = 0;
		const key = (key, index) =>
			variantKey(
				{
					key,
					preventDefault() {
						prevented++;
					},
				},
				index,
				count,
			);
		assert.equal(key('End', 0), count - 1);
		assert.equal(key('Home', count - 1), 0);
		assert.equal(key('ArrowRight', count - 1), 0);
		assert.equal(key('ArrowLeft', 0), count - 1);
		assert.equal(key('Tab', 0), null);
		assert.equal(prevented, 4);
	}
});
