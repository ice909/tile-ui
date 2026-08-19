import { defineComponent, ref } from 'vue';
import { Button, Input, Textarea, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@tile-ui/vue';
import { vueHomeLinks } from '../../common/lib/docs';

const SITE_URL = 'https://vue.tileui.zmorg.cn';
const SITE_TITLE = 'Tile UI Vue — Vue components, registry, and examples';
const SITE_DESCRIPTION = 'Tile UI Vue documentation: a shared SCSS design system with Vue components, composables, and a shadcn-style registry for installable UI items.';

const websiteJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	name: 'Tile UI Vue',
	url: `${SITE_URL}/`,
	description: SITE_DESCRIPTION,
	inLanguage: 'en',
};

export default defineComponent({
	name: 'VueHomePage',
	setup() {
		const inputValue = ref('');
		const textareaValue = ref('');

		useHead({
			titleTemplate: () => SITE_TITLE,
			meta: [
				{ property: 'og:title', content: SITE_TITLE },
				{ property: 'og:description', content: SITE_DESCRIPTION },
				{ property: 'og:url', content: `${SITE_URL}/` },
			],
			link: [{ rel: 'canonical', href: `${SITE_URL}/` }],
			script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(websiteJsonLd) }],
		});

		return () => (
			<main class="docs-shell">
				<section class="hero">
					<p class="eyebrow">Tile UI Vue</p>
					<h1>Vue components, registry items, and examples.</h1>
					<p class="lede">
						A Vue-focused documentation surface for Tile UI. Install the package, browse registry items, and preview the component primitives that power the design
						system.
					</p>
				</section>

				<section class="card-grid">
					{vueHomeLinks.map((section) => (
						<NuxtLink key={section.href} to={section.href} class="card-link">
							<h2>{section.title}</h2>
							<p>{section.description}</p>
						</NuxtLink>
					))}
				</section>

				<section class="showcase-shell">
					<div class="showcase-header">
						<p class="eyebrow">Component Showcase</p>
						<h2>Preview the Vue building blocks.</h2>
						<p class="showcase-copy">The same primitives are available from the package and from the Vue registry hosted on this site.</p>
					</div>

					<div class="showcase-grid">
						<Card>
							{{
								default: () => [
									<CardHeader>
										{{
											default: () => [
												<CardTitle>{{ default: () => 'Buttons' }}</CardTitle>,
												<CardDescription>{{ default: () => 'Variants, sizes, and loading state.' }}</CardDescription>,
											],
										}}
									</CardHeader>,
									<CardContent>
										{{
											default: () => (
												<div class="button-group">
													<Button>{{ default: () => 'Default' }}</Button>
													<Button variant="outline">{{ default: () => 'Outline' }}</Button>
													<Button variant="secondary">{{ default: () => 'Secondary' }}</Button>
													<Button variant="destructive">{{ default: () => 'Destructive' }}</Button>
													<Button loading>{{ default: () => 'Loading' }}</Button>
												</div>
											),
										}}
									</CardContent>,
								],
							}}
						</Card>

						<Card>
							{{
								default: () => [
									<CardHeader>
										{{
											default: () => [
												<CardTitle>{{ default: () => 'Inputs' }}</CardTitle>,
												<CardDescription>{{ default: () => 'Shared label, helper text, and error affordances.' }}</CardDescription>,
											],
										}}
									</CardHeader>,
									<CardContent>
										{{
											default: () => (
												<div class="form-group">
													<Input
														label="Username"
														placeholder="Enter your username"
														modelValue={inputValue.value}
														onUpdate:modelValue={(value: string) => {
															inputValue.value = value;
														}}
													/>
													<Input label="Email" type="email" placeholder="you@example.com" helperText="We will never share it." />
													<Input label="Error state" error="Username already exists" modelValue="tile" />
												</div>
											),
										}}
									</CardContent>,
								],
							}}
						</Card>

						<Card>
							{{
								default: () => [
									<CardHeader>
										{{
											default: () => [
												<CardTitle>{{ default: () => 'Textarea + Label' }}</CardTitle>,
												<CardDescription>{{ default: () => 'Composable form surfaces for multi-line input.' }}</CardDescription>,
											],
										}}
									</CardHeader>,
									<CardContent>
										{{
											default: () => (
												<div class="form-group">
													<div class="form-group">
														<Label required>{{ default: () => 'Feedback' }}</Label>
														<Textarea
															placeholder="Share what you are building..."
															modelValue={textareaValue.value}
															onUpdate:modelValue={(value: string) => {
																textareaValue.value = value;
															}}
														/>
													</div>
													<Textarea label="Validation" error="Please enter at least 10 characters." modelValue="Too short" />
												</div>
											),
										}}
									</CardContent>,
									<CardFooter>
										{{
											default: () => [<Button variant="outline">{{ default: () => 'Cancel' }}</Button>, <Button>{{ default: () => 'Save' }}</Button>],
										}}
									</CardFooter>,
								],
							}}
						</Card>
					</div>

					<div class="showcase-footer">Tile UI Vue combines a shared SCSS design system with framework-specific ergonomics and registry-driven distribution.</div>
				</section>
			</main>
		);
	},
});
