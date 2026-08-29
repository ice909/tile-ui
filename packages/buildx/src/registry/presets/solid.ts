import fs from 'node:fs';
import path from 'node:path';

import type { RegistryBuildOptions, VirtualRegistryFile } from '../types';
import { transformSolidFile } from '../transforms/solid';
import { getNamedImports, loadTypeScript, readCoreSourceClosure, resolveCoreExport, resolveLocalModule } from './core-source';

interface ExternalImport {
	defaultName?: string;
	namespaceName?: string;
	named: Map<string, { imported: string; typeOnly: boolean }>;
}

interface LocalAlias {
	filePath: string;
	localName: string;
	targetName: string;
}

/** 使用 TypeScript AST 展开本地依赖并合并为单个 registry utils 文件。 */
export function buildSolidUtilsSource(workspaceRoot: string, entryFiles: string[]): string {
	const ts = loadTypeScript(workspaceRoot);
	const visited = new Set<string>();
	const visiting = new Set<string>();
	const visitStack: string[] = [];
	const imports = new Map<string, ExternalImport>();
	const declarations = new Map<string, string>();
	const bindings = new Map<string, { identity: string; owner: string }>();
	const localFiles: string[] = [];
	const localAliases: LocalAlias[] = [];
	const directExports = new Set<string>();
	const exportedNames = new Map<string, { localName: string; owner: string }>();
	const localExports = new Map<string, string>();
	const addExport = (exportedName: string, localName: string, owner: string, direct: boolean = false, render: boolean = true) => {
		if (exportedName === 'default' || localName === 'default') throw new Error(`Unsupported local default export in ${owner}`);
		const existing = exportedNames.get(exportedName);
		if (existing && existing.localName !== localName) {
			throw new Error(`Solid virtual utils export '${exportedName}' collides between ${existing.owner} and ${owner}`);
		}
		exportedNames.set(exportedName, { localName, owner });
		if (direct) directExports.add(exportedName);
		else if (render) localExports.set(exportedName, localName);
	};

	const addDeclaration = (name: string | undefined, filePath: string) => {
		if (!name) return;
		const existing = declarations.get(name);
		if (existing && existing !== filePath) {
			throw new Error(`Duplicate Solid virtual utils declaration '${name}' in ${path.relative(workspaceRoot, existing)} and ${path.relative(workspaceRoot, filePath)}`);
		}
		declarations.set(name, filePath);
		const importOwner = bindings.get(name);
		if (importOwner) throw new Error(`Solid virtual utils binding '${name}' collides between declaration ${path.relative(workspaceRoot, filePath)} and ${importOwner.owner}`);
	};
	const addBindingNameDeclarations = (name: any, filePath: string) => {
		if (ts.isIdentifier(name)) {
			addDeclaration(name.text, filePath);
			return;
		}
		for (const element of name?.elements ?? []) {
			if (element?.name) addBindingNameDeclarations(element.name, filePath);
		}
	};
	const addBinding = (name: string, identity: string, owner: string) => {
		const declarationOwner = declarations.get(name);
		if (declarationOwner)
			throw new Error(`Solid virtual utils binding '${name}' collides between import ${owner} and declaration ${path.relative(workspaceRoot, declarationOwner)}`);
		const existing = bindings.get(name);
		if (existing && existing.identity !== identity) throw new Error(`Solid virtual utils import binding '${name}' collides between ${existing.owner} and ${owner}`);
		bindings.set(name, { identity, owner });
	};
	const addExternalImport = (statement: any, moduleName: string, filePath: string) => {
		const clause = statement.importClause;
		if (!clause) {
			imports.set(moduleName, imports.get(moduleName) ?? { named: new Map() });
			return;
		}
		const entry = imports.get(moduleName) ?? { named: new Map<string, { imported: string; typeOnly: boolean }>() };
		if (clause.name) {
			addBinding(clause.name.text, `${moduleName}:default`, `'${moduleName}' default in ${path.relative(workspaceRoot, filePath)}`);
			if (entry.defaultName && entry.defaultName !== clause.name.text)
				throw new Error(`Conflicting default imports from '${moduleName}' in ${path.relative(workspaceRoot, filePath)}`);
			entry.defaultName = clause.name.text;
		}
		if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
			addBinding(clause.namedBindings.name.text, `${moduleName}:*`, `'${moduleName}' namespace in ${path.relative(workspaceRoot, filePath)}`);
			if (entry.namespaceName && entry.namespaceName !== clause.namedBindings.name.text)
				throw new Error(`Conflicting namespace imports from '${moduleName}' in ${path.relative(workspaceRoot, filePath)}`);
			entry.namespaceName = clause.namedBindings.name.text;
		}
		const elements = clause.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements : [];
		for (const element of elements) {
			const local = element.name.text;
			const imported = element.propertyName?.text ?? local;
			addBinding(local, `${moduleName}:${imported}`, `'${moduleName}' import '${imported}' in ${path.relative(workspaceRoot, filePath)}`);
			const existing = entry.named.get(local);
			if (existing && existing.imported !== imported)
				throw new Error(`Conflicting import alias '${local}' from '${moduleName}' in ${path.relative(workspaceRoot, filePath)}`);
			const incomingTypeOnly = clause.isTypeOnly || element.isTypeOnly;
			entry.named.set(local, { imported, typeOnly: existing ? existing.typeOnly && incomingTypeOnly : incomingTypeOnly });
		}
		imports.set(moduleName, entry);
	};
	const visit = (filePath: string) => {
		if (visited.has(filePath)) return;
		if (visiting.has(filePath)) {
			const cycleStart = visitStack.indexOf(filePath);
			const cycle = [...visitStack.slice(cycleStart), filePath].map((entry) => path.relative(workspaceRoot, entry)).join(' -> ');
			throw new Error(`Solid virtual utils dependency cycle: ${cycle}`);
		}
		if (!fs.existsSync(filePath)) throw new Error(`Missing Solid virtual utils dependency: ${path.relative(workspaceRoot, filePath)}`);
		visiting.add(filePath);
		visitStack.push(filePath);
		const source = fs.readFileSync(filePath, 'utf-8');
		const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
		for (const statement of sourceFile.statements) {
			if (ts.isExportAssignment(statement) || statement.modifiers?.some((modifier: any) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
				throw new Error(`Unsupported local default export in ${path.relative(workspaceRoot, filePath)}`);
			}
			if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
			const moduleName = statement.moduleSpecifier?.text;
			if (!moduleName) continue;
			if (moduleName.startsWith('.')) {
				const dependency = resolveLocalModule(filePath, moduleName);
				if (!dependency) throw new Error(`Unable to resolve Solid virtual utils dependency '${moduleName}' from ${path.relative(workspaceRoot, filePath)}`);
				if (ts.isImportDeclaration(statement)) {
					const clause = statement.importClause;
					if (clause?.name) throw new Error(`Unsupported local default import '${clause.name.text}' from '${moduleName}' in ${path.relative(workspaceRoot, filePath)}`);
					if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
						throw new Error(`Unsupported local namespace import '${clause.namedBindings.name.text}' from '${moduleName}' in ${path.relative(workspaceRoot, filePath)}`);
					}
				}
				if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamespaceExport(statement.exportClause)) {
					throw new Error(
						`Unsupported local namespace re-export '${statement.exportClause.name.text}' from '${moduleName}' in ${path.relative(workspaceRoot, filePath)}`,
					);
				}
				if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
					for (const element of statement.exportClause.elements) {
						const imported = element.propertyName?.text ?? element.name.text;
						if (imported === 'default' || element.name.text === 'default') {
							throw new Error(`Unsupported local default re-export from '${moduleName}' in ${path.relative(workspaceRoot, filePath)}`);
						}
					}
				}
				visit(dependency);
			} else if (ts.isImportDeclaration(statement)) addExternalImport(statement, moduleName, filePath);
		}
		for (const statement of sourceFile.statements) {
			const directlyExported = statement.modifiers?.some((modifier: any) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
			if (
				ts.isFunctionDeclaration(statement) ||
				ts.isClassDeclaration(statement) ||
				ts.isInterfaceDeclaration(statement) ||
				ts.isTypeAliasDeclaration(statement) ||
				ts.isEnumDeclaration(statement)
			) {
				addDeclaration(statement.name?.text, filePath);
				if (directlyExported && statement.name?.text) addExport(statement.name.text, statement.name.text, `declaration ${path.relative(workspaceRoot, filePath)}`, true);
			} else if (ts.isVariableStatement(statement)) {
				for (const declaration of statement.declarationList?.declarations ?? []) {
					addBindingNameDeclarations(declaration.name, filePath);
					if (directlyExported) {
						const names: string[] = [];
						const collect = (name: any) => {
							if (ts.isIdentifier(name)) names.push(name.text);
							else for (const element of name?.elements ?? []) if (element?.name) collect(element.name);
						};
						collect(declaration.name);
						for (const name of names) addExport(name, name, `declaration ${path.relative(workspaceRoot, filePath)}`, true);
					}
				}
			}
		}
		visitStack.pop();
		visiting.delete(filePath);
		visited.add(filePath);
		localFiles.push(filePath);
	};
	for (const entryFile of entryFiles) visit(entryFile);

	const program = ts.createProgram({ rootNames: localFiles, options: { target: ts.ScriptTarget.Latest, moduleResolution: ts.ModuleResolutionKind.Bundler } });
	const checker = program.getTypeChecker();
	for (const filePath of localFiles) {
		const sourceFile = program.getSourceFile(filePath);
		if (!sourceFile) continue;
		for (const statement of sourceFile.statements) {
			if (ts.isImportDeclaration(statement) && statement.moduleSpecifier.text.startsWith('.')) {
				const bindings = statement.importClause?.namedBindings;
				if (bindings && ts.isNamedImports(bindings)) {
					for (const element of bindings.elements) {
						const symbol = checker.getSymbolAtLocation(element.name);
						const target = symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
						const targetName = target?.getName();
						if (!targetName || targetName === 'default') {
							throw new Error(
								`Unable to resolve local import '${element.name.text}' from '${statement.moduleSpecifier.text}' in ${path.relative(workspaceRoot, filePath)}`,
							);
						}
						if (element.name.text !== targetName) localAliases.push({ filePath, localName: element.name.text, targetName });
					}
				}
			}
			if (ts.isExportDeclaration(statement) && statement.moduleSpecifier?.text.startsWith('.') && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
				for (const element of statement.exportClause.elements) {
					const symbol = checker.getSymbolAtLocation(element.name);
					const target = symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
					const localName = target?.getName();
					if (!localName || localName === 'default') {
						throw new Error(
							`Unable to resolve local re-export '${element.name.text}' from '${statement.moduleSpecifier.text}' in ${path.relative(workspaceRoot, filePath)}`,
						);
					}
					addExport(element.name.text, localName, `re-export ${path.relative(workspaceRoot, filePath)}`);
				}
			}
			if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
				for (const element of statement.exportClause.elements) {
					const localNode = element.propertyName ?? element.name;
					if (localNode.text === 'default' || element.name.text === 'default') {
						throw new Error(`Unsupported local default export in ${path.relative(workspaceRoot, filePath)}`);
					}
					const symbol = checker.getSymbolAtLocation(localNode);
					const target = symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
					const localName = target?.getName() ?? localNode.text;
					addExport(element.name.text, localName, `export ${path.relative(workspaceRoot, filePath)}`, false, false);
				}
			}
		}
	}

	const bodies = localFiles.map((filePath) => {
		const source = fs.readFileSync(filePath, 'utf-8');
		const sourceFile = program.getSourceFile(filePath)!;
		const aliases = localAliases.filter((alias) => alias.filePath === filePath);
		const replacements: Array<{ start: number; end: number; text: string }> = [];
		const visitNode = (node: any) => {
			if (ts.isImportDeclaration(node)) return;
			if (ts.isExportDeclaration(node)) {
				if (!node.moduleSpecifier && node.exportClause && ts.isNamedExports(node.exportClause)) {
					for (const element of node.exportClause.elements) {
						const localNode = element.propertyName ?? element.name;
						const alias = aliases.find((candidate) => candidate.localName === localNode.text);
						if (alias) {
							const text = alias.targetName === element.name.text ? alias.targetName : `${alias.targetName} as ${element.name.text}`;
							replacements.push({ start: element.getStart(sourceFile), end: element.end, text });
						}
					}
				}
				return;
			}
			if (ts.isShorthandPropertyAssignment(node)) {
				const alias = aliases.find((candidate) => candidate.localName === node.name.text);
				if (alias) {
					const initializer = node.objectAssignmentInitializer;
					const value = initializer ? `${alias.targetName} === undefined ? ${initializer.getText(sourceFile)} : ${alias.targetName}` : alias.targetName;
					replacements.push({ start: node.getStart(sourceFile), end: node.end, text: `${node.name.text}: ${value}` });
					return;
				}
			}
			if (ts.isIdentifier(node)) {
				const alias = aliases.find((candidate) => candidate.localName === node.text);
				if (alias) {
					const symbol = checker.getSymbolAtLocation(node);
					if (symbol?.flags && symbol.flags & ts.SymbolFlags.Alias) replacements.push({ start: node.getStart(sourceFile), end: node.end, text: alias.targetName });
				}
			}
			ts.forEachChild(node, visitNode);
		};
		visitNode(sourceFile);
		for (const statement of sourceFile.statements) {
			if (ts.isImportDeclaration(statement) || (ts.isExportDeclaration(statement) && statement.moduleSpecifier?.text.startsWith('.'))) {
				replacements.push({ start: statement.getFullStart(), end: statement.end, text: '' });
			}
		}
		return replacements
			.sort((left, right) => right.start - left.start)
			.reduce((content, replacement) => content.slice(0, replacement.start) + replacement.text + content.slice(replacement.end), source)
			.trim();
	});

	const renderedImports = [...imports]
		.sort(([left], [right]) => left.localeCompare(right))
		.flatMap(([moduleName, entry]) => {
			const parts: string[] = [];
			if (entry.defaultName) parts.push(entry.defaultName);
			const named = [...entry.named]
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([local, value]) => `${value.typeOnly ? 'type ' : ''}${value.imported === local ? local : `${value.imported} as ${local}`}`);
			if (named.length > 0) parts.push(`{ ${named.join(', ')} }`);
			const rendered = parts.length === 0 ? [] : [`import ${parts.join(', ')} from '${moduleName}';`];
			if (entry.namespaceName) rendered.push(`import * as ${entry.namespaceName} from '${moduleName}';`);
			if (rendered.length === 0) rendered.push(`import '${moduleName}';`);
			return rendered;
		});
	const renderedLocalExports = [...localExports]
		.filter(([exportedName, localName]) => exportedName !== localName || !directExports.has(exportedName))
		.map(([exportedName, localName]) => (exportedName === localName ? localName : `${localName} as ${exportedName}`))
		.sort();
	const renderedExports = renderedLocalExports.length > 0 ? `export { ${renderedLocalExports.join(', ')} };` : '';
	return (
		[...renderedImports, '', ...bodies, renderedExports]
			.filter((part, index, values) => part || (index > 0 && values[index - 1]))
			.join('\n\n')
			.trimEnd() + '\n'
	);
}

/**
 * 依据组件文件对 @tile-ui/core 的具名 import，按符号闭包构建 core 虚拟文件内容。
 */
function buildCoreSource(workspaceRoot: string, componentFiles: string[]) {
	const ts = loadTypeScript(workspaceRoot);
	const symbols = new Set(componentFiles.flatMap((filePath) => getNamedImports(ts, filePath, '@tile-ui/core')));
	return readCoreSourceClosure(
		workspaceRoot,
		[...symbols].sort().map((symbol) => resolveCoreExport(ts, workspaceRoot, symbol)),
	);
}

export function createSolidRegistryConfig(input: { workspaceRoot: string; outDir: string }): Omit<RegistryBuildOptions, 'manifest'> {
	return {
		framework: 'solid',
		workspaceRoot: input.workspaceRoot,
		outDir: input.outDir,
		transforms: {
			file: transformSolidFile,
			buildVirtualFiles: async ({ workspaceRoot, manifest }): Promise<VirtualRegistryFile[]> => {
				const utils = buildSolidUtilsSource(workspaceRoot, [
					path.resolve(workspaceRoot, 'packages/core/src/utils/cn.ts'),
					path.resolve(workspaceRoot, 'packages/core/src/utils/helpers.ts'),
					path.resolve(workspaceRoot, 'packages/solid/src/utils/index.ts'),
				]);
				const componentFiles = manifest.items
					.filter((item) => item.type === 'registry:ui')
					.flatMap((item) => item.files.filter((file) => file.transform === 'solid-component').map((file) => path.resolve(workspaceRoot, file.source)));
				const core = buildCoreSource(workspaceRoot, componentFiles);

				return [
					{
						source: '__virtual__/shared/core.ts',
						content: core,
					},
					{
						source: '__virtual__/shared/utils.ts',
						content: utils,
					},
				];
			},
		},
		validate: {
			forbidWorkspaceImports: ['@tile-ui/'],
		},
	};
}
