import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';

  // Static routes only
  const routes = [
    '',
    '/movies',
    '/tv',
    '/anime',
    '/dmca',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return routes;
}

