import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DocsPageShell } from '@/components/docs-page-shell';
import { DocsTableOfContents } from '@/components/docs-toc';
import { mdxComponents } from '@/mdx-components';
import { getNeighbours } from '../../../lib/docs-neighbours';
import { withTrailingSlash } from '../../../lib/trailing-slash';
import { source } from '../../../lib/source';

const SITE_URL = 'https://react.tileui.zmorg.cn';
const OG_IMAGE = {
	url: `${SITE_URL}/og.png`,
	width: 1200,
	height: 630,
	alt: 'Tile UI React',
};

export const dynamic = 'force-static';
export const dynamicParams = false;
export const revalidate = false;

type Breadcrumb = { label: string; href?: string };

type TocItem = {
	title?: string;
	url: string;
	depth: number;
};

type PageTreeNode = {
	name?: unknown;
	url?: string;
	children?: PageTreeNode[];
};

function getNodeName(name: unknown) {
	return typeof name === 'string' ? name : '';
}

function findTreePath(nodes: PageTreeNode[], targetUrl: string, trail: Array<{ name: string; url?: string }> = []): Array<{ name: string; url?: string }> | null {
	for (const node of nodes) {
		const name = getNodeName(node.name);
		const nextTrail = name ? [...trail, { name, url: node.url }] : trail;

		if (node.url === targetUrl) {
			return nextTrail;
		}

		if (node.children?.length) {
			const match = findTreePath(node.children, targetUrl, nextTrail);
			if (match) {
				return match;
			}
		}
	}

	return null;
}

function buildPageContext(tree: PageTreeNode, currentUrl: string) {
	const rawPath = findTreePath(tree.children ?? [], currentUrl) ?? [];
	const path = rawPath.filter((item: { name: string; url?: string }, index: number) => item.name !== rawPath[index - 1]?.name);
	const breadcrumbs: Breadcrumb[] = [{ label: 'Docs', href: currentUrl === '/docs' ? undefined : '/docs/' }];

	for (const [index, item] of path.entries()) {
		const isLast = index === path.length - 1;
		breadcrumbs.push({
			label: item.name,
			href: !isLast && item.url ? withTrailingSlash(item.url) : undefined,
		});
	}

	const sectionLabel = path.length > 1 ? path[path.length - 2]?.name : 'Overview';

	return {
		breadcrumbs,
		sectionLabel,
	};
}

function normalizeToc(toc: Array<{ title?: unknown; url: string; depth: number }> = []): TocItem[] {
	return toc.map((item) => ({
		title: typeof item.title === 'string' ? item.title : decodeURIComponent(item.url.replace(/^#/, '').replace(/-/g, ' ')),
		url: item.url,
		depth: item.depth,
	}));
}

export function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
	const params = await props.params;
	const page = source.getPage(params.slug);

	if (!page) {
		notFound();
	}

	const url = withTrailingSlash(`${SITE_URL}${page.url}`);
	const title = page.data.title;
	const description = page.data.description;

	return {
		title,
		description,
		alternates: {
			canonical: url,
		},
		openGraph: {
			type: 'article',
			url,
			siteName: 'Tile UI React',
			title: `${title} | Tile UI React`,
			description,
			locale: 'en_US',
			images: [OG_IMAGE],
		},
		twitter: {
			card: 'summary_large_image',
			title: `${title} | Tile UI React`,
			description,
			images: [OG_IMAGE.url],
		},
	};
}

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
	const params = await props.params;
	const page = source.getPage(params.slug);

	if (!page) {
		notFound();
	}

	const neighbours = getNeighbours(source.pageTree, page.url);
	const MDX = page.data.body;
	const pageContext = buildPageContext(source.pageTree as PageTreeNode, page.url);

	const breadcrumbJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: pageContext.breadcrumbs.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: crumb.label,
			...(crumb.href ? { item: `${SITE_URL}${crumb.href}` } : {}),
		})),
	};

	return (
		<DocsPageShell
			title={page.data.title}
			description={page.data.description}
			toc={normalizeToc(page.data.toc ?? [])}
			previous={neighbours.previous}
			next={neighbours.next}
			Toc={DocsTableOfContents}
			breadcrumbs={pageContext.breadcrumbs}
			sectionLabel={pageContext.sectionLabel}>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
			<MDX components={mdxComponents} />
		</DocsPageShell>
	);
}
