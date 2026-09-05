import path from 'node:path';

import type { TransformFileInput, TransformFileOutput } from '../types';
import { rewriteCoreImports } from './shared';

function rewriteStyleImports(content: string, target: string) {
	const fromDir = path.posix.dirname(target);
	const stylesDir = path.posix.relative(fromDir, 'styles') || '.';

	return content
		.replace(/@use 'variables\/colors' as \*;/g, `@use '${stylesDir}/variables/colors' as *;`)
		.replace(/@use 'mixins\/utils' as \*;/g, `@use '${stylesDir}/mixins/utils' as *;`);
}

export async function transformReactFile(input: TransformFileInput): Promise<TransformFileOutput> {
	if (input.file.transform === 'react-component') {
		const target = input.file.target ?? `components/ui/${input.item.name}/${input.item.name}.tsx`;
		const content = rewriteCoreImports(input, target).replace(
			/import styles from '@tile-ui\/styles\/scss\/components\/(.+?)\.module\.scss';/g,
			"import styles from './$1.module.scss';",
		);

		return {
			content,
			target,
		};
	}

	if (input.file.transform === 'react-barrel') {
		const target = input.file.target ?? `components/ui/${input.item.name}/index.ts`;
		return {
			content: rewriteCoreImports(input, target),
			target,
		};
	}

	if (input.file.transform === 'style') {
		const target = input.file.target ?? `components/ui/${input.item.name}/${input.item.name}.module.scss`;

		return {
			content: rewriteStyleImports(input.content, target),
			target,
		};
	}

	if (input.file.transform === 'react-hook') {
		return {
			content: input.content,
			target: input.file.target,
		};
	}

	return {
		content: input.content,
		target: input.file.target,
	};
}
