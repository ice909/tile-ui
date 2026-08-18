import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		'hooks/index': 'src/hooks/index.ts',
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
	external: ['react', 'react-dom', '@tile-ui/styles'],
});
