import { getTvShowDetails, getTvShowRecommendations, getImageUrl } from "@/lib/tmdb";
import { slugify } from "@/lib/utils";
import { MediaDetail } from "@/components/media/MediaDetail";
import { RecommendedMedia } from "@/components/media/RecommendedMedia";
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { supabaseServer } from "@/lib/supabase";
import { buildCommentTree, type Comment } from "@/lib/comments";

// Enable ISR with a 1-hour revalidation period
export const runtime = 'edge';
export const revalidate = 3600; // 1 hour in seconds

// Define props using the standard Next.js structure
type PageProps = {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function extractIdFromSlug(slug: string): number | null {
    const match = slug.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

// Generate dynamic metadata for SEO
export async function generateMetadata(
  { params: paramsPromise }: PageProps
): Promise<Metadata> {
  const params = await paramsPromise;
  const slug = params.slug;
  const id = extractIdFromSlug(slug);
  if (!id) {
    return { title: 'Anime Not Found' };
  }

  try {
    const tvShow = await getTvShowDetails(id); 
    if (!tvShow) {
        return { title: 'Anime Not Found' };
    }
    
    const year = tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : null;
    const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
    
    const isStrictlyAnime = tvShow.genres?.some(g => g.id === 16);
    const pageUrl = `${siteUrl}/anime/${slug}`; 

    const posterUrl = tvShow.poster_path ? getImageUrl(tvShow.poster_path, 'w780') : undefined;
    const backdropUrl = tvShow.backdrop_path ? getImageUrl(tvShow.backdrop_path, 'w1280') : undefined;

    const mediaTypeForOg = isStrictlyAnime ? 'anime' : 'tv'; // For OG image type param

    // Create dynamic OG image URL with query parameters
    const ogImageUrl = new URL(`${siteUrl}/api/og`);
    ogImageUrl.searchParams.append('title', tvShow.name);
    if (year) {
      ogImageUrl.searchParams.append('year', year.toString());
    }
    if (tvShow.vote_average) {
      ogImageUrl.searchParams.append('rating', tvShow.vote_average.toFixed(1));
    }
    ogImageUrl.searchParams.append('type', mediaTypeForOg); 
    if (backdropUrl) {
      ogImageUrl.searchParams.append('image', backdropUrl);
    } else if (posterUrl) {
      ogImageUrl.searchParams.append('image', posterUrl);
    }
    
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب';
    const titlePrefix = isStrictlyAnime ? 'انمي' : 'مسلسل'; 
    const pageTitle = `مشاهدة ${titlePrefix} ${tvShow.name}${year ? ` (${year})` : ''} مترجم`;
    const pageDescription = `شاهد وحمل جميع حلقات ${titlePrefix} ${tvShow.name} ${year ? `(${year})` : ''} مترجم اون لاين بجودة عالية. ${tvShow.overview?.substring(0, 120) || `اكتشف قصة ${titlePrefix} وأبطاله الآن.`}`;

    const metadata: Metadata = {
      title: pageTitle,
      description: pageDescription,
      keywords: tvShow.genres?.map(g => g.name).concat([titlePrefix, tvShow.name, 'حلقات', 'مواسم', 'مشاهدة', 'تحميل', 'اون لاين', 'مترجم', String(year || '')]).filter(Boolean) as string[],
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title: `${pageTitle} | ${siteName}`,
        description: `شاهد وحمل جميع حلقات ${titlePrefix} ${tvShow.name} مترجم اون لاين. ${tvShow.overview?.substring(0, 100) || ''}`,
        url: pageUrl,
        siteName: siteName,
        images: [
          {
            url: ogImageUrl.toString(), 
            width: 1200,
            height: 630,
            alt: tvShow.name,
          }
        ],
        type: 'video.tv_show',
        locale: 'ar_SA',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${pageTitle} | ${siteName}`,
        description: `شاهد وحمل جميع حلقات ${titlePrefix} ${tvShow.name} مترجم اون لاين. ${tvShow.overview?.substring(0, 100) || ''}`,
        images: [ogImageUrl.toString()], 
      },
    };

    return metadata;

  } catch (error) {
    console.error("Error fetching metadata for anime:", id, error);
    const initialParams = params ? params : (paramsPromise ? await paramsPromise : { slug: 'unknown'});
    const slugForError = initialParams.slug;
    const errorPageUrl = `${process.env.CANONICAL_URL || 'https://cinema4arab.online'}/anime/${slugForError}`;
    return { 
      title: 'خطأ في تحميل الأنمي', 
      description: 'لم نتمكن من تحميل بيانات هذا الأنمي. الرجاء المحاولة مرة أخرى.', 
      alternates: { canonical: errorPageUrl },
    };
  }
}

// Helper function for fetching full SSR comments for display
async function fetchSsrComments(
  mediaId: number | string,
  mediaType: 'movie' | 'tv' | 'anime'
): Promise<Comment[]> {
  if (!mediaId || !mediaType) return [];

  try {
    const { data: commentsData, error: commentsError } = await supabaseServer
      .from('comments')
      .select('id, created_at, name, content, rating, parent_id')
      .eq('media_id', mediaId.toString())
      .eq('media_type', mediaType)
      .eq('approved', true);

    if (commentsError) {
        console.error(`Supabase error fetching comments for ${mediaType}:`, commentsError);
        throw commentsError;
    }
    if (!commentsData) return [];

    const commentIds = commentsData.map(c => c.id);
    const upvoteCounts: { [key: string]: number } = {};

    if (commentIds.length > 0) {
      const { data: upvotesData, error: upvotesError } = await supabaseServer
        .from('comment_upvotes')
        .select('comment_id')
        .in('comment_id', commentIds);

      if (upvotesError) {
        console.error(`Supabase error fetching upvotes for ${mediaType}:`, upvotesError);
      } else if (upvotesData) {
        upvotesData.forEach((upvote: { comment_id: string }) => {
          upvoteCounts[upvote.comment_id] = (upvoteCounts[upvote.comment_id] || 0) + 1;
        });
      }
    }
    
    const processedFlatComments = commentsData.map(comment => {
      return {
        ...comment,
        rating: comment.rating === undefined ? null : comment.rating,
        parent_id: comment.parent_id === undefined ? null : comment.parent_id,
        upvote_count: upvoteCounts[comment.id] || 0,
        user_has_upvoted: false, 
        replies: [] 
      } as Comment;
    });

    return buildCommentTree(processedFlatComments);
  } catch (error: unknown) {
    console.error(`Error fetching SSR comments for ${mediaType}:`, error);
    return [];
  }
}

// The actual page component
export default async function AnimeDetailPage(
    { params: paramsPromise }: PageProps 
) {
    const params = await paramsPromise; 
    const slug = params.slug;
    const id = extractIdFromSlug(slug);

    if (!id) {
        notFound(); 
    }

    try {
        const preliminaryTvShowDetailsForType = await getTvShowDetails(id); 
        if (!preliminaryTvShowDetailsForType) {
            notFound();
        }
        const mediaTypeForCommentsAndDetail = 'anime'; 

        const [tvShow, recommendations, ssrComments] = await Promise.all([
            preliminaryTvShowDetailsForType, 
            getTvShowRecommendations(id).catch(err => { console.error("Rec fetch failed:", err); return []; }),
            fetchSsrComments(id, mediaTypeForCommentsAndDetail) 
        ]);

        const year = tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : null;
        const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
        const pageUrl = `${siteUrl}/anime/${slug}`;
        const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب';

        const posterUrl = tvShow.poster_path ? getImageUrl(tvShow.poster_path, 'w780') : undefined;
        const backdropUrl = tvShow.backdrop_path ? getImageUrl(tvShow.backdrop_path, 'w1280') : undefined;

        const trailerVideo = tvShow.videos?.results?.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official)
                          ?? tvShow.videos?.results?.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));

        const creators = tvShow.created_by?.map((creator: { id: number; name: string; profile_path: string | null }) => ({
          '@type': 'Person',
          name: creator.name,
          url: `${siteUrl}/person/${slugify(creator.name)}-${creator.id}`
        }));

        const reviewsSchema = ssrComments
          .filter(comment => comment.rating && !comment.parent_id)
          .map(comment => ({
            '@type': 'Review',
            reviewRating: {
              '@type': 'Rating',
              ratingValue: String(comment.rating),
              bestRating: '10',
              worstRating: '1',
            },
            author: {
              '@type': 'Person',
              name: comment.name || 'مستخدم',
            },
            reviewBody: comment.content,
            datePublished: comment.created_at ? new Date(comment.created_at).toISOString().split('T')[0] : undefined,
          }));

        const animeJsonLd = {
          '@context': 'https://schema.org',
          '@type': 'TVSeries',
          '@id': `${pageUrl}#anime`,
          name: `مشاهدة انمي ${tvShow.name}${year ? ` (${year})` : ''} مترجم`,
          description: `مشاهدة انمي ${tvShow.name}${year ? ` (${year})` : ''} مترجم. ${tvShow.overview || `شاهد جميع حلقات ومواسم انمي ${tvShow.name} اون لاين مترجمة بجودة عالية.`}`,
          url: pageUrl,
          image: posterUrl || backdropUrl,
          datePublished: tvShow.first_air_date,
          numberOfSeasons: tvShow.number_of_seasons?.toString(),
          numberOfEpisodes: tvShow.number_of_episodes?.toString(), 
          genre: tvShow.genres?.map(g => g.name) || [],
          keywords: tvShow.keywords?.results?.map((k: { id: number; name: string }) => k.name).join(', ') || tvShow.genres?.map(g => g.name).join(', ') || '',
          ...(creators && creators.length > 0 && { creator: creators }),
          ...(tvShow.credits?.cast && tvShow.credits.cast.length > 0 && {
            actor: tvShow.credits.cast.slice(0, 10).map(actor => ({
              '@type': 'Person',
              name: actor.name,
              url: `${siteUrl}/person/${slugify(actor.name)}-${actor.id}`
            })),
          }),
          ...(tvShow.vote_average && tvShow.vote_count && tvShow.vote_count > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: tvShow.vote_average.toFixed(1).toString(),
              bestRating: '10',
              ratingCount: tvShow.vote_count.toString(),
            },
          }),
          ...(trailerVideo && trailerVideo.key && {
            trailer: {
              '@type': 'VideoObject',
              name: `Official Trailer for ${tvShow.name}`,
              description: `Watch the official trailer for ${tvShow.name}`,
              thumbnailUrl: `https://i.ytimg.com/vi/${trailerVideo.key}/hqdefault.jpg`,
              embedUrl: `https://www.youtube.com/embed/${trailerVideo.key}`,
              uploadDate: tvShow.first_air_date, 
            }
          }),
          ...(reviewsSchema.length > 0 && { review: reviewsSchema }),
          containsSeason: tvShow.seasons?.map(season => ({
            '@type': 'Season',
            name: season.name || `الموسم ${season.season_number}`,
            seasonNumber: season.season_number?.toString(),
            numberOfEpisodes: season.episode_count?.toString(),
            datePublished: season.air_date, 
            url: `${pageUrl}/season/${season.season_number}`,
          })) || [],
          potentialAction: {
            '@type': 'WatchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: pageUrl, 
              inLanguage: 'ar',
              actionPlatform: [
                'http://schema.org/DesktopWebPlatform',
                'http://schema.org/IOSPlatform',
                'http://schema.org/AndroidPlatform'
              ]
            },
            expectsAcceptanceOf: {
                '@type': 'Offer',
                name: `شاهد حلقات ${tvShow.name}`,
                availability: 'https://schema.org/InStock',
                price: '0', 
                priceCurrency: 'USD' 
            }
          },
        };

        const faqSchema = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: `كيف يمكنني مشاهدة انمي ${tvShow.name} مترجم؟`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `يمكنك مشاهدة جميع حلقات انمي ${tvShow.name} مترجمة عبر موقعنا ${siteName}. نوفر لك تجربة مشاهدة ممتعة وبجودة عالية.`,
              },
            },
            {
              '@type': 'Question',
              name: `هل انمي ${tvShow.name} متاح للتحميل؟`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `نعم، بالإضافة إلى المشاهدة المباشرة، يمكنك تحميل جميع حلقات انمي ${tvShow.name} من خلال الروابط المتوفرة على موقعنا ${siteName}.`,
              },
            },
            {
              '@type': 'Question',
              name: `كم عدد مواسم وحلقات انمي ${tvShow.name}؟`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: tvShow.number_of_seasons ? `يتكون انمي ${tvShow.name} من ${tvShow.number_of_seasons} موسمًا.` : `تفاصيل مواسم وحلقات انمي ${tvShow.name} متوفرة على صفحة العمل.`,
              },
            },
            {
              '@type': 'Question',
              name: `متى تم عرض أول حلقة من انمي ${tvShow.name}؟`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: tvShow.first_air_date ? `تم عرض أول حلقة من انمي ${tvShow.name} في تاريخ ${new Date(tvShow.first_air_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}.` : 'تاريخ عرض أول حلقة متوفر على صفحة العمل.',
              },
            },
          ],
        };

        const breadcrumbItems: BreadcrumbItem[] = [
            { label: "الرئيسية", href: "/" },
            { label: "انمي", href: "/anime" },
            {
                label: `مشاهدة انمي ${tvShow.name}${year ? ` (${year})` : ''} مترجم`,
                href: pageUrl,
                isCurrent: true,
            },
        ];

        const jsonLdGraph = {
          '@context': 'https://schema.org',
          '@graph': [
            animeJsonLd,
            faqSchema,
          ],
        };

        return (
            <Suspense fallback={<div className="h-[60vh] min-h-[400px] w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse" />}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
                />
                <div className="container mx-auto px-4 pt-4 pb-2">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
                <MediaDetail
                    item={tvShow}
                    type={"anime"}
                    initialComments={ssrComments} 
                    recommendedMediaContent={
                        recommendations && recommendations.length > 0 ? (
                            <RecommendedMedia items={recommendations} title="قد يعجبك أيضاً" itemType={"anime"} />
                        ) : null
                    }
                />
            </Suspense>
        );
    } catch (error) {
        console.error("Error fetching anime details for page:", id, error);
        notFound(); 
    }
} 