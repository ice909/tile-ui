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

function GitHubIcon() {
	return (
		<svg class="solid-source__icon" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.2.1 15 1.8a13.4 13.4 0 0 0-7 0C4.8.1 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4" />
			<path d="M8 19c-3 .9-3-1.5-4-2" />
		</svg>
	);
}

function AppShell(props: ParentProps) {
	return (
		<div class="solid-docs-shell" data-tile-app="solidstart">
			<header class="solid-header">
				<div class="solid-header__inner">
					<a href="/" class="solid-brand">
						<SolidMark />
						<span>Tile UI</span>
						<strong>Solid</strong>
					</a>
					<div class="solid-header__actions">
						<nav aria-label="Primary navigation">
							<a href="/docs">Docs</a>
							<a href="/docs/components">Components</a>
							<a href="/docs/primitives">Primitives</a>
							<a href="/docs/registry">Registry</a>
							<a href="/docs/examples">Examples</a>
						</nav>
						<div class="solid-header__divider" aria-hidden="true" />
						<a class="solid-source" href="https://github.com/zmide/tile-ui" rel="noreferrer" target="_blank">
							<GitHubIcon />
							<span>Source code</span>
						</a>
					</div>
				</div>
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
