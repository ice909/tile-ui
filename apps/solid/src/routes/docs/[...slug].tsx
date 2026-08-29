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
					<aside class="solid-sidebar">
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
							<p>{componentNames.size} components</p>
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
							<p>Tile UI · SolidJS</p>
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
							<Show when={solidDocs[currentIndex() - 1]}>{(previous) => <a href={previous().url}>← {previous().title}</a>}</Show>
							<Show when={solidDocs[currentIndex() + 1]}>{(next) => <a href={next().url}>{next().title} →</a>}</Show>
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
