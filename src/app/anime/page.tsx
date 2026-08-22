import React, { Suspense } from 'react';
import {
    discoverAnime,
    getTvGenres,
    getLanguages,
    getCountries,
    MediaFilters as MediaFilterType,
    getImageUrl,
} from '@/lib/tmdb';
import { slugify } from '@/lib/utils';
import { MediaListPageClient } from '@/components/media/MediaListPageClient';
import type { Metadata, Viewport } from 'next';

export const revalidate = 3600; // 1 hour in seconds
export const runtime = 'edge';
const SITE_URL = process.env.CANONICAL_URL || 'https://cinema4arab.online';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Define props using the standard Next.js structure
interface PageProps {
    params: Promise<Record<string, never>>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Enable ISR with a 3-day revalidation period

export default async function AnimePage({ searchParams: searchParamsPromise }: PageProps) {
    const searchParams = await searchParamsPromise;

    const pageParam = searchParams?.page as string || '1';
    const sortByParam = searchParams?.sortBy as string || 'vote_count.desc';
    const genreParam = searchParams?.genre as string || '16';
    const yearParam = searchParams?.year as string;
    const languageParam = searchParams?.language as string;

    const filters: MediaFilterType = {
        page: parseInt(pageParam),
        sort_by: sortByParam,
        with_genres: genreParam,
        first_air_date_year: yearParam ? parseInt(yearParam) : undefined,
        with_original_language: languageParam || undefined,
        with_origin_country: 'JP',
        'vote_count.gte': 100,
    };

    const [initialData, genres, languages, countries] = await Promise.all([
        discoverAnime(filters),
        getTvGenres(),
        getLanguages(),
        getCountries()
    ]);

    const genreId = searchParams?.genre as string | undefined;
    const foundGenre = genreId ? genres.find(g => g.id.toString() === genreId) : undefined;
    const genreName = (foundGenre && foundGenre.id !== 16) ? foundGenre.name : undefined;
    const pageTitle = genreName ? `انمي ${genreName}` : 'انمي';
    const pageDescription = genreName 
        ? `تصفح أفضل انمي ${genreName} للمشاهدة والتحميل بجودة عالية على سينما العرب.` 
        : 'استكشف أفضل الانمي والرسوم المتحركة اليابانية بتصنيفات وفئات متنوعة على سينما العرب.';
    const canonicalUrl = genreId && genreId !== '16' ? `${SITE_URL}/anime?genre=${genreId}` : `${SITE_URL}/anime`;

    const sampleAnime = initialData.results.slice(0, 8);

    const collectionPageJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: pageTitle,
        description: pageDescription,
        url: canonicalUrl,
        publisher: { '@id': `${SITE_URL}/#organization` },
        ...(sampleAnime.length > 0 && {
            mainEntity: {
                '@type': 'ItemList',
                itemListElement: sampleAnime.map((anime, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    item: {
                        '@type': 'TVSeries',
                        name: anime.name,
                        url: `${SITE_URL}/anime/${slugify(anime.name)}-${anime.id}`,
                        image: anime.poster_path ? getImageUrl(anime.poster_path) : undefined,
                        datePublished: anime.first_air_date,
                        ...(anime.vote_average && anime.vote_count && anime.vote_count > 0 && {
                            aggregateRating: {
                                '@type': 'AggregateRating',
                                ratingValue: anime.vote_average.toFixed(1),
                                bestRating: '10',
                                ratingCount: anime.vote_count.toString(),
                            },
                        }),
                    }
                })),
            },
        }),
    };

    const breadcrumbItems = [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'انمي', item: `${SITE_URL}/anime` },
    ];
    if (genreName && genreId) {
        breadcrumbItems.push({ 
            '@type': 'ListItem', 
            position: 3, 
            name: genreName, 
            item: `${SITE_URL}/anime?genre=${genreId}` 
        });
    }
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
    };

    const jsonLdGraph = {
        '@context': 'https://schema.org',
        '@graph': [collectionPageJsonLd, breadcrumbJsonLd]
    };

    return (
        <div className="min-h-screen w-full pb-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
            />
            {/* Hero section with full-width background */}
            <div className="w-full bg-gradient-to-b from-primary/10 to-background py-6 sm:py-8 mb-2">
                <div className="px-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                        {genreName ? `انمي ${genreName} جديد للمشاهدة والتحميل` : 'انمي جديد للمشاهدة والتحميل'}
                    </h1>
                    <p className="text-base sm:text-lg text-muted-foreground mt-2">
                        {genreName 
                            ? `تصفح أحدث وأفضل مسلسلات وأفلام انمي ${genreName} المترجمة`
                            : 'تصفح مجموعتنا المتنوعة من أفلام ومسلسلات الانمي اليابانية بتصنيفات مختلفة'}
                    </p>
                </div>
            </div>
            
            {/* Main content area */}
            <div className="w-full">
                <Suspense fallback={<div className="px-4 py-10 text-center">جاري التحميل...</div>}>
                    <MediaListPageClient
                        initialData={initialData.results}
                        initialTotalPages={initialData.total_pages > 500 ? 500 : initialData.total_pages}
                        genres={genres}
                        languages={languages}
                        countries={countries}
                        mediaType="anime"
                    />
                </Suspense>
            </div>
        </div>
    );
}

export async function generateMetadata({ searchParams: searchParamsPromise }: PageProps): Promise<Metadata> {
  const searchParams = await searchParamsPromise;
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب';

  const genreId = searchParams?.genre as string | undefined;

  let pageTitle = 'انمي';
  let pageDescription = `استكشف أفضل الانمي والرسوم المتحركة اليابانية بتصنيفات وفئات متنوعة على ${siteName}.`;
  let canonicalUrl = `${SITE_URL}/anime`;

  const queryForPage = new URLSearchParams();
  if (genreId && genreId !== '16') queryForPage.set('genre', genreId);
  
  if (queryForPage.toString()) {
    canonicalUrl += `?${queryForPage.toString()}`;
  }

  let genreName: string | undefined;
  if (genreId && genreId !== '16') {
    const allGenres = await getTvGenres();
    const foundGenre = allGenres.find(g => g.id.toString() === genreId);
    if (foundGenre) {
        genreName = foundGenre.name;
        pageTitle = `انمي ${genreName}`;
        pageDescription = `تصفح أفضل انمي ${genreName} للمشاهدة والتحميل على ${siteName}. ${pageDescription}`;
    }
  }

  const ogImageUrl = new URL(`${SITE_URL}/api/og`);
  ogImageUrl.searchParams.set('title', genreName ? `انمي ${genreName}` : 'انمي');
  ogImageUrl.searchParams.set('description', pageDescription.substring(0,100));
  ogImageUrl.searchParams.set('type', 'anime-list');

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${pageTitle} | ${siteName}`,
      description: pageDescription,
      url: canonicalUrl,
      siteName: siteName,
      images: [{ url: ogImageUrl.toString(), width: 1200, height: 630, alt: pageTitle }],
      type: 'website',
      locale: 'ar_SA',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pageTitle} | ${siteName}`,
      description: pageDescription,
      images: [ogImageUrl.toString()],
    },
  };
} 