import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import rehypePrettyCode from 'rehype-pretty-code';
import type { ShikiTransformer } from 'shiki';

import remarkTrailingSlash from './lib/remark-trailing-slash';

const transformers: ShikiTransformer[] = [
	{
		code(node) {
			if (node.tagName === 'code') {
				// 注入原始源码，供复制按钮使用。
				node.properties.__raw__ = this.source;
			}
		},
	},
];

export default defineConfig({
	mdxOptions: {
		remarkPlugins: (plugins) => [remarkTrailingSlash, ...plugins],
		rehypePlugins: (plugins) => {
			plugins.shift();
			plugins.push([
				rehypePrettyCode,
				{
					keepBackground: false,
					theme: {
						dark: 'github-dark',
						light: 'github-light-default',
					},
					transformers,
				},
			]);

			return plugins;
		},
	},
});

export const docs = defineDocs({
	dir: 'content/docs',
});
