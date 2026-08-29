import { readFileSync } from 'node:fs';
import { transformAsync } from '@babel/core';
import type { Plugin } from 'esbuild';
import { defineConfig } from 'tsup';

function solidJsxPlugin(generate: 'dom' | 'ssr'): Plugin {
	return {
		name: `solid-jsx-${generate}`,
		setup(build) {
			build.onLoad({ filter: /\.[jt]sx$/, namespace: 'file' }, async (args) => {
				const source = readFileSync(args.path, 'utf8');
				const result = await transformAsync(source, {
					babelrc: false,
					configFile: false,
					filename: args.path,
					presets: [
						['babel-preset-solid', { generate, hydratable: true }],
						['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
					],
					sourceMaps: 'inline',
				});
				return { contents: result?.code ?? '', loader: 'js' };
			});
		},
	};
}

const shared = {
	format: ['esm'] as const,
	sourcemap: true,
	splitting: false,
	treeshake: true,
	external: ['solid-js', 'solid-js/web', '@tile-ui/styles'],
};

export default defineConfig([
	{
		...shared,
		entry: { browser: 'src/index.ts', 'primitives/browser': 'src/primitives/index.ts' },
		dts: {
			entry: { index: 'src/index.ts', 'primitives/index': 'src/primitives/index.ts' },
			compilerOptions: { ignoreDeprecations: '6.0' },
		},
		clean: true,
		esbuildPlugins: [solidJsxPlugin('dom')],
	},
	{
		...shared,
		entry: { server: 'src/index.ts', 'primitives/server': 'src/primitives/index.ts' },
		clean: false,
		esbuildPlugins: [solidJsxPlugin('ssr')],
	},
]);
