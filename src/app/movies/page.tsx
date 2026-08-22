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
        with_origin_country: searchParams.country as string | undefined, 
    };

    const [initialData, genres, languages] = await Promise.all([
        discoverMovies(filters),
        getMovieGenres(),
        getLanguages()
    ]);

    const genreId = searchParams?.genre as string | undefined;
    const foundGenre = genreId ? genres.find(g => g.id.toString() === genreId) : undefined;
    const genreName = foundGenre?.name;
    const pageTitle = genreName ? `أفلام ${genreName}` : 'أفلام';
    const pageDescription = genreName 
        ? `تصفح أفضل أفلام ${genreName} المتاحة للمشاهدة والتحميل بجودة عالية على سينما العرب.` 
        : 'استكشف أحدث الأفلام العالمية والعربية بتصنيفات وفئات متنوعة على سينما العرب.';
    const canonicalUrl = genreId ? `${SITE_URL}/movies?genre=${genreId}` : `${SITE_URL}/movies`;

    const sampleMovies = initialData.results.slice(0, 8);

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
                        {genreName ? `أفلام ${genreName} جديدة للمشاهدة والتحميل` : 'أفلام جديدة للمشاهدة والتحميل'}
                    </h1>
                    <p className="text-base sm:text-lg text-muted-foreground mt-2">
                        {genreName 
                            ? `تصفح أحدث وأفضل أفلام ${genreName} العالمية والمترجمة`
                            : 'تصفح مجموعتنا المتنوعة من الأفلام العالمية والمحلية ذات التصنيفات المختلفة'}
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

  let pageTitle = 'أفلام';
  let pageDescription = `استكشف أحدث الأفلام العالمية والعربية بتصنيفات وفئات متنوعة على ${siteName}.`;
  let canonicalUrl = `${SITE_URL}/movies`;

  const queryForPage = new URLSearchParams();
  if (genreId) queryForPage.set('genre', genreId);
  
  if (queryForPage.toString()) {
    canonicalUrl += `?${queryForPage.toString()}`;
  }

  let genreName: string | undefined;
  if (genreId) {
    const allGenres = await getMovieGenres();
    const foundGenre = allGenres.find(g => g.id.toString() === genreId);
    if (foundGenre) {
        genreName = foundGenre.name;
        pageTitle = `أفلام ${genreName}`;
        pageDescription = `تصفح أفضل أفلام ${genreName} المتاحة للمشاهدة والتحميل على ${siteName}. ${pageDescription}`;
    }
  }

  const ogImageUrl = new URL(`${SITE_URL}/api/og`);
  ogImageUrl.searchParams.set('title', genreName ? `أفلام ${genreName}` : 'أفلام');
  ogImageUrl.searchParams.set('description', pageDescription.substring(0,100));
  ogImageUrl.searchParams.set('type', 'movie-list');

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