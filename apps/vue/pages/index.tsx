import { defineComponent } from 'vue';
import { vueHomeLinks } from '../../common/lib/docs';
import { HomeCodeCompare } from '../components/home-code-compare';

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
			<main class="docs-shell framework-home vue-home">
				<section class="framework-hero">
					<div class="framework-hero__copy">
						<p class="eyebrow">Shared system. Progressive runtime.</p>
						<h1>Start simple. Grow without rewrites.</h1>
						<p class="lede">
							Vue-native components, reactive composables, and installable source that fit naturally into templates, JSX, and applications of every size.
						</p>
						<div class="framework-hero__actions">
							<NuxtLink to="/docs" class="framework-button framework-button--primary">
								Read the docs
							</NuxtLink>
							<NuxtLink to="/docs/components" class="framework-button">
								Browse components
							</NuxtLink>
						</div>
					</div>
					<div class="vue-reactivity" aria-label="Vue reactive component model">
						<div class="vue-reactivity__bar">
							<span>ProfileCard.vue</span>
							<small>Reactive</small>
						</div>
						<div class="vue-reactivity__code">
							<code>&lt;script setup&gt;</code>
							<code>{'  '}const saved = ref(false)</code>
							<code>&lt;/script&gt;</code>
							<code>&lt;template&gt;</code>
							<code>{'  '}&lt;Button @click=&quot;saved = true&quot;&gt;</code>
							<code class="vue-reactivity__active">{"    {{ saved ? 'Saved' : 'Save' }}"}</code>
							<code>{'  '}&lt;/Button&gt;</code>
							<code>&lt;/template&gt;</code>
						</div>
						<p>State changes. The template follows.</p>
					</div>
				</section>

				<section class="framework-paths" aria-label="Vue documentation paths">
					{vueHomeLinks.map((section) => (
						<NuxtLink key={section.href} to={section.href} class="framework-paths__item">
							<span>{String(vueHomeLinks.indexOf(section) + 1).padStart(2, '0')}</span>
							<h2>{section.title}</h2>
							<p>{section.description}</p>
							<small>→</small>
						</NuxtLink>
					))}
				</section>

				<HomeCodeCompare />

				<section class="framework-runtime" aria-labelledby="vue-runtime-title">
					<div>
						<p class="eyebrow">Built for the Vue ecosystem</p>
						<h2 id="vue-runtime-title">Progressive from component to application.</h2>
					</div>
					<ul>
						<li>
							<strong>Vue-native binding</strong>
							<span>Reactive models and events fit directly into existing Vue flows.</span>
						</li>
						<li>
							<strong>Composables included</strong>
							<span>Share browser behavior without coupling it to component markup.</span>
						</li>
						<li>
							<strong>Nuxt ready</strong>
							<span>Components work across client rendering and server-rendered Vue apps.</span>
						</li>
					</ul>
				</section>

				<section class="framework-family" aria-labelledby="vue-family-title">
					<div class="framework-family__intro">
						<p class="eyebrow">One system, every runtime</p>
						<h2 id="vue-family-title">Your framework, your components.</h2>
						<p>Tile UI carries the same design language and source-owned workflow across frameworks, without flattening their native patterns.</p>
					</div>
					<div class="framework-family__links">
						<div class="framework-family__item framework-family__item--vue framework-family__current" aria-current="page">
							<span class="framework-family__icon framework-family__icon--vue" aria-hidden="true">
								<svg viewBox="0 0 24 24">
									<path d="M2 4h4.3L12 14l5.7-10H22L12 21 2 4Z" fill="currentColor" />
									<path class="framework-family__vue-inner" d="M6.7 4H10l2 3.5L14 4h3.3L12 13.3 6.7 4Z" />
								</svg>
							</span>
							<span class="framework-family__name">
								<strong>Vue</strong>
								<small>Current site</small>
							</span>
						</div>
						<a class="framework-family__item framework-family__item--react" href="https://react.tileui.zmorg.cn/docs" target="_blank" rel="noreferrer">
							<span class="framework-family__icon framework-family__icon--react" aria-hidden="true">
								<svg viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="2.2" fill="currentColor" />
									<ellipse cx="12" cy="12" rx="9" ry="3.8" />
									<ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
									<ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
								</svg>
							</span>
							<span class="framework-family__name">
								<strong>React</strong>
								<small>Available now</small>
							</span>
							<span class="framework-family__arrow" aria-hidden="true">
								↗
							</span>
						</a>
						<a class="framework-family__item framework-family__item--solid" href="https://solid.tileui.zmorg.cn/docs" target="_blank" rel="noreferrer">
							<span class="framework-family__icon framework-family__icon--solid" aria-hidden="true">
								<svg viewBox="0 0 24 24">
									<path d="M11.558.788A9.082 9.082 0 0 0 9.776.99l-.453.15c-.906.303-1.656.755-2.1 1.348L4.887 6.468c.426-.387.974-.698 1.643-.894l.614-.154a8.82 8.82 0 0 1 1.777-.206c2.916-.053 6.033 1.148 8.423 2.36 2.317 1.175 3.888 2.32 3.987 2.39L24 5.518c-.082-.06-1.66-1.21-3.991-2.386C17.616 1.926 14.488.736 11.558.788ZM8.924 5.366a8.634 8.634 0 0 0-1.745.203l-.606.151c-1.278.376-2.095 1.16-2.43 2.108-.334.948-.188 2.065.487 3.116.33.43.747.813 1.216 1.147L12.328 10a6.943 6.943 0 0 1 6.013 1.013l2.844-.963c-.17-.124-1.663-1.2-3.91-2.34-2.379-1.206-5.479-2.396-8.352-2.344Zm5.435 4.497a6.791 6.791 0 0 0-1.984.283L2.94 13.189 0 18.334l9.276-2.992a6.945 6.945 0 0 1 7.408 2.314c.695.903.89 1.906.66 2.808l2.572-4.63c.595-1.041.45-2.225-.302-3.429a6.792 6.792 0 0 0-5.255-2.543Zm-3.031 5.341a6.787 6.787 0 0 0-2.006.283L.008 18.492c.175.131 2.02 1.498 4.687 2.768 2.797 1.332 6.37 2.467 9.468 1.712l.454-.152c1.278-.376 2.134-1.162 2.487-2.09.353-.93.207-2.004-.541-2.978a6.791 6.791 0 0 0-5.237-2.548Z" />
								</svg>
							</span>
							<span class="framework-family__name">
								<strong>Solid</strong>
								<small>Available now</small>
							</span>
							<span class="framework-family__arrow" aria-hidden="true">
								↗
							</span>
						</a>
						<div class="framework-family__item framework-family__more">
							<span class="framework-family__icon">+</span>
							<span class="framework-family__name">
								<strong>More frameworks</strong>
								<small>On the horizon</small>
							</span>
						</div>
					</div>
				</section>
			</main>
		);
	},
});
