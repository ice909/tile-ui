import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		'utils/index': 'src/utils/index.ts',
		'tokens/index': 'src/tokens/index.ts',
		'liveline/index': 'src/liveline/index.ts',
	},
	format: ['esm', 'cjs'],
	dts: {
		compilerOptions: {
			ignoreDeprecations: '6.0',
		},
	},
	clean: true,
	sourcemap: true,
	splitting: false,
	treeshake: true,
});
