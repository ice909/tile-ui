import path from 'node:path';

import type { TransformFileInput, TransformFileOutput } from '../types';

function moduleTarget(target: string) {
	const withoutExtension = target.replace(/\.[cm]?[jt]sx?$/, '');
	return withoutExtension.endsWith('/index') ? withoutExtension.slice(0, -'/index'.length) : withoutExtension;
}

function relativeImport(fromTarget: string, toTarget: string) {
	const relative = path.posix.relative(path.posix.dirname(fromTarget), moduleTarget(toTarget));
	return relative.startsWith('.') ? relative : `./${relative}`;
}

/** Rewrites explicitly mapped package imports before applying the legacy flattened core fallback. */
export function rewriteCoreImports(input: TransformFileInput, target: string) {
	const importTargets = new Map(
		(input.manifest?.items ?? []).flatMap((item) => item.files.flatMap((file) => (file.registryImport && file.target ? [[file.registryImport, file.target] as const] : []))),
	);

	return input.content.replace(/(['"])(@tile-ui\/core(?:\/[^'"]*)?)\1/g, (match, quote: string, specifier: string) => {
		const mappedTarget = importTargets.get(specifier);
		if (mappedTarget) return `${quote}${relativeImport(target, mappedTarget)}${quote}`;
		return `${quote}${relativeImport(target, 'components/ui/lib/core.ts')}${quote}`;
	});
}

export async function passthroughTransform(input: TransformFileInput): Promise<TransformFileOutput> {
	return {
		content: input.content,
		target: input.file.target,
	};
}
