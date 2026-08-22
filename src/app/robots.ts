import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/watch/', '/search', '/watchlist'],
    },
    sitemap: `${siteUrl}/sitemap_index.xml`,
  };
}

