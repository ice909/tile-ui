import type { MetadataRoute } from 'next';

import { withTrailingSlash } from '../lib/trailing-slash';
import { source } from '../lib/source';

const SITE_URL = 'https://react.tileui.zmorg.cn';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
	const staticRoutes: MetadataRoute.Sitemap = [
		{
			url: `${SITE_URL}/`,
			changeFrequency: 'weekly',
			priority: 1,
		},
	];

	const docRoutes: MetadataRoute.Sitemap = source.getPages().map((page) => ({ url: withTrailingSlash(`${SITE_URL}${page.url}`), changeFrequency: 'weekly' }));

	return [...staticRoutes, ...docRoutes];
}
