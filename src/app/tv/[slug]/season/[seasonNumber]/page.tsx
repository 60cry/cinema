import {
    getSeasonDetails,
    getTvShowDetails,
    getImageUrl,
    POSTER_SIZE,
    // BACKDROP_SIZE, // Unused
    Episode
} from "@/lib/tmdb";
import { notFound } from 'next/navigation';
import type { Metadata/*, ResolvingMetadata*/ } from 'next'; // Comment out unused ResolvingMetadata
import Image from 'next/image';
import { Star } from 'lucide-react';
import Link from "next/link";
import { SignJWT } from 'jose';
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/Breadcrumbs"; // Import Breadcrumbs

export const runtime = 'edge';
export const revalidate = 3600; // 1 hour in seconds

// Define props using the standard Next.js structure
type PageProps = {
    params: Promise<{ 
        slug: string; 
        seasonNumber: string; 
    }>; // Updated params to be a Promise
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // Updated searchParams to be a Promise (optional)
};

// --- Helper Functions ---
function extractIdFromSlug(slug: string): number | null {
    const match = slug.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

function parseSeasonNumber(seasonNumber: string): number | null {
    const num = parseInt(seasonNumber, 10);
    return isNaN(num) ? null : num;
}

// --- Metadata Generation ---
export async function generateMetadata(
  { params: paramsPromise }: PageProps // Use PageProps, destructure and rename params
  // parent: ResolvingMetadata // Unused
): Promise<Metadata> {
  const params = await paramsPromise; // Await the promise
  const slug = params.slug;
  const seasonNumberStr = params.seasonNumber;
  const tvId = extractIdFromSlug(slug);
  const seasonNumber = parseSeasonNumber(seasonNumberStr);

  if (!tvId || seasonNumber === null) {
    return { title: 'Season Not Found' };
  }

  try {
    // Fetch both TV show and season details for richer metadata
    const [tvShow, season] = await Promise.all([
        getTvShowDetails(tvId),
        getSeasonDetails(tvId, seasonNumber)
    ]);

    if (!tvShow || !season) { // Ensure both show and season are fetched
        return { title: 'Season or TV Show Not Found' };
    }

    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب';
    const mediaTypePrefix = tvShow.genres?.some(g => g.id === 16) ? 'انمي' : 'مسلسل';
    const seasonDisplayName = season.name || `الموسم ${seasonNumber}`;

    const title = `مشاهدة ${mediaTypePrefix} ${tvShow.name} ${seasonDisplayName} مترجم كامل`;
    const description = season.overview || `جميع حلقات ${mediaTypePrefix} ${tvShow.name} - ${seasonDisplayName} مترجمة اون لاين بجودة عالية. ${tvShow.overview || ''}`;
    const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
    const pageUrl = `${siteUrl}/${tvShow.genres?.some(g => g.id === 16) ? 'anime' : 'tv'}/${slug}/season/${seasonNumberStr}`;

    // Determine base image for OG API
    let baseImageForOg = getImageUrl(season.poster_path, 'w780');
    if (!baseImageForOg) {
        baseImageForOg = getImageUrl(tvShow.poster_path, 'w780');
    }
    if (!baseImageForOg) {
        baseImageForOg = getImageUrl(tvShow.backdrop_path, 'w1280');
    }

    const mediaTypeForOg = tvShow.genres?.some(g => g.id === 16) ? 'anime' : 'tv';

    // Create dynamic OG image URL
    const ogImageUrl = new URL(`${siteUrl}/api/og`);
    ogImageUrl.searchParams.append('title', title);
    ogImageUrl.searchParams.append('description', description.substring(0, 150)); // Keep description for OG short
    ogImageUrl.searchParams.append('type', mediaTypeForOg);
    if (tvShow.first_air_date) { // Add year if available from parent show
         const year = new Date(tvShow.first_air_date).getFullYear();
         ogImageUrl.searchParams.append('year', year.toString());
    }
    if (season.vote_average && season.vote_average > 0) { // Use season vote_average if available
        ogImageUrl.searchParams.append('rating', season.vote_average.toFixed(1));
    } else if (tvShow.vote_average) {
        ogImageUrl.searchParams.append('rating', tvShow.vote_average.toFixed(1));
    }

    if (baseImageForOg) {
        ogImageUrl.searchParams.append('image', baseImageForOg);
    }
    // Fallback is handled by /api/og

    const metadataResult: Metadata = {
      title: `${title} | ${siteName}`,
      description: description.substring(0, 160),
      alternates: { // Add canonical URL for seasons
        canonical: pageUrl,
      },
      openGraph: {
        title: `${title} | ${siteName}`,
        description: description.substring(0, 160),
        images: [
          {
            url: ogImageUrl.toString(),
            width: 1200,
            height: 630,
            alt: title,
          }
        ], 
        type: 'video.episode', // A season can be a collection of episodes
        url: pageUrl,
        siteName: siteName,
      },
      twitter: { // Add Twitter card for seasons
        card: 'summary_large_image',
        title: `${title} | ${siteName}`,
        description: description.substring(0, 160),
        images: [ogImageUrl.toString()],
      }
    };

    return metadataResult;

  } catch (error) {
    console.error("Error fetching metadata for season:", tvId, seasonNumber, error);
    return { title: 'Error loading season' };
  }
}

// --- Components ---

async function EpisodeItem({ episode, tvId, mediaTypeForToken }: { episode: Episode, tvId: number, mediaTypeForToken: 'tv' | 'anime' }) {
    const imageUrl = getImageUrl(episode.still_path, 'w300');

    let watchToken = '';
    if (process.env.JWT_SECRET && tvId) {
        const payload = {
            mediaType: mediaTypeForToken,
            id: tvId,
            season: episode.season_number,
            episode: episode.episode_number
        };
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        watchToken = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('3h')
            .sign(secret);
    } else {
        if (!process.env.JWT_SECRET) console.warn('JWT_SECRET is not defined for EpisodeItem.');
        if (!tvId) console.warn('tvId is not defined for EpisodeItem.');
    }

    return (
        <div className="flex flex-col sm:flex-row items-start gap-4 p-4 border-b last:border-b-0">
            <div className="flex-shrink-0 w-full sm:w-48">
                <div className="aspect-video relative bg-muted rounded overflow-hidden">
                    {imageUrl ? (
                        <Image 
                            src={imageUrl}
                            alt={`Still from ${episode.name}`}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 640px) 100vw, 192px"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No Image
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-grow">
                <h4 className="text-lg font-semibold mb-1">
                    {episode.episode_number}. {episode.name}
                </h4>
                {episode.air_date && (
                    <p className="text-sm text-muted-foreground mb-2">Air Date: {episode.air_date}</p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{episode.overview}</p>
                {episode.vote_average > 0 && (
                    <span className="flex items-center gap-1 w-fit rounded-md border px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                        <Star className="w-3 h-3 fill-current" />
                        {episode.vote_average.toFixed(1)}
                    </span>
                )}
                {watchToken && (
                    <Link href={`/watch/${watchToken}`} passHref className="mt-3 block">
                        <button className="px-4 py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50">
                            شاهد الحلقة
                        </button>
                    </Link>
                )}
            </div>
        </div>
    );
}


// --- Page Component ---
export default async function SeasonDetailPage(
    { params: paramsPromise }: PageProps // Use PageProps, destructure and rename params
) {
    const params = await paramsPromise; // Await the promise
    const slug = params.slug;
    const seasonNumberStr = params.seasonNumber;
    const tvId = extractIdFromSlug(slug);
    const seasonNumber = parseSeasonNumber(seasonNumberStr);

    if (!tvId || seasonNumber === null) {
        notFound();
    }

    try {
        // Fetch both TV show and season details 
        const [tvShow, season] = await Promise.all([
            getTvShowDetails(tvId).catch(err => { 
                console.error("Failed to fetch TV Show details for season page:", tvId, err);
                return null; // Handle error gracefully
            }),
            getSeasonDetails(tvId, seasonNumber)
        ]);

        // If TV show details failed but season details succeeded, we might still render but without the show name
        if (!season) { // If season fetch failed, definitely notFound
             throw new Error("Season details not found.");
        }

        const tvShowName = tvShow?.name || 'هذا المسلسل';
        const tvShowYear = tvShow?.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : null;
        const isAnime = tvShow?.genres?.some(g => g.id === 16);
        const parentCategoryLabel = isAnime ? "انمي" : "مسلسلات";
        const parentCategoryBaseLink = isAnime ? "/anime" : "/tv";
        const parentShowDetailLink = `${parentCategoryBaseLink}/${slug}`;
        const parentMediaPrefix = isAnime ? "مشاهدة انمي" : "مشاهدة مسلسل";

        const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
        const currentPageUrl = `${siteUrl}/tv/${slug}/season/${seasonNumberStr}`;
        const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب';
        const tvShowPageUrl = `${siteUrl}/${isAnime ? 'anime' : 'tv'}/${slug}`;
        const seasonDisplayName = season.name || `الموسم ${seasonNumber}`;
        const mediaTypeName = isAnime ? 'انمي' : 'مسلسل';
        const seasonPosterUrl = getImageUrl(season.poster_path, POSTER_SIZE);
        const seoText = `شاهد وحمل جميع حلقات الموسم ${seasonNumber} من ${mediaTypeName} ${tvShowName} مترجم اون لاين بجودة HD.`;

        let seasonWatchToken = '';
        const mediaTypeForToken: 'tv' | 'anime' = isAnime ? 'anime' : 'tv';

        if (process.env.JWT_SECRET && tvId && seasonNumber !== null && season.episodes.length > 0) {
            const payload = {
                mediaType: mediaTypeForToken,
                id: tvId,
                season: seasonNumber,
                episode: season.episodes[0].episode_number
            };
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            seasonWatchToken = await new SignJWT(payload)
                .setProtectedHeader({ alg: 'HS256' })
                .setExpirationTime('3h')
                .sign(secret);
        }

        const breadcrumbItems: BreadcrumbItem[] = [
            { label: "الرئيسية", href: "/" },
            { label: parentCategoryLabel, href: parentCategoryBaseLink },
            {
                label: `${parentMediaPrefix} ${tvShowName}${tvShowYear ? ` (${tvShowYear})` : ''} مترجم`,
                href: parentShowDetailLink
            },
            {
                label: seasonDisplayName,
                href: currentPageUrl,
                isCurrent: true,
            },
        ];

        const tvSeasonJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'TVSeason',
            name: seasonDisplayName,
            seasonNumber: seasonNumber.toString(),
            url: currentPageUrl,
            image: season.poster_path ? getImageUrl(season.poster_path, 'w780') : (tvShow?.poster_path ? getImageUrl(tvShow.poster_path, 'w780') : undefined),
            datePublished: season.air_date,
            numberOfEpisodes: season.episodes?.length.toString(),
            partOfSeries: {
                '@type': 'TVSeries',
                name: tvShowName,
                url: tvShowPageUrl,
            },
            episode: season.episodes?.map(ep => ({
                '@type': 'TVEpisode',
                name: ep.name || `الحلقة ${ep.episode_number}`,
                episodeNumber: ep.episode_number.toString(),
                description: ep.overview,
                image: ep.still_path ? getImageUrl(ep.still_path, 'w300') : undefined,
                url: `${currentPageUrl}#episode-${ep.episode_number}`,
            })) || [],
        };

        const faqSchema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
                {
                    '@type': 'Question',
                    name: `كم عدد حلقات ${seasonDisplayName} من ${mediaTypeName} ${tvShowName}؟`,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: `يحتوي ${seasonDisplayName} من ${mediaTypeName} ${tvShowName} على ${season.episodes?.length || 'عدة'} حلقات.`,
                    },
                },
                {
                    '@type': 'Question',
                    name: `كيف يمكنني مشاهدة ${seasonDisplayName} من ${tvShowName} مترجم؟`,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: `يمكنك مشاهدة جميع حلقات ${seasonDisplayName} مترجمة وبجودة عالية على موقع ${siteName}.`,
                    },
                },
            ],
        };

        const jsonLdGraph = {
            '@context': 'https://schema.org',
            '@graph': [tvSeasonJsonLd, faqSchema]
        };

        return (
            <div className="container mx-auto px-4 py-8">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
                />
                
                {/* Season Header */}
                <div className="mb-8 flex flex-col sm:flex-row items-start gap-6">
                   <div className="flex-shrink-0 w-full sm:w-48 md:w-60">
                        {seasonPosterUrl ? (
                            <Image 
                                src={seasonPosterUrl}
                                alt={`${season.name || `Season ${seasonNumber}`} Poster`}
                                width={500}
                                height={750}
                                className="rounded-lg shadow-md w-full h-auto"
                                sizes="(max-width: 639px) 90vw, (max-width: 767px) 192px, 240px"
                                priority
                            />
                        ) : (
                             <div className="aspect-[2/3] w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                No Poster
                            </div>
                        )}
                    </div>
                    <div className="flex-grow">
                        <h1 className="text-3xl font-bold mb-2">{season.name || `Season ${season.season_number}`}</h1>
                        {season.air_date && (
                            <p className="text-muted-foreground mb-1">First Aired: {season.air_date}</p>
                        )}
                        <p className="text-muted-foreground mb-3">{season.episodes.length} Episodes</p>
                        <p className="text-base leading-relaxed">{season.overview}</p>
                        {/* Watch Season Button */}
                        {seasonWatchToken && (
                            <Link href={`/watch/${seasonWatchToken}`} passHref className="mt-4 block">
                                <button className="px-4 py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50">
                                    شاهد الموسم (الحلقة الأولى)
                                </button>
                            </Link>
                        )}
                         {/* Link back to main show page */}
                         <Link href={`/tv/${slug}`} className="text-sm text-primary hover:underline mt-4 inline-block">
                             &laquo; Back to Show Overview
                         </Link>
                    </div>
                </div>

                {/* Dynamic SEO Text Block */}
                <p className="text-lg text-primary font-semibold mb-6">
                    {seoText}
                </p>

                {/* Episodes List */}
                <div className="border rounded-lg overflow-hidden">
                     <h2 className="text-xl font-semibold p-4 bg-muted/50 border-b">Episodes</h2>
                     {season.episodes.length > 0 ? (
                         season.episodes.map(episode => (
                             <EpisodeItem key={episode.id} episode={episode} tvId={tvId} mediaTypeForToken={mediaTypeForToken} />
                         ))
                     ) : (
                         <p className="p-4 text-muted-foreground">No episode information available for this season.</p>
                     )}
                </div>
                <Breadcrumbs items={breadcrumbItems} className="mb-4 sm:mb-6" /> 

            </div> 
        );
    } catch (error) {
        console.error("Error fetching season details for page:", tvId, seasonNumber, error);
        notFound();
    }
} 