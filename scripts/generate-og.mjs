// ==========================================
// 生成两个文档站的 Open Graph 分享图（1200x630 PNG）。
// 纯 Node 实现（仅依赖内置 zlib），无第三方依赖。
// 输出：apps/react/public/og.png、apps/vue/public/og.png
// ==========================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const WIDTH = 1200;
const HEIGHT = 630;

// ---------- PNG 编码 ----------

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n += 1) {
		let c = n;
		for (let k = 0; k < 8; k += 1) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c >>> 0;
	}
	return table;
})();

function crc32(buffer) {
	let crc = 0xffffffff;
	for (const byte of buffer) {
		crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length, 0);
	const typeBuf = Buffer.from(type, 'ascii');
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
	return Buffer.concat([length, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
	const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // 位深
	ihdr[9] = 6; // RGBA
	const stride = 1 + width * 4;
	const raw = Buffer.alloc(height * stride);
	for (let y = 0; y < height; y += 1) {
		raw[y * stride] = 0; // filter: none
		rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
	}
	return Buffer.concat([signature, pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })), pngChunk('IEND', Buffer.alloc(0))]);
}

// ---------- 绘制 ----------

function createCanvas() {
	return Buffer.alloc(WIDTH * HEIGHT * 4);
}

function blendPixel(buffer, x, y, color) {
	if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
		return;
	}
	const offset = (y * WIDTH + x) * 4;
	const [r, g, b, a] = color;
	const alpha = a / 255;
	const inv = 1 - alpha;
	buffer[offset] = Math.round(r * alpha + buffer[offset] * inv);
	buffer[offset + 1] = Math.round(g * alpha + buffer[offset + 1] * inv);
	buffer[offset + 2] = Math.round(b * alpha + buffer[offset + 2] * inv);
	buffer[offset + 3] = 255;
}

// 带圆角的矩形填充（按像素计算圆角区域）。
function fillRoundedRect(buffer, x, y, width, height, radius, color) {
	const minX = x;
	const minY = y;
	const maxX = x + width;
	const maxY = y + height;
	const r = Math.min(radius, width / 2, height / 2);

	for (let py = Math.floor(minY); py < maxY; py += 1) {
		for (let px = Math.floor(minX); px < maxX; px += 1) {
			let cx = Math.max(px + 0.5 - minX, 0);
			let cy = Math.max(py + 0.5 - minY, 0);
			cx = Math.min(cx, width - cx);
			cy = Math.min(cy, height - cy);
			if (cx <= r && cy <= r && Math.hypot(r - cx, r - cy) > r) {
				continue;
			}
			blendPixel(buffer, px, py, color);
		}
	}
}

function drawDesign(buffer) {
	const bg = [250, 250, 250, 255];
	fillRoundedRect(buffer, 0, 0, WIDTH, HEIGHT, 0, bg);

	const ink = [24, 24, 27, 255]; // $primary #18181b
	const muted = [113, 113, 122, 255]; // $muted-foreground #71717a
	const soft = [161, 161, 170, 255]; // #a1a1aa
	const faint = [228, 228, 231, 255]; // $border #e4e4e7

	// 左侧文字占位条：标题 + 副标题 + 底部小条
	fillRoundedRect(buffer, 96, 132, 520, 58, 14, ink);
	fillRoundedRect(buffer, 96, 222, 340, 24, 8, soft);
	fillRoundedRect(buffer, 96, 274, 460, 24, 8, faint);
	fillRoundedRect(buffer, 96, 466, 200, 16, 6, faint);

	// 右侧 2x2 瓦片网格（呼应 Tile UI 的 tile 命名）
	const tileSize = 200;
	const gap = 24;
	const startX = 676;
	const startY = 191;
	const tiles = [
		[ink, 0],
		[muted, 1],
		[soft, 0],
		[faint, 1],
	];
	for (const [index, tile] of tiles.entries()) {
		const row = Math.floor(index / 2);
		const col = index % 2;
		fillRoundedRect(buffer, startX + col * (tileSize + gap), startY + row * (tileSize + gap), tileSize, tileSize, 28, tile[0]);
		if (tile[1] === 0) {
			// 左上 / 右下瓦片内部加一个小方点，形成轻微层次
			fillRoundedRect(buffer, startX + col * (tileSize + gap) + 74, startY + row * (tileSize + gap) + 74, 52, 52, 12, [250, 250, 250, 255]);
		}
	}
}

function generateOgImage() {
	const buffer = createCanvas();
	drawDesign(buffer);
	return encodePng(WIDTH, HEIGHT, buffer);
}

const png = generateOgImage();
for (const app of ['apps/react', 'apps/vue']) {
	const outputPath = path.join(repoRoot, app, 'public', 'og.png');
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, png);
	console.log(`Generated ${path.relative(repoRoot, outputPath)} (${png.length} bytes)`);
}
