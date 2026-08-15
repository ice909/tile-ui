import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import rehypePrettyCode from 'rehype-pretty-code';

const html = '<pre><code class="language-tsx">const a = 1</code></pre>';
const file = await unified()
	.use(rehypeParse, { fragment: true })
	.use(rehypePrettyCode, {
		keepBackground: false,
		theme: { dark: 'github-dark', light: 'github-light-default' },
		transformers: [
			{
				code(node) {
					node.properties.__raw__ = this.source;
				},
			},
		],
	})
	.use(rehypeStringify)
	.process(html);
console.log(String(file));
