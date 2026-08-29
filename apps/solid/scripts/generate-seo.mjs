import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(dirname, '..');
const publicDir = path.join(appRoot, 'public');
const docsFile = path.join(appRoot, 'src/generated/docs.ts');
const origin = 'https://solid.tileui.zmorg.cn';

const generated = fs.readFileSync(docsFile, 'utf8');
const routes = ['/', ...[...generated.matchAll(/\burl: '([^']+)'/g)].map((match) => match[1])];
const urls = [...new Set(routes)].sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((route) => `  <url>\n    <loc>${origin}${route}</loc>\n  </url>`).join('\n')}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#fff4d6"/><path d="M5 8.5 14.5 4 27 9.5l-9.5 4.4L5 8.5Z" fill="#d97706" opacity=".72"/><path d="m5 13 12.5 5.4L27 14v6l-9.5 4.5L5 19v-6Z" fill="#d97706"/></svg>\n`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), favicon);
console.log(`Generated Solid SEO assets with ${urls.length} URLs`);
