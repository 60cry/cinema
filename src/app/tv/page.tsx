import React, { Suspense } from 'react';
import {
    discoverTvShows,
    getTvGenres,
    getLanguages,
    getCountries,
    MediaFilters as MediaFilterType,
    getImageUrl
} from '@/lib/tmdb';
import { slugify } from '@/lib/utils';
import { MediaListPageClient } from '@/components/media/MediaListPageClient';
import type { Metadata } from 'next';

export const revalidate = 3600; // 1 hour in seconds
export const runtime = 'edge';
const SITE_URL = process.env.CANONICAL_URL || 'https://cinema4arab.online';

// Define props using the standard Next.js structure
interface PageProps {
    params: Promise<Record<string, never>>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TvShowsPage({ searchParams: searchParamsPromise }: PageProps) {
    const searchParams = await searchParamsPromise;

    // Read searchParams properties into variables first
    const pageParam = searchParams?.page as string || '1';
    const sortByParam = searchParams?.sortBy as string || 'popularity.desc';
    const genreParam = searchParams?.genre as string;
    const yearParam = searchParams?.year as string;
    const languageParam = searchParams?.language as string;
    const countryParam = searchParams?.country as string; // Capture country param

    // Define filters object using the variables
    const filters: MediaFilterType = {
        page: parseInt(pageParam),
        sort_by: sortByParam,
        with_genres: genreParam,
        first_air_date_year: yearParam ? parseInt(yearParam) : undefined,
        with_original_language: languageParam || undefined,
        with_origin_country: countryParam || undefined, // Use captured country param
        'vote_count.gte': 100, // Add minimum vote count for quality results
    };

    // Fetch initial data and filter options in parallel
    const [initialData, genres, languages, countries] = await Promise.all([
        discoverTvShows(filters),
        getTvGenres(),
        getLanguages(),
        getCountries(),
    ]);

    return (
        <div className="min-h-screen w-full pb-16">
            {/* Hero section with full-width background */}
            <div className="w-full bg-gradient-to-b from-primary/10 to-background py-6 sm:py-8 mb-2">
                <div className="px-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">مسلسلات جديدة للمشاهدة والتحميل</h1>
                    <p className="text-base sm:text-lg text-muted-foreground mt-2">
                        تصفح مجموعتنا المتنوعة من المسلسلات العالمية والعربية بتصنيفات مختلفة
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
                        mediaType="tv"
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
  // const year = searchParams?.year as string | undefined;

  let pageTitle = `مسلسلات | ${siteName}`;
  let pageDescription = `استكشف أحدث المسلسلات العالمية والعربية بتصنيفات وفئات متنوعة على ${siteName}.`;
  let canonicalUrl = `${SITE_URL}/tv`;

  const queryForPage = new URLSearchParams();
  if (genreId) queryForPage.set('genre', genreId);
  // if (year) queryForPage.set('year', year);

  if (queryForPage.toString()) {
    canonicalUrl += `?${queryForPage.toString()}`;
  }

  let genreName: string | undefined;
  if (genreId) {
    const allGenres = await getTvGenres();
    const foundGenre = allGenres.find(g => g.id.toString() === genreId);
    if (foundGenre) {
        genreName = foundGenre.name;
        pageTitle = `مسلسلات ${genreName} | ${siteName}`;
        pageDescription = `تصفح أفضل مسلسلات ${genreName} للمشاهدة والتحميل على ${siteName}. ${pageDescription}`;
    }
  }

  const sampleFilters: MediaFilterType = { page: 1, with_genres: genreId };
  const sampleTvData = await discoverTvShows(sampleFilters);
  const sampleTvShows = sampleTvData.results.slice(0, 5);

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    publisher: { '@id': `${SITE_URL}/#organization` },
    ...(sampleTvShows.length > 0 && {
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: sampleTvShows.map((tvShow, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'TVSeries',
                    name: tvShow.name,
                    url: `${SITE_URL}/tv/${slugify(tvShow.name)}-${tvShow.id}`,
                    image: tvShow.poster_path ? getImageUrl(tvShow.poster_path) : undefined,
                    datePublished: tvShow.first_air_date,
                     ...(tvShow.vote_average && tvShow.vote_count && tvShow.vote_count > 0 && {
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue: tvShow.vote_average.toFixed(1),
                            bestRating: '10',
                            ratingCount: tvShow.vote_count.toString(),
                        },
                    }),
                }
            })),
        },
    }),
  };

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'مسلسلات', item: `${SITE_URL}/tv` },
  ];
  if (genreName && genreId) {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: genreName, item: `${SITE_URL}/tv?genre=${genreId}` });
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  const ogImageUrl = new URL(`${SITE_URL}/api/og`);
  ogImageUrl.searchParams.set('title', pageTitle);
  ogImageUrl.searchParams.set('description', pageDescription.substring(0,100));
  ogImageUrl.searchParams.set('type', 'tv-list');

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: siteName,
      images: [{ url: ogImageUrl.toString(), width: 1200, height: 630, alt: pageTitle }],
      type: 'website',
      locale: 'ar_SA',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [ogImageUrl.toString()],
    },
    other: {
      'json-ld': JSON.stringify({ '@context': 'https://schema.org', '@graph': [collectionPageJsonLd, breadcrumbJsonLd].filter(Boolean) }),
    },
  };
} 