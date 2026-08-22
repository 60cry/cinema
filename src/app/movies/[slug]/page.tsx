import {
    getMovieDetails, 
    getMovieRecommendations, 
    getCollectionDetails,
    getImageUrl,
    MovieDetail,
    CollectionDetail,
    CrewMember as TmdbCrewMember,
    Video,
    Genre,
    CastMember,
} from "@/lib/tmdb";
import { slugify } from "@/lib/utils";
import { MediaDetail } from "@/components/media/MediaDetail";
import { RecommendedMedia } from "@/components/media/RecommendedMedia";
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

// Imports for SSR Comments
import { supabaseServer } from "@/lib/supabase";
import { buildCommentTree, type Comment } from "@/lib/comments";

// Enable ISR with a 1-hour revalidation period
export const runtime = 'edge';
export const revalidate = 3600; // 1 hour in seconds

// Define props using the standard Next.js structure
type PageProps = {
    params: Promise<{ slug: string }>; // params is now a Promise
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // searchParams also a Promise
};

// Function to extract ID from slug (implement robustly later)
function extractIdFromSlug(slug: string): number | null {
    const parts = slug?.split('-');
    if (!parts || parts.length < 2) return null;
    const idString = parts[parts.length - 1];
    const id = parseInt(idString, 10);
    return isNaN(id) ? null : id;
}

// Generate dynamic metadata for SEO
export async function generateMetadata(
  { params: paramsPromise }: PageProps, // Destructure and rename params, removed searchParams from destructuring
): Promise<Metadata> {
  const params = await paramsPromise; // Await the promise
  const slug = params.slug;
  const id = extractIdFromSlug(slug);
  if (!id) {
    return {
      title: 'فيلم غير موجود',
      description: 'الفيلم الذي تبحث عنه غير متوفر حالياً.',
    };
  }

  try {
    const movie = await getMovieDetails(id) as MovieDetail & { homepage?: string };
    if (!movie) throw new Error('Movie not found');

    const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online'; 
    const pageUrl = `${siteUrl}/movies/${slug}`;
    const title = movie.title;
    const description = movie.overview || `شاهد فيلم ${movie.title} بجودة عالية.`;
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
    const canonicalUrl = pageUrl;

    const posterUrl = movie.poster_path ? getImageUrl(movie.poster_path, 'w780') : undefined; // Higher res for social
    const backdropUrl = movie.backdrop_path ? getImageUrl(movie.backdrop_path, 'w1280') : undefined;

    // Create dynamic OG image URL with query parameters
    const ogImageUrl = new URL(`${siteUrl}/api/og`);
    ogImageUrl.searchParams.append('title', movie.title);
    if (year) {
      ogImageUrl.searchParams.append('year', year.toString());
    }
    if (movie.vote_average) {
      ogImageUrl.searchParams.append('rating', movie.vote_average.toFixed(1));
    }
    ogImageUrl.searchParams.append('type', 'movie');
    if (backdropUrl) {
      ogImageUrl.searchParams.append('image', backdropUrl);
    } else if (posterUrl) {
      ogImageUrl.searchParams.append('image', posterUrl);
    }

    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب';

    const metadata: Metadata = {
      title: `مشاهدة فيلم ${movie.title} مترجم اون لاين`,
      description: description.slice(0, 160),
      keywords: movie.genres?.map((g: Genre) => g.name).concat(['فيلم', movie.title, 'مشاهدة', 'تحميل', 'اون لاين', 'مترجم', 'قصة', String(year || '')]).filter(Boolean) as string[],
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: movie.title,
        description,
        type: 'video.movie',
        url: canonicalUrl,
        siteName: siteName,
        images: [
          {
            url: ogImageUrl.toString(), // Use the dynamic OG image URL
            width: 1200, // Standard OG image width
            height: 630, // Standard OG image height
            alt: title,
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `مشاهدة فيلم ${movie.title} مترجم اون لاين | ${siteName}`,
        description,
        images: [ogImageUrl.toString()],
      },
    };

    return metadata;
  } catch (error) {
    console.error("Error generating metadata for movie:", error);
    const initialParams = await paramsPromise;
    const slugForError = initialParams.slug;
    const pageUrl = `${process.env.CANONICAL_URL || 'https://cinema4arab.online'}/movies/${slugForError}`;
    return {
      title: 'خطأ',
      description: 'حدث خطأ أثناء جلب بيانات الفيلم.',
      alternates: { canonical: pageUrl },
    }; 
  }
}

// Helper function for fetching SSR comments
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
        console.error("Supabase error fetching comments:", commentsError);
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
        console.error("Supabase error fetching upvotes:", upvotesError);
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
    console.error('Error fetching SSR comments:', error);
    return [];
  }
}

// The actual page component
export default async function MovieDetailPage(
    { params: paramsPromise }: PageProps
) {
    try {
        const params = await paramsPromise;
        const slug = params.slug;
        const id = extractIdFromSlug(slug);

        if (!id) {
            notFound();
        }

        const movie = await getMovieDetails(id) as MovieDetail & { homepage?: string };
        if (!movie) {
            notFound();
        }

        const collectionId = movie.belongs_to_collection?.id;
        let collectionDetails: CollectionDetail | null = null;
        if (collectionId) {
            collectionDetails = await getCollectionDetails(collectionId);
        }

        const recommendations = await getMovieRecommendations(id);
        const ssrComments = await fetchSsrComments(movie.id, 'movie');

        const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
        const pageUrl = `${siteUrl}/movies/${slug}`;
        const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب';
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
        const posterUrl = movie.poster_path ? getImageUrl(movie.poster_path, 'w780') : undefined;
        const backdropUrl = movie.backdrop_path ? getImageUrl(movie.backdrop_path, 'w1280') : undefined;
        const director = movie.credits?.crew?.find((c: TmdbCrewMember) => c.job === 'Director');
        const trailerVideo = movie.videos?.results?.find((v: Video) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official)
                          ?? movie.videos?.results?.find((v: Video) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));

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

        const movieJsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Movie',
          '@id': `${pageUrl}#movie`,
          name: movie.title,
          alternateName: `مشاهدة فيلم ${movie.title}${year ? ` (${year})` : ''} مترجم`,
          description: movie.overview || `مشاهدة فيلم ${movie.title}${year ? ` (${year})` : ''} مترجم اون لاين بجودة عالية.`,
          url: pageUrl,
          sameAs: movie.homepage ? [movie.homepage] : [],
          image: posterUrl || backdropUrl,
          datePublished: movie.release_date,
          genre: movie.genres?.map((g: Genre) => g.name) || [],
          keywords: movie.keywords?.keywords?.map((k: { id: number; name: string }) => k.name).join(', ') || movie.genres?.map((g: Genre) => g.name).join(', ') || '',
          ...(director && {
            director: {
              '@type': 'Person',
              '@id': `${siteUrl}/director/${slugify(director.name || '')}-${director.id}#person`,
              name: director.name,
              url: `${siteUrl}/director/${slugify(director.name || '')}-${director.id}`
            }
          }),
          ...(movie.credits?.cast && movie.credits.cast.length > 0 && {
            actor: movie.credits.cast.slice(0, 10).map((actor: CastMember) => ({
              '@type': 'Person',
              '@id': `${siteUrl}/person/${slugify(actor.name)}-${actor.id}#person`,
              name: actor.name,
              url: `${siteUrl}/person/${slugify(actor.name)}-${actor.id}`
            })),
          }),
          ...(movie.vote_average && movie.vote_count && movie.vote_count > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: movie.vote_average.toFixed(1).toString(),
              bestRating: '10',
              ratingCount: movie.vote_count.toString(),
            },
          }),
          ...(trailerVideo && trailerVideo.key && {
            trailer: {
              '@type': 'VideoObject',
              name: `Official Trailer for ${movie.title}`,
              description: `Watch the official trailer for ${movie.title}`,
              thumbnailUrl: `https://i.ytimg.com/vi/${trailerVideo.key}/hqdefault.jpg`,
              embedUrl: `https://www.youtube.com/embed/${trailerVideo.key}`,
              uploadDate: movie.release_date,
            }
          }),
          ...(reviewsSchema.length > 0 && { review: reviewsSchema }),
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
                name: `شاهد ${movie.title} الآن`,
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
              name: `كيف يمكنني مشاهدة فيلم ${movie.title} مترجم؟`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `يمكنك مشاهدة فيلم ${movie.title} مترجم عبر موقعنا ${siteName} مباشرة. نوفر لك روابط مشاهدة متعددة بجودات مختلفة لتناسب سرعة الإنترنت لديك.`,
              },
            },
            {
              '@type': 'Question',
              name: `هل فيلم ${movie.title} متاح للتحميل؟`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `نعم، بالإضافة إلى المشاهدة المباشرة، يمكنك أيضاً تحميل فيلم ${movie.title} من خلال الروابط المتوفرة على صفحة الفيلم في موقعنا ${siteName}.`,
              },
            },
            {
              '@type': 'Question',
              name: `ما هي قصة فيلم ${movie.title}؟`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: movie.overview || `تدور أحداث فيلم ${movie.title} حول قصة مشوقة ومثيرة. تفضل بقراءة النبذة والتقييم على الموقع.`,
              },
            },
            {
              '@type': 'Question',
              name: `متى تم إصدار فيلم ${movie.title}؟`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: movie.release_date ? `تم إصدار فيلم ${movie.title} في تاريخ ${new Date(movie.release_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}.` : 'تاريخ إصدار الفيلم متاح في صفحة العمل.',
              },
            },
          ],
        };

        const breadcrumbs = [
          { label: "الرئيسية", href: "/" },
          { label: "الأفلام", href: "/movies" },
          { label: movie.title, href: `/movies/${slug}` },
        ];

        const fullJsonLdGraph = {
          '@context': 'https://schema.org',
          '@graph': [
            movieJsonLd,
            faqSchema,
          ],
        };

        return (
            <div className="min-h-screen">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(fullJsonLdGraph) }}
                />
                <div className="container mx-auto px-4 pt-4 pb-2">
                    <Breadcrumbs items={breadcrumbs} />
                </div>
                <MediaDetail 
                    item={movie} 
                    type="movie" 
                    initialComments={ssrComments}
                    recommendedMediaContent={
                        recommendations.length > 0 ? (
                            <RecommendedMedia items={recommendations} title="قد يعجبك أيضاً" itemType="movie" />
                        ) : null
                    }
                    collectionPartIds={collectionDetails ? new Set(collectionDetails.parts.map(part => part.id)) : new Set()}
                    collectionName={movie.belongs_to_collection?.name}
                />
            </div>
        );
    } catch (error) {
        console.error(`Error in MovieDetailPage for slug promise:`, paramsPromise, error);
        notFound();
    }
} 