import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

export type TypeScriptCompiler = any;

/** 从 workspace 中加载 TypeScript 编译器（复用 solid 包的 devDependency）。 */
export function loadTypeScript(workspaceRoot: string): TypeScriptCompiler {
	const requireSolid = createRequire(path.resolve(workspaceRoot, 'packages/solid/package.json'));
	return requireSolid('typescript') as TypeScriptCompiler;
}

export function resolveLocalModule(fromFile: string, moduleName: string): string | undefined {
	const base = path.resolve(path.dirname(fromFile), moduleName);
	for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}
	return undefined;
}

/** 收集文件中对指定包名的具名 import（用于后续按需展开 core 源码）。 */
export function getNamedImports(ts: TypeScriptCompiler, filePath: string, packageName: string): string[] {
	const source = fs.readFileSync(filePath, 'utf-8');
	const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	const symbols = new Set<string>();
	for (const statement of sourceFile.statements) {
		if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier?.text !== packageName) {
			continue;
		}
		for (const element of statement.importClause?.namedBindings?.elements ?? []) {
			symbols.add(element.propertyName?.text ?? element.name.text);
		}
	}
	return [...symbols];
}

/** 将 core 入口导出符号解析到其定义文件。 */
export function resolveCoreExport(ts: TypeScriptCompiler, workspaceRoot: string, symbol: string): string {
	const coreEntry = path.resolve(workspaceRoot, 'packages/core/src/index.ts');
	const seen = new Set<string>();

	const resolveFrom = (filePath: string, exportedName: string): string | undefined => {
		const cacheKey = `${filePath}\0${exportedName}`;
		if (seen.has(cacheKey)) {
			return undefined;
		}
		seen.add(cacheKey);
		const source = fs.readFileSync(filePath, 'utf-8');
		const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

		for (const statement of sourceFile.statements) {
			if (!ts.isExportDeclaration(statement)) {
				continue;
			}
			const moduleName = statement.moduleSpecifier?.text;
			if (!moduleName?.startsWith('.')) {
				continue;
			}
			const dependency = resolveLocalModule(filePath, moduleName);
			if (!dependency) {
				continue;
			}
			const elements = statement.exportClause?.elements;
			if (elements) {
				const exported = elements.find((element: any) => element.name.text === exportedName);
				if (exported) {
					return resolveFrom(dependency, exported.propertyName?.text ?? exported.name.text) ?? dependency;
				}
				continue;
			}
			const resolved = resolveFrom(dependency, exportedName);
			if (resolved) {
				return resolved;
			}
		}

		const escapedName = exportedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const declaration = new RegExp(`\\bexport\\s+(?:declare\\s+)?(?:async\\s+)?(?:type|interface|class|function|const|let|var|enum)\\s+${escapedName}\\b`);
		return declaration.test(source) ? filePath : undefined;
	};

	const resolved = resolveFrom(coreEntry, symbol);
	if (!resolved) {
		throw new Error(`Unable to resolve @tile-ui/core export '${symbol}' for registry virtual core`);
	}
	return resolved;
}

/**
 * 读取 core 源码闭包并合并为单个虚拟 core 文件：
 * - 递归展开相对依赖，按文件去重；
 * - 对跨文件重名的私有声明（函数/类/枚举）通过 TS checker 加组件名后缀重命名；
 * - 移除 import 语句，utils 依赖合并为 `import { ... } from './utils'`。
 */
export function readCoreSourceClosure(workspaceRoot: string, entryFiles: string[]): string {
	const ts = loadTypeScript(workspaceRoot);
	const coreRoot = path.resolve(workspaceRoot, 'packages/core/src');
	const utilsRoot = path.join(coreRoot, 'utils');
	const visited = new Set<string>();
	const helperImports = new Set<string>();
	const localFiles: string[] = [];

	const visit = (filePath: string) => {
		if (visited.has(filePath)) {
			return;
		}
		visited.add(filePath);
		const source = fs.readFileSync(filePath, 'utf-8');
		const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

		for (const statement of sourceFile.statements) {
			if (!ts.isImportDeclaration(statement)) {
				continue;
			}
			const moduleName = statement.moduleSpecifier?.text;
			if (!moduleName?.startsWith('.')) {
				continue;
			}
			const dependency = resolveLocalModule(filePath, moduleName);
			if (!dependency || !dependency.startsWith(coreRoot + path.sep)) {
				throw new Error(`Unable to resolve core virtual dependency '${moduleName}' from ${path.relative(workspaceRoot, filePath)}`);
			}
			if (dependency.startsWith(utilsRoot + path.sep)) {
				for (const element of statement.importClause?.namedBindings?.elements ?? []) {
					const imported = element.propertyName ? `${element.propertyName.text} as ${element.name.text}` : element.name.text;
					helperImports.add(statement.importClause?.isTypeOnly || element.isTypeOnly ? `type ${imported}` : imported);
				}
				continue;
			}
			visit(dependency);
		}

		localFiles.push(filePath);
	};

	for (const entryFile of entryFiles) {
		visit(entryFile);
	}

	const program = ts.createProgram({ rootNames: localFiles, options: { target: ts.ScriptTarget.Latest, moduleResolution: ts.ModuleResolutionKind.Bundler } });
	const checker = program.getTypeChecker();
	const privateDeclarations = new Map<string, Array<{ filePath: string; declaration: any }>>();
	for (const filePath of localFiles) {
		const sourceFile = program.getSourceFile(filePath);
		if (!sourceFile) continue;
		for (const statement of sourceFile.statements) {
			const exported = statement.modifiers?.some((modifier: any) => modifier.kind === ts.SyntaxKind.ExportKeyword);
			if (exported || !(ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) || !statement.name) continue;
			const entries = privateDeclarations.get(statement.name.text) ?? [];
			entries.push({ filePath, declaration: statement });
			privateDeclarations.set(statement.name.text, entries);
		}
	}
	const renamedSymbols = new Map<any, string>();
	for (const [name, entries] of privateDeclarations) {
		if (entries.length < 2) continue;
		for (const { filePath, declaration } of entries) {
			const owner = path.basename(path.dirname(filePath)).replaceAll('-', '_');
			const symbol = checker.getSymbolAtLocation(declaration.name);
			if (symbol) renamedSymbols.set(symbol, `${name}_${owner}`);
		}
	}
	const bodies = localFiles.map((filePath) => {
		const source = fs.readFileSync(filePath, 'utf-8');
		const sourceFile = program.getSourceFile(filePath)!;
		const replacements: Array<{ start: number; end: number; text: string }> = [];
		const visitNode = (node: any) => {
			if (ts.isImportDeclaration(node)) return;
			if (ts.isIdentifier(node)) {
				const symbol = checker.getSymbolAtLocation(node);
				const replacement = symbol ? renamedSymbols.get(symbol) : undefined;
				if (replacement) replacements.push({ start: node.getStart(sourceFile), end: node.end, text: replacement });
			}
			ts.forEachChild(node, visitNode);
		};
		visitNode(sourceFile);
		for (const statement of sourceFile.statements) {
			if (ts.isImportDeclaration(statement)) replacements.push({ start: statement.getFullStart(), end: statement.end, text: '' });
		}
		return replacements
			.sort((left, right) => right.start - left.start)
			.reduce((content, replacement) => content.slice(0, replacement.start) + replacement.text + content.slice(replacement.end), source)
			.trim();
	});

	const imports = helperImports.size > 0 ? `import { ${[...helperImports].sort().join(', ')} } from './utils';\n\n` : '';
	return imports + bodies.join('\n\n') + '\n';
}

/**
 * 依据组件文件对 @tile-ui/core 的具名 import，按符号闭包构建 core 虚拟文件内容。
 */
export function buildCoreClosureSource(workspaceRoot: string, componentFiles: string[]): string {
	const ts = loadTypeScript(workspaceRoot);
	const symbols = new Set(componentFiles.flatMap((filePath) => getNamedImports(ts, filePath, '@tile-ui/core')));
	return readCoreSourceClosure(
		workspaceRoot,
		[...symbols].sort().map((symbol) => resolveCoreExport(ts, workspaceRoot, symbol)),
	);
}
