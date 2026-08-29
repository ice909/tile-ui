import { Link, Meta, MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense, type ParentProps } from 'solid-js';

import '@tile-ui/styles/scss/globals.scss';
import './styles/docs.scss';

function SolidMark() {
	return (
		<svg class="solid-mark" viewBox="0 0 32 32" aria-hidden="true">
			<path d="M5 8.5 14.5 4 27 9.5l-9.5 4.4L5 8.5Z" fill="currentColor" opacity=".72" />
			<path d="m5 13 12.5 5.4L27 14v6l-9.5 4.5L5 19v-6Z" fill="currentColor" />
		</svg>
	);
}

function AppShell(props: ParentProps) {
	return (
		<div class="solid-docs-shell" data-tile-app="solidstart">
			<header class="solid-header">
				<a href="/" class="solid-brand">
					<SolidMark />
					<span>Tile UI</span>
					<strong>Solid</strong>
				</a>
				<nav aria-label="Primary navigation">
					<a href="/docs">Docs</a>
					<a href="/docs/components">Components</a>
					<a href="/docs/primitives">Primitives</a>
					<a href="/docs/registry">Registry</a>
					<a href="/docs/examples">Examples</a>
				</nav>
				<a class="solid-source" href="https://github.com/zmide/tile-ui" rel="noreferrer" target="_blank">
					Source code
				</a>
			</header>
			<main id="main-content">
				<Suspense>{props.children}</Suspense>
			</main>
		</div>
	);
}

export default function App() {
	return (
		<Router
			root={(props) => (
				<MetaProvider>
					<Link rel="icon" type="image/svg+xml" href="/favicon.svg" />
					<Meta name="generator" content="SolidStart" />
					<Meta name="tile-ui-app" content="solidstart" />
					<AppShell>{props.children}</AppShell>
				</MetaProvider>
			)}>
			<FileRoutes />
		</Router>
	);
}
