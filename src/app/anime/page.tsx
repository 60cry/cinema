import React, { Suspense } from 'react';
import {
    discoverAnime,
    getTvGenres,
    getLanguages,
    getCountries,
    MediaFilters as MediaFilterType,
} from '@/lib/tmdb';
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
    // const params = await paramsPromise; // Await params if needed, though it's empty for this page
    const searchParams = await searchParamsPromise; // Await searchParams

    // Read searchParams properties into variables first
    const pageParam = searchParams?.page as string || '1';
    const sortByParam = searchParams?.sortBy as string || 'vote_count.desc';
    const genreParam = searchParams?.genre as string || '16';
    const yearParam = searchParams?.year as string;
    const languageParam = searchParams?.language as string;

    // Define filters object using the variables
    const filters: MediaFilterType = {
        page: parseInt(pageParam),
        sort_by: sortByParam,
        with_genres: genreParam,
        first_air_date_year: yearParam ? parseInt(yearParam) : undefined,
        with_original_language: languageParam || undefined, // Use || undefined here
        with_origin_country: 'JP', // Always fetch from Japan
        'vote_count.gte': 100, // Add minimum vote count
    };

    // Fetch initial data and filter options in parallel
    // Note: Anime uses TV genres, Languages, and Countries
    const [initialData, genres, languages, countries] = await Promise.all([
        discoverAnime(filters), // Use discoverAnime function
        getTvGenres(),
        getLanguages(),
        getCountries()
    ]);

    return (
        <div className="min-h-screen w-full pb-16">
            {/* Hero section with full-width background */}
            <div className="w-full bg-gradient-to-b from-primary/10 to-background py-6 sm:py-8 mb-2">
                <div className="px-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">انمي جديد للمشاهدة والتحميل</h1>
                    <p className="text-base sm:text-lg text-muted-foreground mt-2">
                        تصفح مجموعتنا المتنوعة من أفلام ومسلسلات الانمي اليابانية بتصنيفات مختلفة
                    </p>
                </div>
            </div>
            
            {/* Main content area */}
            <div className="w-full">
                <Suspense fallback={<div className="px-4 py-10 text-center">جاري التحميل...</div>}>
                    <MediaListPageClient
                        initialData={initialData.results}
                        initialTotalPages={initialData.total_pages > 500 ? 500 : initialData.total_pages}
                        genres={genres} // Pass TV genres
                        languages={languages}
                        countries={countries} // Pass countries
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
  // Add other filters if they should affect metadata:
  // const year = searchParams?.year as string | undefined;

  let pageTitle = `انمي | ${siteName}`;
  let pageDescription = `استكشف أفضل الانمي والرسوم المتحركة اليابانية بتصنيفات وفئات متنوعة على ${siteName}.`;
  let canonicalUrl = `${SITE_URL}/anime`;

  const queryForPage = new URLSearchParams();
  if (genreId) queryForPage.set('genre', genreId);
  // if (year) queryForPage.set('year', year);
  
  if (queryForPage.toString()) {
    canonicalUrl += `?${queryForPage.toString()}`;
  }

  let genreName: string | undefined;
  if (genreId) {
    const allGenres = await getTvGenres(); // Anime uses TV genres
    const foundGenre = allGenres.find(g => g.id.toString() === genreId);
    if (foundGenre) {
        genreName = foundGenre.name;
        pageTitle = `انمي ${genreName} | ${siteName}`;
        pageDescription = `تصفح أفضل انمي ${genreName} للمشاهدة والتحميل على ${siteName}. ${pageDescription}`;
    }
  }

  const ogImageUrl = new URL(`${SITE_URL}/api/og`);
  ogImageUrl.searchParams.set('title', pageTitle);
  ogImageUrl.searchParams.set('description', pageDescription.substring(0,100));
  ogImageUrl.searchParams.set('type', 'anime-list');

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    publisher: { '@id': `${SITE_URL}/#organization` },
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