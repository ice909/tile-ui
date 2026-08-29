import { Badge, Card, CardDescription, CardFooter, CardHeader, CardTitle, Separator } from '@tile-ui/solid';

import { HomeCodeCompare } from '../components/home-code-compare';
import { Seo, websiteJsonLd } from '../components/seo';
import { SITE_DESCRIPTION, SITE_NAME } from '../lib/site';

export default function Home() {
	return (
		<div class="solid-home">
			<Seo title={SITE_NAME} description={SITE_DESCRIPTION} path="/" jsonLd={websiteJsonLd()} />
			<section class="solid-hero">
				<div class="solid-hero__copy">
					<Badge variant="outline">Fine-grained by default</Badge>
					<p class="solid-kicker">Shared system. Fine-grained runtime.</p>
					<h1>Tile UI, shaped for Solid.</h1>
					<p class="solid-hero__lede">
						A complete SolidJS component library with installable registry source, interactive examples, and deployment support from static hosting to server rendering.
					</p>
					<div class="solid-hero__actions">
						<a class="solid-link-button solid-link-button--primary" href="/docs">
							Read the docs
						</a>
						<a class="solid-link-button solid-link-button--outline" href="/docs/components">
							Browse components
						</a>
					</div>
				</div>
				<div class="solid-orbit" aria-label="Solid runtime capabilities">
					<div class="solid-orbit__core">
						<svg viewBox="0 0 24 24" role="img" aria-label="SolidJS">
							<path d="M11.558.788A9.082 9.082 0 0 0 9.776.99l-.453.15c-.906.303-1.656.755-2.1 1.348L4.887 6.468c.426-.387.974-.698 1.643-.894l.614-.154a8.82 8.82 0 0 1 1.777-.206c2.916-.053 6.033 1.148 8.423 2.36 2.317 1.175 3.888 2.32 3.987 2.39L24 5.518c-.082-.06-1.66-1.21-3.991-2.386C17.616 1.926 14.488.736 11.558.788ZM8.924 5.366a8.634 8.634 0 0 0-1.745.203l-.606.151c-1.278.376-2.095 1.16-2.43 2.108-.334.948-.188 2.065.487 3.116.33.43.747.813 1.216 1.147L12.328 10a6.943 6.943 0 0 1 6.013 1.013l2.844-.963c-.17-.124-1.663-1.2-3.91-2.34-2.379-1.206-5.479-2.396-8.352-2.344Zm5.435 4.497a6.791 6.791 0 0 0-1.984.283L2.94 13.189 0 18.334l9.276-2.992a6.945 6.945 0 0 1 7.408 2.314c.695.903.89 1.906.66 2.808l2.572-4.63c.595-1.041.45-2.225-.302-3.429a6.792 6.792 0 0 0-5.255-2.543Zm-3.031 5.341a6.787 6.787 0 0 0-2.006.283L.008 18.492c.175.131 2.02 1.498 4.687 2.768 2.797 1.332 6.37 2.467 9.468 1.712l.454-.152c1.278-.376 2.134-1.162 2.487-2.09.353-.93.207-2.004-.541-2.978a6.791 6.791 0 0 0-5.237-2.548Z" />
						</svg>
					</div>
					<span>CSR</span>
					<span>SSR / SSG</span>
					<span>Registry</span>
					<span>One source</span>
				</div>
			</section>
			<HomeCodeCompare />
			<Separator class="solid-home__separator" />
			<section aria-labelledby="solid-home-features">
				<h2 id="solid-home-features" class="solid-home__section-title">
					Built for the Solid runtime
				</h2>
				<div class="solid-home__grid">
					<Card>
						<CardHeader>
							<CardTitle>Deploy anywhere</CardTitle>
							<CardDescription>Use client rendering, server rendering, or pre-rendered static output without changing component APIs.</CardDescription>
						</CardHeader>
						<CardFooter class="solid-home__card-footer">
							<a href="/docs/examples">Explore rendering examples →</a>
						</CardFooter>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Source owned</CardTitle>
							<CardDescription>The app builds and watches its own shadcn-style Solid registry under `/r`.</CardDescription>
						</CardHeader>
						<CardFooter class="solid-home__card-footer">
							<a href="/docs/registry">Read the registry contract →</a>
						</CardFooter>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Consistent by design</CardTitle>
							<CardDescription>Docs, interactive demos, package exports, and registry source stay aligned as one system.</CardDescription>
						</CardHeader>
						<CardFooter class="solid-home__card-footer">
							<a href="/docs/components">Browse the component library →</a>
						</CardFooter>
					</Card>
				</div>
			</section>
		</div>
	);
}
