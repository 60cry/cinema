import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'سينما العرب',
    short_name: 'سينما العرب',
    description: 'مشاهدة وتحميل أفلام ومسلسلات وانمي مترجمة بجودة عالية',
    start_url: '/',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/og-image.png',
        sizes: '1200x630',
        type: 'image/png',
      },
    ],
  };
}

