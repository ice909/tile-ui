import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const packageRoot = path.resolve(import.meta.dirname);
const checkedIn = path.join(packageRoot, 'css');
const generated = fs.mkdtempSync(path.join(os.tmpdir(), 'tile-styles-'));

function snapshot(directory, base = '') {
	const files = new Map();
	for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
		const relative = base ? path.join(base, entry.name) : entry.name;
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			for (const [name, content] of snapshot(absolute, relative)) files.set(name, content);
		} else {
			files.set(relative, fs.readFileSync(absolute));
		}
	}
	return files;
}

try {
	execFileSync(process.execPath, ['build.js'], {
		cwd: packageRoot,
		env: { ...process.env, TILE_STYLES_OUT_DIR: generated },
		stdio: 'inherit',
	});
	const expected = snapshot(checkedIn);
	const actual = snapshot(generated);
	assert.deepEqual([...actual.keys()], [...expected.keys()], 'Generated CSS file set differs from checked-in output.');
	for (const [name, content] of expected) assert.deepEqual(actual.get(name), content, `Generated CSS is stale: ${name}`);
	assert.match(fs.readFileSync(path.join(checkedIn, 'components/avatar.css'), 'utf8'), /\.fallback\[hidden\]\{display:none\}/);
	console.log('Checked-in CSS matches SCSS compilation.');
} finally {
	fs.rmSync(generated, { recursive: true, force: true });
}
