import { createRequire } from 'node:module';
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

function getDeclarationNames(ts: any, statement: any): string[] {
	if (
		ts.isFunctionDeclaration(statement) ||
		ts.isClassDeclaration(statement) ||
		ts.isInterfaceDeclaration(statement) ||
		ts.isTypeAliasDeclaration(statement) ||
		ts.isEnumDeclaration(statement)
	) {
		return statement.name ? [statement.name.text] : [];
	}

	if (!ts.isVariableStatement(statement)) return [];
	return statement.declarationList.declarations.flatMap((declaration: any) => (ts.isIdentifier(declaration.name) ? [declaration.name.text] : []));
}

function selectPrimitiveExports(workspaceRoot: string, content: string, source: string, exports: string[]): string {
	const ts: any = createRequire(path.resolve(workspaceRoot, 'packages/solid/package.json'))('typescript');
	const sourceFile = ts.createSourceFile(source, content, ts.ScriptTarget.Latest, true, source.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
	const declarations = new Map<string, any>();
	for (const statement of sourceFile.statements) {
		for (const name of getDeclarationNames(ts, statement)) declarations.set(name, statement);
	}

	const selected = new Set<any>();
	const pending = [...exports];
	const visited = new Set<string>();
	while (pending.length > 0) {
		const name = pending.shift()!;
		if (visited.has(name)) continue;
		visited.add(name);
		const statement = declarations.get(name);
		if (!statement) throw new Error(`Solid primitive export '${name}' was not found in ${source}.`);
		selected.add(statement);
		const visit = (node: any) => {
			if (ts.isIdentifier(node) && declarations.has(node.text) && !visited.has(node.text)) pending.push(node.text);
			ts.forEachChild(node, visit);
		};
		visit(statement);
	}

	const referencedImports = new Set<string>();
	for (const statement of selected) {
		const visit = (node: any) => {
			if (ts.isIdentifier(node)) referencedImports.add(node.text);
			ts.forEachChild(node, visit);
		};
		visit(statement);
	}

	const imports = sourceFile.statements.flatMap((statement: any) => {
		if (!ts.isImportDeclaration(statement)) return [];
		const clause = statement.importClause;
		if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) return referencedImports.has(clause?.name?.text ?? '') ? [statement.getText(sourceFile)] : [];
		const elements = clause.namedBindings.elements.filter((element: any) => referencedImports.has(element.name.text));
		if (elements.length === 0) return [];
		const names = elements.map((element: any) => `${element.isTypeOnly ? 'type ' : ''}${element.propertyName ? `${element.propertyName.text} as ` : ''}${element.name.text}`);
		return [`import { ${names.join(', ')} } from ${statement.moduleSpecifier.getText(sourceFile)};`];
	});
	const bodies = sourceFile.statements.filter((statement: any) => selected.has(statement)).map((statement: any) => statement.getFullText(sourceFile).trim());
	return [...imports, '', ...bodies].join('\n\n').trim() + '\n';
}

/**
 * SolidJS 组件 transform：与 react/vue 相同，仅做 import 改写，
 * 证明 buildx registry 管线可直接复用于 SolidJS。
 */
export async function transformSolidFile(input: TransformFileInput): Promise<TransformFileOutput> {
	if (input.file.transform === 'solid-primitive') {
		if (!input.file.target) throw new Error(`Solid primitive '${input.item.name}' requires an explicit target.`);
		return {
			content: input.file.exports?.length ? selectPrimitiveExports(input.workspaceRoot, input.content, input.file.source, input.file.exports) : input.content,
			target: input.file.target,
		};
	}

	if (input.file.transform === 'solid-component') {
		const target = input.file.target ?? `components/ui/${input.item.name}/${input.item.name}.tsx`;
		const content = rewriteCoreImports(input, target)
			.replace(/from\s+(['"])\.\.\/\.\.\/utils(?:\/[^'"]*)?(?:\.[cm]?[jt]sx?)?\1/g, "from '../lib/utils'")
			.replace(/import styles from '@tile-ui\/styles\/scss\/components\/(.+?)\.module\.scss';/g, "import styles from './$1.module.scss';");

		return {
			content,
			target,
		};
	}

	if (input.file.transform === 'solid-barrel') {
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

	return {
		content: input.content,
		target: input.file.target,
	};
}
