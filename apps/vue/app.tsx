import { defineComponent } from 'vue';

import { VueLogoIcon } from './components/logo-icon';

const SITE_URL = 'https://vue.tileui.zmorg.cn';
const SITE_TITLE = 'Tile UI Vue — Vue components, registry, and examples';
const SITE_DESCRIPTION = 'Tile UI Vue documentation: a shared SCSS design system with Vue components, composables, and a shadcn-style registry for installable UI items.';

function GitHubIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path
				fill="currentColor"
				d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.699-2.782.605-3.369-1.344-3.369-1.344-.455-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.071 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.349-1.088.635-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.748-1.026 2.748-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.921.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .269.18.58.688.481A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z"
			/>
		</svg>
	);
}

export default defineComponent({
	name: 'VueApp',
	setup() {
		// 站点全局 SEO head：title 模板、描述、Open Graph、Twitter Card 与 favicon。
		// canonical 由各页面在 head 中单独声明（首页与文档页），避免依赖路由实例类型。
		useHead({
			titleTemplate: '%s | Tile UI Vue',
			htmlAttrs: {
				lang: 'en',
			},
			link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
			meta: [
				{ name: 'description', content: SITE_DESCRIPTION },
				{
					name: 'keywords',
					content: 'tile ui, vue, vue components, ui library, design system, shadcn registry, component registry, typescript, scss, open source',
				},
				{ name: 'robots', content: 'index, follow' },
				{ property: 'og:site_name', content: 'Tile UI Vue' },
				{ property: 'og:type', content: 'website' },
				{ property: 'og:title', content: SITE_TITLE },
				{ property: 'og:description', content: SITE_DESCRIPTION },
				{ property: 'og:url', content: `${SITE_URL}/` },
				{ property: 'og:image', content: `${SITE_URL}/og.png` },
				{ property: 'og:image:width', content: '1200' },
				{ property: 'og:image:height', content: '630' },
				{ name: 'twitter:card', content: 'summary_large_image' },
				{ name: 'twitter:title', content: SITE_TITLE },
				{ name: 'twitter:description', content: SITE_DESCRIPTION },
				{ name: 'twitter:image', content: `${SITE_URL}/og.png` },
			],
		});

		return () => (
			<div class="docs-app-shell">
				<header class="docs-app-header">
					<div class="docs-app-header__inner">
						<NuxtLink to="/" class="docs-app-brand">
							<VueLogoIcon />
							Tile UI Vue
						</NuxtLink>
						<div class="docs-app-header__actions">
							<nav class="docs-app-nav">
								<NuxtLink to="/docs">Docs</NuxtLink>
								<NuxtLink to="/docs/components">Components</NuxtLink>
								<NuxtLink to="/docs/composables">Composables</NuxtLink>
								<NuxtLink to="/docs/registry">Registry</NuxtLink>
								<NuxtLink to="/docs/examples">Examples</NuxtLink>
							</nav>
							<div class="docs-app-header__divider" aria-hidden="true" />
							<a href="https://github.com/ice909/tile-ui" target="_blank" rel="noreferrer" class="docs-app-github">
								<GitHubIcon />
								<span>Source code</span>
							</a>
						</div>
					</div>
				</header>
				<NuxtPage />
			</div>
		);
	},
});
