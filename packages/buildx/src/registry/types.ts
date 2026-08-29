export type RegistryItemType = 'registry:ui' | 'registry:hook' | 'registry:lib' | 'registry:file' | 'registry:style' | 'registry:theme' | 'registry:base';

export interface RegistryCssVars {
	theme?: Record<string, string>;
	light?: Record<string, string>;
	dark?: Record<string, string>;
}

export type RegistryCssValue = string | { [key: string]: RegistryCssValue };

export type RegistryTransformKind =
	| 'copy'
	| 'style'
	| 'react-component'
	| 'react-barrel'
	| 'vue-component'
	| 'vue-barrel'
	| 'solid-component'
	| 'solid-barrel'
	| 'solid-primitive'
	| 'react-hook'
	| 'vue-composable'
	| 'build-utils'
	| 'build-vue-core'
	| 'build-react-lib';

export interface PackageRegistryFileSource {
	source: string;
	type: RegistryItemType;
	target?: string;
	transform: RegistryTransformKind;
	exports?: string[];
}

export interface PackageRegistryItem {
	name: string;
	type: RegistryItemType;
	title: string;
	description: string;
	dependencies?: string[];
	devDependencies?: string[];
	registryDependencies?: string[];
	tailwind?: {
		config?: {
			content?: string[];
			theme?: Record<string, unknown>;
			plugins?: string[];
		};
	};
	cssVars?: RegistryCssVars;
	css?: Record<string, RegistryCssValue>;
	extends?: string;
	style?: string;
	baseColor?: string;
	theme?: string;
	iconLibrary?: string;
	files: PackageRegistryFileSource[];
	meta?: Record<string, unknown>;
}

export interface PackageRegistryManifest {
	name: string;
	homepage: string;
	items: PackageRegistryItem[];
}

export interface VirtualRegistryFile {
	source: string;
	content: string;
}

export interface TransformFileInput {
	framework: 'react' | 'vue' | 'solid';
	item: PackageRegistryItem;
	file: PackageRegistryFileSource;
	content: string;
	workspaceRoot: string;
}

export interface TransformFileOutput {
	content: string;
	target?: string;
}

export interface BuildVirtualFilesContext {
	workspaceRoot: string;
	manifest: PackageRegistryManifest;
}

export interface RegistryBuildOptions {
	framework: 'react' | 'vue' | 'solid';
	workspaceRoot: string;
	outDir: string;
	manifest: PackageRegistryManifest;
	signal?: AbortSignal;
	transforms: {
		file: (input: TransformFileInput) => Promise<TransformFileOutput>;
		buildVirtualFiles?: (context: BuildVirtualFilesContext) => Promise<VirtualRegistryFile[]>;
	};
	validate?: {
		forbidWorkspaceImports?: string[];
	};
	hooks?: {
		onStagedFile?: (filePath: string) => Promise<void> | void;
	};
}

export interface RegistryWatchOptions {
	run: (signal: AbortSignal) => Promise<void> | void;
	watchPaths: string[];
	debounceMs?: number;
	watchRetryMs?: number;
	watchRetryLimit?: number;
	onError?: (error: unknown) => void;
	watch?: (targetPath: string, onChange: () => void) => RegistryWatcherHandle;
}

export interface RegistryWatcherHandle {
	close: () => void;
	on: (event: 'error', listener: (error: Error) => void) => unknown;
}
