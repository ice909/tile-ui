// ==========================================
// 生成 Vue 文档站的静态 SEO 文件：
// - public/robots.txt
// - public/sitemap.xml（由 .generated/docs.json 的文档路由派生）
// 在 docs:build 之后执行，随站点一起静态导出。
// ==========================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const docsDataFile = path.join(appRoot, '.generated/docs.json');
const publicDir = path.join(appRoot, 'public');

const SITE_URL = 'https://vue.tileui.zmorg.cn';

if (!fs.existsSync(docsDataFile)) {
	console.warn('Skipping SEO files: .generated/docs.json not found. Run docs:build first.');
	process.exit(0);
}

const docsData = JSON.parse(fs.readFileSync(docsDataFile, 'utf-8'));
const routes = Array.isArray(docsData.routes) ? docsData.routes : [];
const sourceDateEpoch = Number(process.env.SOURCE_DATE_EPOCH);
const generatedAt = Number.isFinite(sourceDateEpoch) ? new Date(sourceDateEpoch * 1000) : new Date();
const lastmod = generatedAt.toISOString().slice(0, 10);

function toAbsoluteUrl(route) {
	if (route === '/') {
		return `${SITE_URL}/`;
	}
	return `${SITE_URL}${route.endsWith('/') ? route : `${route}/`}`;
}

const sitemapUrls = [{ loc: toAbsoluteUrl('/'), lastmod }, ...routes.map((route) => ({ loc: toAbsoluteUrl(route), lastmod }))];

const sitemap =
	'<?xml version="1.0" encoding="UTF-8"?>\n' +
	'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
	sitemapUrls.map((entry) => `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`).join('\n') +
	'\n</urlset>\n';

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf-8');

console.log(`Generated public/robots.txt and public/sitemap.xml with ${sitemapUrls.length} URLs`);
