/**
 * 为静态导出站点（`output: 'export'` + `trailingSlash: true`）的链接补充尾部斜杠，
 * 保证在静态服务器上直接打开/刷新时能命中 `<route>/index.html`。
 */
export function withTrailingSlash(url: string): string {
	return url.endsWith('/') ? url : `${url}/`;
}
