import { Link, Meta, Title, useHead } from '@solidjs/meta';

import { OG_IMAGE_URL, SITE_NAME, SITE_ORIGIN } from '../lib/site';

export function Seo(props: { title: string; description: string; path: string; type?: 'website' | 'article'; noIndex?: boolean; jsonLd?: object }) {
	const canonical = () => `${SITE_ORIGIN}${props.path === '/' ? '/' : props.path}`;
	const fullTitle = () => (props.title === SITE_NAME ? SITE_NAME : `${props.title} | ${SITE_NAME}`);

	if (props.jsonLd) {
		useHead({
			tag: 'script',
			props: { type: 'application/ld+json', children: JSON.stringify(props.jsonLd) },
			id: `jsonld-${props.path}`,
			setting: { close: true, escape: false },
		});
	}

	return (
		<>
			<Title>{fullTitle()}</Title>
			<Meta name="description" content={props.description} />
			<Meta name="robots" content={props.noIndex ? 'noindex,nofollow' : 'index,follow'} />
			{props.noIndex ? null : <Link rel="canonical" href={canonical()} />}
			<Meta property="og:site_name" content={SITE_NAME} />
			<Meta property="og:type" content={props.type ?? 'website'} />
			<Meta property="og:title" content={fullTitle()} />
			<Meta property="og:description" content={props.description} />
			{props.noIndex ? null : <Meta property="og:url" content={canonical()} />}
			<Meta property="og:image" content={OG_IMAGE_URL} />
			<Meta name="twitter:card" content="summary_large_image" />
			<Meta name="twitter:title" content={fullTitle()} />
			<Meta name="twitter:description" content={props.description} />
			<Meta name="twitter:image" content={OG_IMAGE_URL} />
		</>
	);
}

export function websiteJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: `${SITE_ORIGIN}/`,
		description: 'Tile UI documentation and registry for SolidJS.',
	};
}

export function breadcrumbJsonLd(path: string, title: string) {
	const segments = path.split('/').filter(Boolean);
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: segments.map((segment, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: index === segments.length - 1 ? title : segment === 'docs' ? 'Docs' : segment.replaceAll('-', ' '),
			item: `${SITE_ORIGIN}/${segments.slice(0, index + 1).join('/')}`,
		})),
	};
}
