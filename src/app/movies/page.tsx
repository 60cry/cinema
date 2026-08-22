import React, { Suspense } from 'react';
import {
    discoverMovies,
    getMovieGenres,
    getLanguages,
    MediaFilters as MediaFilterType,
    getImageUrl // For JSON-LD sample items
} from '@/lib/tmdb';
import { slugify } from '@/lib/utils'; // For JSON-LD item URLs
import { MediaListPageClient } from '@/components/media/MediaListPageClient';
import type { Metadata, Viewport } from 'next';
const SITE_URL = process.env.CANONICAL_URL || 'https://cinema4arab.online';
export const revalidate = 3600; // 1 hour in seconds
export const runtime = 'edge';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Define props using the standard Next.js structure
interface PageProps {
    params: Promise<Record<string, never>>;
    // Define expected searchParams keys and their types more explicitly
    searchParams: Promise<{
        page?: string;
        sortBy?: string;
        genre?: string;
        year?: string;
        language?: string;
        country?: string;
        // Add other potential params if needed
        [key: string]: string | string[] | undefined; // Keep flexible index signature
    }>;
}

export default async function MoviesPage({ searchParams: searchParamsPromise }: PageProps) {
    const searchParams = await searchParamsPromise;

    // Access searchParams directly, providing defaults
    const page = parseInt(searchParams.page || '1', 10);
    const sortBy = searchParams.sortBy || 'popularity.desc';
    const genre = searchParams.genre;
    const year = searchParams.year ? parseInt(searchParams.year, 10) : undefined;
    const language = searchParams.language;

    const filters: MediaFilterType = {
        page: page,
        sort_by: sortBy,
        with_genres: genre,
        primary_release_year: year,
        with_original_language: language,
        // Include country filter if received from the dropdown
        with_origin_country: searchParams.country as string | undefined, 
    };

    // Fetch initial data and filter options in parallel
    const [initialData, genres, languages] = await Promise.all([
        discoverMovies(filters), // Pass the constructed filters object
        getMovieGenres(),
        getLanguages()
    ]);

    return (
        <div className="min-h-screen w-full pb-16">
            {/* Hero section with full-width background */}
            <div className="w-full bg-gradient-to-b from-primary/10 to-background py-6 sm:py-8 mb-2">
                <div className="px-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">أفلام جديدة للمشاهدة والتحميل</h1>
                    <p className="text-base sm:text-lg text-muted-foreground mt-2">
                        تصفح مجموعتنا المتنوعة من الأفلام العالمية والمحلية ذات التصنيفات المختلفة
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
                        // No countries needed here for movies, handled by filters
                        mediaType="movie"
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
  // const year = searchParams?.year as string | undefined; // Example for further specificity

  let pageTitle = `أفلام | ${siteName}`;
  let pageDescription = `استكشف أحدث الأفلام العالمية والعربية بتصنيفات وفئات متنوعة على ${siteName}.`;
  let canonicalUrl = `${SITE_URL}/movies`;

  const queryForPage = new URLSearchParams();
  if (genreId) queryForPage.set('genre', genreId);
  // if (year) queryForPage.set('year', year);
  
  if (queryForPage.toString()) {
    canonicalUrl += `?${queryForPage.toString()}`;
  }

  let genreName: string | undefined;
  if (genreId) {
    const allGenres = await getMovieGenres();
    const foundGenre = allGenres.find(g => g.id.toString() === genreId);
    if (foundGenre) {
        genreName = foundGenre.name;
        pageTitle = `أفلام ${genreName} | ${siteName}`;
        pageDescription = `تصفح أفضل أفلام ${genreName} المتاحة للمشاهدة والتحميل على ${siteName}. ${pageDescription}`;
    }
  }

  // Fetch a sample of movies for JSON-LD
  const sampleFilters: MediaFilterType = { page: 1, with_genres: genreId };
  const sampleMovieData = await discoverMovies(sampleFilters);
  const sampleMovies = sampleMovieData.results.slice(0, 5);

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    publisher: { '@id': `${SITE_URL}/#organization` },
    ...(sampleMovies.length > 0 && {
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: sampleMovies.map((movie, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'Movie',
                    name: movie.title,
                    url: `${SITE_URL}/movies/${slugify(movie.title)}-${movie.id}`,
                    image: movie.poster_path ? getImageUrl(movie.poster_path) : undefined,
                    datePublished: movie.release_date,
                    ...(movie.vote_average && movie.vote_count && movie.vote_count > 0 && {
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue: movie.vote_average.toFixed(1),
                            bestRating: '10',
                            ratingCount: movie.vote_count.toString(),
                        },
                    }),
                }
            })),
        },
    }),
  };

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'أفلام', item: `${SITE_URL}/movies` },
  ];
  if (genreName && genreId) {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: genreName, item: `${SITE_URL}/movies?genre=${genreId}` });
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  const ogImageUrl = new URL(`${SITE_URL}/api/og`);
  ogImageUrl.searchParams.set('title', pageTitle);
  ogImageUrl.searchParams.set('description', pageDescription.substring(0,100));
  ogImageUrl.searchParams.set('type', 'movie-list');

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