import { defineComponent } from 'vue';

import { VueDocsBreadcrumb } from '../../components/docs-breadcrumb';
import { VueDocsSidebar } from '../../components/docs-sidebar';
import { VueDocsToc } from '../../components/docs-toc';
import { getDocPayload } from '../../lib/docs-data';

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
	name: 'VueDocsIndexPage',
	setup() {
		const payload = getDocPayload([]);

		if (!payload) {
			throw createError({ statusCode: 404, statusMessage: 'Doc not found' });
		}

		const { doc, neighbours, tree } = payload;

		const canonical = `${SITE_URL}/docs/`;
		const breadcrumbs: Array<{ label: string; href?: string }> = [{ label: 'Docs' }];

		useHead({
			title: doc.title,
			meta: [
				{ name: 'description', content: doc.description },
				{ property: 'og:title', content: `${doc.title} | Tile UI Vue` },
				{ property: 'og:description', content: doc.description },
				{ property: 'og:url', content: canonical },
				{ property: 'og:image', content: OG_IMAGE },
				{ name: 'twitter:title', content: `${doc.title} | Tile UI Vue` },
				{ name: 'twitter:description', content: doc.description },
				{ name: 'twitter:image', content: OG_IMAGE },
			],
			link: [{ rel: 'canonical', href: canonical }],
			script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbs)) }],
		});

		return () => (
			<div class="docs-layout">
				<VueDocsSidebar tree={tree} pathname={doc.url} />
				<main class="docs-layout__content">
					<div class="docs-page">
						<div class="docs-page__main">
							<div class="docs-page__content">
								<div class="docs-page__header">
									<VueDocsBreadcrumb items={breadcrumbs} />
									<p class="docs-page__section-label">Overview</p>
									<h1>{doc.title}</h1>
									{doc.description ? <p class="docs-page__description">{doc.description}</p> : null}
								</div>
								<div class="docs-page__toc-mobile">{doc.toc.length ? <VueDocsToc toc={doc.toc} variant="dropdown" /> : null}</div>
								<div class="docs-page__body prose-page" innerHTML={doc.html} />
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
	},
});
