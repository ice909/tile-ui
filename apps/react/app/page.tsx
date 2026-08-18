import type { Metadata } from 'next';

import { HomePage } from '@/components/home-page';

export const metadata: Metadata = {
	title: 'Tile UI React — React components, registry, and examples',
	description: 'Tile UI React documentation: a shared SCSS design system with React components, hooks, and a shadcn-style registry for installable UI items.',
	alternates: {
		canonical: 'https://react.tileui.zmorg.cn/',
	},
	openGraph: {
		type: 'website',
		url: 'https://react.tileui.zmorg.cn/',
		siteName: 'Tile UI React',
		title: 'Tile UI React — React components, registry, and examples',
		description: 'Tile UI React documentation: a shared SCSS design system with React components, hooks, and a shadcn-style registry for installable UI items.',
		images: [
			{
				url: 'https://react.tileui.zmorg.cn/og.png',
				width: 1200,
				height: 630,
				alt: 'Tile UI React',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Tile UI React — React components, registry, and examples',
		description: 'Tile UI React documentation: a shared SCSS design system with React components, hooks, and a shadcn-style registry for installable UI items.',
		images: ['https://react.tileui.zmorg.cn/og.png'],
	},
};

const websiteJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	name: 'Tile UI React',
	url: 'https://react.tileui.zmorg.cn/',
	description: 'Tile UI React documentation: a shared SCSS design system with React components, hooks, and a shadcn-style registry for installable UI items.',
	inLanguage: 'en',
};

export default function Home() {
	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
			<HomePage />
		</>
	);
}
