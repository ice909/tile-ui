import { computed, defineComponent, provide } from 'vue';

import { VueDocsBreadcrumb } from '../../components/docs-breadcrumb';
import { DocPreview } from '../../components/doc-preview';
import { VueDocsSidebar } from '../../components/docs-sidebar';
import { VueDocsToc } from '../../components/docs-toc';
import { vueDemoRegistry } from '../../components/demos';
import { getDocPayload } from '../../lib/docs-data';
import type { DocsTreeNode } from '../../lib/docs';

const SITE_URL = 'https://vue.tileui.zmorg.cn';
const OG_IMAGE = `${SITE_URL}/og.png`;

function buildBreadcrumbJsonLd(breadcrumbs: Array<{ label: string; href?: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: breadcrumbs.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: crumb.label,
			...(crumb.href ? { item: `${SITE_URL}${crumb.href}` } : {}),
		})),
	};
}

function formatLabel(value: string) {
	return value
		.split('-')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function getPreviewForSlug(slug: string[]) {
	const key = slug.join('/');
	const name = key.replace(/^(components|composables|examples)\//, '');
	const demo = vueDemoRegistry[name];
	if (!demo) {
		return null;
	}

	// 预览外壳（标题/描述 + 可展开的实现代码）由页面统一包裹，demo 文件只负责实际渲染内容。
	return defineComponent({
		name: 'VueDemoPreview',
		setup() {
			return () => (
				<DocPreview title={demo.title} description={demo.description}>
					<demo.Component />
				</DocPreview>
			);
		},
	});
}

function findTreePath(nodes: DocsTreeNode[], targetUrl: string, trail: Array<{ name: string; url?: string }> = []): Array<{ name: string; url?: string }> | null {
	for (const node of nodes) {
		const nextTrail = node.name ? [...trail, { name: node.name, url: node.url }] : trail;

		if (node.url === targetUrl) {
			return nextTrail;
		}

		if (node.children?.length) {
			const match = findTreePath(node.children, targetUrl, nextTrail);
			if (match) return match;
		}
	}

	return null;
}

function buildPageContext(tree: DocsTreeNode, currentUrl: string) {
	const rawPath = findTreePath(tree.children ?? [], currentUrl) ?? [];
	const path = rawPath.filter((item: { name: string; url?: string }, index: number) => item.name !== rawPath[index - 1]?.name);
	const breadcrumbs = [{ label: 'Docs', href: currentUrl === '/docs' ? undefined : '/docs' }];

	for (const [index, item] of path.entries()) {
		const isLast = index === path.length - 1;
		breadcrumbs.push({ label: item.name, href: !isLast ? item.url : undefined });
	}

	return {
		breadcrumbs,
		sectionLabel: path.length > 1 ? formatLabel(path[path.length - 2]?.name ?? '') : 'Overview',
	};
}

function PagerIcon({ direction }: { direction: 'previous' | 'next' }) {
	return direction === 'previous' ? (
		<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="docs-page__pager-icon">
			<path d="M9.5 3.5L5 8l4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	) : (
		<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="docs-page__pager-icon">
			<path d="M6.5 3.5L11 8l-4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}

export default defineComponent({
	name: 'VueDocsCatchAllPage',
	setup() {
		const route = useRoute();
		const getSlug = () => {
			const slugParam = route.params.slug;
			const parts = Array.isArray(slugParam) ? slugParam : slugParam ? [String(slugParam)] : [];
			return parts.map((part) => String(part).trim()).filter(Boolean);
		};
		const payload = computed(() => getDocPayload(getSlug()));

		// 供 DocPreview 等组件注入：预览块下方可展开的实现代码。
		provide(
			'preview-code',
			computed(() => payload.value?.doc.previewCode ?? null),
		);

		const pageContext = computed(() => {
			const current = payload.value;
			if (!current) {
				return null;
			}
			return buildPageContext(current.tree, current.doc.url);
		});

		// 每个文档页的 SEO head：title/description、canonical、Open Graph、BreadcrumbList JSON-LD。
		useHead(() => {
			const current = payload.value;
			const context = pageContext.value;
			if (!current || !context) {
				return {};
			}

			const canonical = `${SITE_URL}${current.doc.url}`;
			const title = current.doc.title;
			const description = current.doc.description;

			return {
				title,
				meta: [
					{ name: 'description', content: description },
					{ property: 'og:title', content: `${title} | Tile UI Vue` },
					{ property: 'og:description', content: description },
					{ property: 'og:url', content: canonical },
					{ property: 'og:image', content: OG_IMAGE },
					{ name: 'twitter:title', content: `${title} | Tile UI Vue` },
					{ name: 'twitter:description', content: description },
					{ name: 'twitter:image', content: OG_IMAGE },
				],
				link: [{ rel: 'canonical', href: canonical }],
				script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(buildBreadcrumbJsonLd(context.breadcrumbs)) }],
			};
		});

		if (!payload.value) {
			throw createError({ statusCode: 404, statusMessage: 'Doc not found' });
		}

		return () => {
			if (!payload.value) {
				return null;
			}

			const slug = getSlug();
			const { doc, neighbours, tree } = payload.value;
			const Preview = getPreviewForSlug(slug);
			const context = pageContext.value;
			if (!context) {
				return null;
			}

			// 组件描述引用（正文开头的 blockquote）拆分出来，渲染在预览块之上，与 React 文档站排版一致。
			const introMatch = doc.html.match(/^\s*<blockquote>[\s\S]*?<\/blockquote>/);
			const introHtml = introMatch ? introMatch[0] : '';
			const bodyHtml = introHtml ? doc.html.slice(introHtml.length) : doc.html;

			return (
				<div class="docs-layout">
					<VueDocsSidebar tree={tree} pathname={doc.url} />
					<main class="docs-layout__content">
						<div class="docs-page">
							<div class="docs-page__main">
								<div class="docs-page__content">
									<div class="docs-page__header">
										<VueDocsBreadcrumb items={context.breadcrumbs} />
										<p class="docs-page__section-label">{context.sectionLabel}</p>
										<h1>{doc.title}</h1>
										{doc.description ? <p class="docs-page__description">{doc.description}</p> : null}
									</div>
									<div class="docs-page__toc-mobile">{doc.toc.length ? <VueDocsToc toc={doc.toc} variant="dropdown" /> : null}</div>
									<div class="docs-page__body prose-page">
										{introHtml ? <div class="docs-page__intro" innerHTML={introHtml} /> : null}
										{Preview ? <Preview /> : null}
										<div innerHTML={bodyHtml} />
									</div>
									<div class="docs-page__footer">
										{neighbours.previous ? (
											<NuxtLink to={neighbours.previous.url} class="docs-page__pager-link" data-direction="previous">
												<PagerIcon direction="previous" />
												<span class="docs-page__pager-label">Previous</span>
												<strong>{neighbours.previous.title}</strong>
											</NuxtLink>
										) : (
											<div class="docs-page__pager-spacer" />
										)}
										{neighbours.next ? (
											<NuxtLink to={neighbours.next.url} class="docs-page__pager-link" data-direction="next">
												<span class="docs-page__pager-label">Next</span>
												<strong>{neighbours.next.title}</strong>
												<PagerIcon direction="next" />
											</NuxtLink>
										) : (
											<div class="docs-page__pager-spacer" />
										)}
									</div>
								</div>
							</div>
							<aside class="docs-page__toc">{doc.toc.length ? <VueDocsToc toc={doc.toc} variant="list" /> : null}</aside>
						</div>
					</main>
				</div>
			);
		};
	},
});
