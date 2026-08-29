import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from '@tile-ui/solid';

import { Seo, websiteJsonLd } from '../components/seo';
import { SITE_DESCRIPTION, SITE_NAME } from '../lib/site';

export default function Home() {
	return (
		<div class="solid-home">
			<Seo title={SITE_NAME} description={SITE_DESCRIPTION} path="/" jsonLd={websiteJsonLd()} />
			<section class="solid-hero">
				<div class="solid-hero__copy">
					<Badge variant="outline">61 components · SolidStart</Badge>
					<p class="solid-kicker">Shared system. Fine-grained runtime.</p>
					<h1>Tile UI, shaped for Solid.</h1>
					<p class="solid-hero__lede">
						A real SSR documentation app for 61 SolidJS components, with registry-owned source and demos that never drift from the code they display.
					</p>
					<div class="solid-hero__actions">
						<a class="solid-link-button solid-link-button--primary" href="/docs">
							Read the docs
						</a>
						<a class="solid-link-button solid-link-button--outline" href="/docs/components">
							Explore 61 components
						</a>
					</div>
				</div>
				<div class="solid-orbit" aria-label="Solid component capabilities">
					<div class="solid-orbit__core">61</div>
					<span>SSR</span>
					<span>Hydration</span>
					<span>Registry</span>
					<span>One source</span>
				</div>
			</section>
			<Separator />
			<section aria-labelledby="solid-home-features">
				<h2 id="solid-home-features" class="solid-home__section-title">
					Built for the Solid runtime
				</h2>
				<div class="solid-home__grid">
					<Card>
						<CardHeader>
							<CardTitle>Server first</CardTitle>
							<CardDescription>SolidStart sends useful component and docs markup before JavaScript runs.</CardDescription>
						</CardHeader>
						<CardContent>
							<a href="/docs/examples">Inspect the hydration examples →</a>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Source owned</CardTitle>
							<CardDescription>The app builds and watches its own shadcn-style Solid registry under `/r`.</CardDescription>
						</CardHeader>
						<CardContent>
							<a href="/docs/registry">Read the registry contract →</a>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Exact scope</CardTitle>
							<CardDescription>The docs, demos, package exports, and registry all track the complete 61-item Solid UI manifest.</CardDescription>
						</CardHeader>
						<CardContent>
							<a href="/docs/components">See the complete slice →</a>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}
