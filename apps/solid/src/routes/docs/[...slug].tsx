import { useParams } from '@solidjs/router';
import { For, Show, createMemo } from 'solid-js';

import { ComponentDemo } from '../../components/component-demo';
import { NotFoundPage } from '../../components/not-found-page';
import { PrimitiveDemo } from '../../components/primitive-demo';
import { Seo, breadcrumbJsonLd } from '../../components/seo';
import { solidDocs } from '../../generated/docs';

const componentNames = new Set(
	solidDocs.filter((entry) => entry.slug.startsWith('components/') && entry.slug !== 'components').map((entry) => entry.slug.slice('components/'.length)),
);
const introLinks = [
	{ title: 'Introduction', href: '/docs' },
	{ title: 'Installation', href: '/docs/installation' },
	{ title: 'Theming', href: '/docs/theming' },
	{ title: 'Primitives', href: '/docs/primitives' },
	{ title: 'Registry', href: '/docs/registry' },
	{ title: 'Examples', href: '/docs/examples' },
];
const sidebarScrollStorageKey = 'tile-ui-solid-docs-sidebar-scroll';
let sidebarScrollTop: number | undefined;

function PagerIcon(props: { direction: 'previous' | 'next' }) {
	return (
		<svg class="solid-doc__pager-icon" viewBox="0 0 16 16" aria-hidden="true">
			<path d={props.direction === 'previous' ? 'm10.5 3-5 5 5 5' : 'm5.5 3 5 5-5 5'} />
		</svg>
	);
}

function readSidebarScrollTop() {
	if (sidebarScrollTop !== undefined) return sidebarScrollTop;
	const stored = Number.parseFloat(sessionStorage.getItem(sidebarScrollStorageKey) ?? '0');
	sidebarScrollTop = Number.isFinite(stored) ? stored : 0;
	return sidebarScrollTop;
}

function restoreSidebarScrollPosition(element: HTMLElement) {
	queueMicrotask(() => {
		element.scrollTop = readSidebarScrollTop();
	});
}

function rememberSidebarScrollPosition(event: Event) {
	sidebarScrollTop = event.currentTarget instanceof HTMLElement ? event.currentTarget.scrollTop : 0;
	sessionStorage.setItem(sidebarScrollStorageKey, String(sidebarScrollTop));
}

export default function DocsPage() {
	const params = useParams();
	const slug = createMemo(() => params.slug ?? '');
	const doc = createMemo(() => solidDocs.find((entry) => entry.slug === slug()));
	const currentIndex = createMemo(() => solidDocs.findIndex((entry) => entry.slug === slug()));
	const componentSlug = createMemo(() => (slug().startsWith('components/') ? slug().slice('components/'.length) : ''));

	return (
		<Show when={doc()} fallback={<NotFoundPage docs />} keyed>
			{(entry) => (
				<div class="solid-docs-layout">
					<Seo title={entry.title} description={entry.description} path={entry.url} type="article" jsonLd={breadcrumbJsonLd(entry.url, entry.title)} />
					<aside class="solid-sidebar" ref={restoreSidebarScrollPosition} onScroll={rememberSidebarScrollPosition}>
						<div>
							<p>Get started</p>
							<nav aria-label="Documentation sections">
								<For each={introLinks}>
									{(item) => (
										<a href={item.href} data-active={entry.url === item.href}>
											{item.title}
										</a>
									)}
								</For>
							</nav>
						</div>
						<div>
							<p>Components</p>
							<nav aria-label="Solid component documentation">
								<For each={[...componentNames].sort()}>
									{(name) => (
										<a href={`/docs/components/${name}`} data-active={componentSlug() === name}>
											{name[0].toUpperCase() + name.slice(1)}
										</a>
									)}
								</For>
							</nav>
						</div>
					</aside>
					<article class="solid-doc">
						<header class="solid-doc__header">
							<div class="solid-doc__eyebrow">
								<p>Tile UI · SolidJS</p>
								<Show when={componentNames.has(componentSlug()) || slug() === 'primitives'}>
									<span>CSR · SSR · SSG</span>
								</Show>
							</div>
							<h1>{entry.title}</h1>
							<span>{entry.description}</span>
						</header>
						<Show when={componentNames.has(componentSlug())}>
							<ComponentDemo slug={componentSlug()} />
						</Show>
						<Show when={slug() === 'primitives'}>
							<PrimitiveDemo slug="primitives" />
						</Show>
						<div class="prose-page solid-prose" innerHTML={entry.html} />
						<footer class="solid-doc__pager">
							<Show when={solidDocs[currentIndex() - 1]}>
								{(previous) => (
									<a href={previous().url}>
										<PagerIcon direction="previous" />
										{previous().title}
									</a>
								)}
							</Show>
							<Show when={solidDocs[currentIndex() + 1]}>
								{(next) => (
									<a href={next().url}>
										{next().title}
										<PagerIcon direction="next" />
									</a>
								)}
							</Show>
						</footer>
					</article>
					<aside class="solid-toc">
						<p>On this page</p>
						<nav aria-label="On this page">
							<For each={entry.toc}>
								{(item) => (
									<a href={item.href} data-depth={item.depth}>
										{item.title}
									</a>
								)}
							</For>
						</nav>
					</aside>
				</div>
			)}
		</Show>
	);
}
