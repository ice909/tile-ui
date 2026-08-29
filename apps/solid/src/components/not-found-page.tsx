import { HttpStatusCode } from '@solidjs/start';
import { useLocation } from '@solidjs/router';

import { Seo } from './seo';

export function NotFoundPage(props: { docs?: boolean }) {
	const location = useLocation();
	const title = props.docs ? 'Documentation not found' : 'Page not found';
	const description = props.docs ? 'The requested Tile UI Solid documentation page does not exist.' : 'The requested Tile UI Solid page does not exist.';

	return (
		<div class="solid-error">
			<HttpStatusCode code={404} text="Not Found" />
			<Seo title={title} description={description} path={location.pathname} noIndex />
			<div class="solid-error__code" aria-hidden="true">
				404
			</div>
			<div class="solid-error__content">
				<p>Tile UI · SolidJS</p>
				<h1>{title}</h1>
				<span>{description}</span>
				<div class="solid-error__actions">
					<a class="solid-link-button solid-link-button--primary" href={props.docs ? '/docs' : '/'}>
						{props.docs ? 'Return to docs' : 'Return home'}
					</a>
					<a class="solid-link-button solid-link-button--outline" href="/docs/components">
						Browse components
					</a>
				</div>
			</div>
		</div>
	);
}
