#!/usr/bin/env node
/**
 * Demo 预览的统一数据源。
 *
 * 每个框架的每个 demo 一个文件：apps/<framework>/components/demos/<slug>.tsx，
 * 文件本体即真实渲染的源码（与 shadcn-ui 上游模式一致）。
 * 预览块展示的代码 = 直接读取该文件内容，保证展示与渲染永远来自同一处；
 * 文件自身的 import 即实际使用的 import，天然正确。
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(path.join(root, 'apps/react/package.json'));
const ts = require('typescript');

const frameworkConfigs = {
	react: { pkg: '@tile-ui/react', secondaryPkg: '@tile-ui/react/hooks', subDir: 'hooks' },
	vue: { pkg: '@tile-ui/vue', secondaryPkg: '@tile-ui/vue/composables', subDir: 'composables' },
	solid: { pkg: '@tile-ui/solid', secondaryPkg: '@tile-ui/solid/primitives', subDir: 'primitives' },
};

export function getDemoDir(framework) {
	return path.join(root, `apps/${framework}/components/demos`);
}

export function getDemoSlugs(framework) {
	if (!fs.existsSync(getDemoDir(framework))) {
		return [];
	}
	return fs
		.readdirSync(getDemoDir(framework))
		.filter((file) => file.endsWith('.tsx') && file !== 'index.ts')
		.map((file) => file.replace(/\.tsx$/, ''))
		.sort();
}

/**
 * demo 文件完整内容（展示代码 = 渲染代码本体）。
 */
export function getDemoSource(framework, slug) {
	const file = path.join(getDemoDir(framework), `${slug}.tsx`);
	if (!fs.existsSync(file)) {
		return null;
	}
	return fs.readFileSync(file, 'utf-8');
}

function parseSource(file) {
	return ts.createSourceFile(file, fs.readFileSync(file, 'utf-8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function collectIdentifiers(code) {
	const sf = ts.createSourceFile('snippet.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
	const byPosition = new Map();
	const walk = (node) => {
		if (ts.isIdentifier(node)) {
			const pos = node.getStart(sf);
			if (!byPosition.has(node.text) || pos < byPosition.get(node.text)) {
				byPosition.set(node.text, pos);
			}
		}
		ts.forEachChild(node, walk);
	};
	walk(sf);
	return byPosition;
}

// 包导出（主入口 + hooks/composables 子路径），返回 name → 模块 映射。
function loadPackageExports(framework) {
	const config = frameworkConfigs[framework];
	if (!config) {
		throw new Error(`Unknown demo framework: ${framework}`);
	}
	const pkgDir = path.join(root, 'packages', framework, 'src');
	const exportsMap = new Map();
	const collect = (file, moduleName) => {
		const sf = parseSource(file);
		for (const stmt of sf.statements) {
			if (!ts.isExportDeclaration(stmt) || !stmt.exportClause || !ts.isNamedExports(stmt.exportClause)) {
				continue;
			}
			for (const el of stmt.exportClause.elements) {
				if (!el.isTypeOnly) {
					exportsMap.set(el.name.text, moduleName);
				}
			}
		}
	};
	const subIndex = config.subDir ? path.join(pkgDir, config.subDir, 'index.ts') : null;
	if (subIndex && fs.existsSync(subIndex) && config.secondaryPkg) {
		collect(subIndex, config.secondaryPkg);
	}
	// 主入口后收集，同名导出以主入口为准（vue 主入口已导出 composables）。
	collect(path.join(pkgDir, 'index.ts'), config.pkg);
	return exportsMap;
}

const packageExportsCache = new Map();

export function getPackageExports(framework) {
	if (!packageExportsCache.has(framework)) {
		packageExportsCache.set(framework, loadPackageExports(framework));
	}
	return packageExportsCache.get(framework);
}

/**
 * 文档 "Package usage" 段落：根据 usage 代码推导实际用到的包导出 import。
 * 返回 [{ name, module }]，按首次出现顺序。
 */
export function deriveUsageImports(framework, usage) {
	const identifiers = collectIdentifiers(usage);
	const used = [];
	for (const name of identifiers.keys()) {
		const moduleName = getPackageExports(framework).get(name);
		if (moduleName) {
			used.push({ name, module: moduleName });
		}
	}
	return used;
}

/**
 * 输出 import 行（主入口在前，hooks/composables 子路径在后）。
 */
export function renderUsageImports(framework, usage) {
	const config = frameworkConfigs[framework];
	if (!config) {
		throw new Error(`Unknown demo framework: ${framework}`);
	}
	const order = [config.pkg, config.secondaryPkg].filter(Boolean);
	const byModule = new Map();
	for (const { name, module: moduleName } of deriveUsageImports(framework, usage)) {
		if (!byModule.has(moduleName)) {
			byModule.set(moduleName, []);
		}
		byModule.get(moduleName).push(name);
	}
	return [...new Set([...order, ...byModule.keys()])]
		.filter((moduleName) => byModule.has(moduleName))
		.map((moduleName) => `import { ${byModule.get(moduleName).join(', ')} } from '${moduleName}';`);
}
