#!/usr/bin/env node
/**
 * 生成 React 文档组件预览块下方可展开的实现代码（构建时 shiki 高亮）。
 *
 * 代码字符串从根目录 scripts/generate-component-docs.mjs 的 META 派生，
 * 输出到 apps/react/lib/preview-code.ts（已提交的生成产物，改动 META 后需重跑）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { codeToHtml } from 'shiki';

import { getPreviewCode, META } from '../../../scripts/generate-component-docs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const root = path.resolve(appRoot, '..', '..');
const outFile = path.join(appRoot, 'lib', 'preview-code.ts');

const PEEK_LINES = 3;

const transformers = [
	{
		pre(node) {
			node.properties.class = 'mdx-pre';
			if (typeof node.properties.style === 'string') {
				node.properties.style = node.properties.style.replace(/background-color:[^;]+(;?)/g, '');
			}
		},
		code(node) {
			node.properties['data-line-numbers'] = '';
		},
		line(node) {
			node.properties['data-line'] = '';
		},
	},
];

async function highlight(code) {
	return codeToHtml(code, {
		lang: 'tsx',
		themes: {
			dark: 'github-dark',
			light: 'github-light-default',
		},
		defaultColor: false,
		transformers,
	});
}

function buildEntry(code) {
	const lines = code.split('\n');
	const peekSource = lines.slice(0, PEEK_LINES).join('\n');

	return {
		preview: highlight(peekSource),
		full: highlight(code),
		raw: code,
	};
}

// 生成符合 oxfmt 风格（单引号）的 TS 字符串字面量。
function jsString(value) {
	return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}'`;
}

async function main() {
	const entries = {};

	for (const meta of META) {
		const code = getPreviewCode(meta.name, 'react');
		if (!code) {
			continue;
		}
		const { preview, full, raw } = buildEntry(code);
		entries[meta.name] = {
			preview: await preview,
			full: await full,
			raw,
		};
	}

	const body = Object.entries(entries)
		.map(([name, { preview, full, raw }]) => {
			return `\t${jsString(name)}: {\n\t\tpreview: ${jsString(preview)},\n\t\tfull: ${jsString(full)},\n\t\traw: ${jsString(raw)},\n\t},`;
		})
		.join('\n');

	const output = `// 本文件由 scripts/generate-preview-code.mjs 自动生成，请勿手动修改。\nexport type PreviewCode = { preview: string; full: string; raw: string };\n\nexport const previewCodeMap: Record<string, PreviewCode> = {\n${body}\n};\n`;

	fs.mkdirSync(path.dirname(outFile), { recursive: true });
	fs.writeFileSync(outFile, output, 'utf-8');

	// 生成产物通过 oxfmt 格式化，保证与仓库格式约束一致。
	const oxfmtBin = path.join(root, 'node_modules', '.bin', 'oxfmt');
	if (fs.existsSync(oxfmtBin)) {
		spawnSync(oxfmtBin, [outFile], { stdio: 'inherit' });
	}

	console.log(`Generated ${path.relative(appRoot, outFile)} with ${Object.keys(entries).length} previews`);
}

main();
