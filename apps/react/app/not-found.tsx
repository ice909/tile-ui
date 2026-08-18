import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Page not found',
	description: 'The page you requested does not exist on the Tile UI React documentation site.',
	robots: {
		index: false,
		follow: false,
	},
};

export default function NotFound() {
	return (
		<main className="docs-shell docs-error-main">
			<div className="docs-error-layout">
				<div className="docs-error-content">
					<div className="docs-page__header">
						<p className="docs-page__section-label">Error</p>
						<h1>Page not found</h1>
						<p className="docs-page__description">The page you requested does not exist or the docs route is invalid.</p>
					</div>
					<div className="docs-error-actions">
						<Link href="/docs/" className="docs-error-action">
							<span className="docs-error-action__label">Back</span>
							<strong>Open docs home</strong>
						</Link>
						<Link href="/" className="docs-error-action">
							<span className="docs-error-action__label">Home</span>
							<strong>Return to site</strong>
						</Link>
					</div>
				</div>
			</div>
		</main>
	);
}
