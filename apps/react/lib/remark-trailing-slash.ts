/**
 * 为内部 `/docs/...` 链接统一补充尾部斜杠。
 * 站点使用 `output: 'export'` + `trailingSlash: true` 静态导出，
 * 每个路由导出为 `<route>/index.html`；手写 MDX 链接若缺少尾部斜杠，
 * 在静态服务器上直接打开/刷新会 404，因此在此统一规范化。
 */
export default function remarkTrailingSlash() {
	return (tree: unknown) => {
		visit(tree, (node) => {
			if (node.type === 'link') {
				const match = node.url.match(/^(\/docs\/[^#?]*[^/#?])([#?].*)?$/);
				if (match) {
					node.url = `${match[1]}/${match[2] ?? ''}`;
				}
			}
		});
	};
}

type LinkNode = { type: string; url: string };

function visit(node: unknown, callback: (node: LinkNode) => void): void {
	if (Array.isArray(node)) {
		for (const child of node) {
			visit(child, callback);
		}
		return;
	}

	if (node && typeof node === 'object') {
		const record = node as Record<string, unknown>;
		if (record.type === 'link') {
			callback(node as LinkNode);
		}
		for (const value of Object.values(record)) {
			if (value && typeof value === 'object') {
				visit(value, callback);
			}
		}
	}
}
