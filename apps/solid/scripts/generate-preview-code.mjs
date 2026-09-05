import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { codeToHtml } from 'shiki';

import { getPreviewSlugs, getDemoSource } from '../../../scripts/demo-files.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(dirname, '..');
const workspaceRoot = path.resolve(appRoot, '../..');
const outputFile = path.join(appRoot, 'src/generated/preview-code.ts');

const entries = {};
for (const slug of getPreviewSlugs('solid')) {
	const raw = getDemoSource('solid', slug);
	if (!raw) continue;
	entries[slug] = {
		raw,
		preview: await codeToHtml(raw.split('\n').slice(0, 6).join('\n'), { lang: 'tsx', themes: { light: 'github-light-default', dark: 'github-dark' }, defaultColor: false }),
		full: await codeToHtml(raw, { lang: 'tsx', themes: { light: 'github-light-default', dark: 'github-dark' }, defaultColor: false }),
	};
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(
	outputFile,
	`// 本文件由 scripts/generate-preview-code.mjs 自动生成，请勿手动修改。\nexport type PreviewCode = { raw: string; preview: string; full: string };\nexport const previewCodeMap: Record<string, PreviewCode> = ${JSON.stringify(entries, null, '\t')};\n`,
);
const formatter = path.join(workspaceRoot, 'node_modules/.bin/oxfmt');
if (fs.existsSync(formatter)) spawnSync(formatter, [outputFile], { stdio: 'inherit' });
console.log(`Generated ${path.relative(appRoot, outputFile)} with ${Object.keys(entries).length} previews`);
