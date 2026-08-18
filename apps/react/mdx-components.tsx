import type { ComponentPropsWithoutRef } from 'react';
import type { MDXComponents } from 'mdx/types';

import { getLanguageIcon } from '@/components/code-icons';
import { CopyButton } from '@/components/copy-button';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	Callout,
	Kbd,
	MdxImage,
	MdxLink,
	Step,
	Steps,
	Tab,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components/mdx-blocks';
import { ComponentDemo } from '@/components/component-demo';

export const mdxComponents: MDXComponents = {
	ComponentDemo,
	a: (props: ComponentPropsWithoutRef<'a'>) => <MdxLink {...props} />,
	p: (props: ComponentPropsWithoutRef<'p'>) => <p className="mdx-p" {...props} />,
	strong: (props: ComponentPropsWithoutRef<'strong'>) => <strong className="mdx-strong" {...props} />,
	ul: (props: ComponentPropsWithoutRef<'ul'>) => <ul className="mdx-ul" {...props} />,
	ol: (props: ComponentPropsWithoutRef<'ol'>) => <ol className="mdx-ol" {...props} />,
	li: (props: ComponentPropsWithoutRef<'li'>) => <li className="mdx-li" {...props} />,
	blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => <blockquote className="mdx-blockquote" {...props} />,
	hr: (props: ComponentPropsWithoutRef<'hr'>) => <hr className="mdx-hr" {...props} />,
	img: (props: ComponentPropsWithoutRef<'img'>) => <MdxImage {...props} />,
	Image: (props: ComponentPropsWithoutRef<'img'>) => <MdxImage {...props} />,
	table: (props: ComponentPropsWithoutRef<'table'>) => <table {...props} />,
	tr: (props: ComponentPropsWithoutRef<'tr'>) => <tr className="mdx-tr" {...props} />,
	th: (props: ComponentPropsWithoutRef<'th'>) => <th className="mdx-th" {...props} />,
	td: (props: ComponentPropsWithoutRef<'td'>) => <td className="mdx-td" {...props} />,
	pre: (props: ComponentPropsWithoutRef<'pre'>) => <pre className="mdx-pre" {...props} />,
	code: ({ __raw__, className, ...props }: ComponentPropsWithoutRef<'code'> & { __raw__?: string }) => {
		if (typeof props.children === 'string') {
			return <code className="mdx-inline-code" {...props} />;
		}

		return (
			<>
				{__raw__ ? <CopyButton value={__raw__} /> : null}
				<code className={className} data-line-numbers="" {...props} />
			</>
		);
	},
	figure: (props: ComponentPropsWithoutRef<'figure'>) => <figure className="mdx-figure" {...props} />,
	figcaption: ({ className, children, ...props }: ComponentPropsWithoutRef<'figcaption'>) => {
		const language = 'data-language' in props ? (props['data-language'] as string | undefined) : undefined;

		return (
			<figcaption className={className} {...props}>
				{getLanguageIcon(language)}
				{children}
			</figcaption>
		);
	},
	Button,
	Callout,
	Step,
	Steps,
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
	Tab,
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
	Kbd,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		...mdxComponents,
		...components,
	};
}
