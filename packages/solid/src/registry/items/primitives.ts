import type { PackageRegistryItem } from '@tile-ui/buildx/registry/types';

export const solidPrimitiveItems: PackageRegistryItem[] = [
	{
		name: 'create-local-storage',
		type: 'registry:hook',
		title: 'createLocalStorage',
		description: 'Solid primitives for local and session storage signals.',
		dependencies: ['solid-js'],
		files: [
			{
				source: 'packages/solid/src/primitives/storage.ts',
				type: 'registry:hook',
				transform: 'solid-primitive',
				target: 'primitives/create-local-storage.ts',
				exports: ['StorageDefaultValue', 'StorageSignal', 'createLocalStorage', 'createSessionStorage'],
			},
		],
	},
	{
		name: 'create-media-query',
		type: 'registry:hook',
		title: 'createMediaQuery',
		description: 'Solid primitives for window, media, mobile, online, and scroll state.',
		dependencies: ['solid-js'],
		files: [
			{
				source: 'packages/solid/src/primitives/media.ts',
				type: 'registry:hook',
				transform: 'solid-primitive',
				target: 'primitives/create-media-query.ts',
				exports: ['WindowSize', 'Point', 'ReactiveValue', 'createWindowSize', 'createMediaQuery', 'createIsMobile', 'createOnlineStatus', 'createScrollPosition'],
			},
		],
	},
	{
		name: 'create-copy-to-clipboard',
		type: 'registry:hook',
		title: 'createCopyToClipboard',
		description: 'Solid primitive for Clipboard API interactions and copy state.',
		dependencies: ['solid-js'],
		files: [
			{
				source: 'packages/solid/src/primitives/events.ts',
				type: 'registry:hook',
				transform: 'solid-primitive',
				target: 'primitives/create-copy-to-clipboard.ts',
				exports: ['CopyToClipboardOptions', 'CopyToClipboardResult', 'createCopyToClipboard'],
			},
		],
	},
];
