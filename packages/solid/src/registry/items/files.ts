import type { PackageRegistryItem } from '@tile-ui/buildx/registry/types';
import { darkThemeOverrides, lightThemeCssVars, tileExtensionCssVars } from '../../../../core/src/tokens';

export const solidFileItems: PackageRegistryItem[] = [
	{
		name: 'styles',
		type: 'registry:style',
		title: 'Styles',
		description: 'Tile UI runtime extensions and shared Sass dependencies.',
		devDependencies: ['sass'],
		cssVars: {
			light: tileExtensionCssVars,
		},
		files: [
			{ source: 'packages/styles/scss/tokens.scss', type: 'registry:file', transform: 'style', target: 'styles/tokens.scss' },
			{ source: 'packages/styles/scss/globals.scss', type: 'registry:file', transform: 'style', target: 'styles/globals.scss' },
			{ source: 'packages/styles/scss/theme.scss', type: 'registry:file', transform: 'style', target: 'styles/theme.scss' },
			{ source: 'packages/styles/scss/reset.scss', type: 'registry:file', transform: 'style', target: 'styles/reset.scss' },
			{ source: 'packages/styles/scss/variables/_colors.scss', type: 'registry:file', transform: 'style', target: 'styles/variables/_colors.scss' },
			{ source: 'packages/styles/scss/mixins/_utils.scss', type: 'registry:file', transform: 'style', target: 'styles/mixins/_utils.scss' },
		],
	},
	{
		name: 'theme-default',
		type: 'registry:theme',
		title: 'Default Theme',
		description: 'Optional Tile UI default palette and runtime token theme.',
		registryDependencies: ['@tile-ui/styles'],
		cssVars: {
			light: lightThemeCssVars,
			dark: darkThemeOverrides,
		},
		files: [{ source: 'packages/styles/scss/theme.scss', type: 'registry:file', transform: 'style', target: 'styles/theme.scss' }],
	},
];
