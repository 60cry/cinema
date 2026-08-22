import Link from 'next/link';
import Image from 'next/image';
import { Movie, TvShow, getImageUrl } from "@/lib/tmdb";
import { Star } from 'lucide-react';
import { slugify } from '@/lib/utils';

// Helper function to format runtime (e.g., 125 => 2h 5m)
function formatRuntime(minutes: number): string {
    if (!minutes || minutes <= 0) return '';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    let formatted = '';
    if (hours > 0) {
        formatted += `${hours}س `;
    }
    if (remainingMinutes > 0) {
        formatted += `${remainingMinutes}د`;
    }
    return formatted.trim();
}

interface MediaItemProps {
    item: Movie | TvShow;
    type: 'movie' | 'tv' | 'anime';
    className?: string;
}

export function MediaItemCard({ item, type, className }: MediaItemProps) {
    const originalTitle = (item as Movie).title || (item as TvShow).name;
    const dateString = type === 'movie' ? (item as Movie).release_date : (item as TvShow).first_air_date;
    let year: number | null = null;
    if (dateString) {
        try {
            year = new Date(dateString).getFullYear();
            if (isNaN(year)) year = null;
        } catch {
            year = null;
        }
    }
    const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
    const imageUrl = getImageUrl(item.poster_path, 'w500');
    const runtime = type === 'movie' ? (item as Movie).runtime : undefined;
    const formattedRuntime = runtime ? formatRuntime(runtime) : null;
    
    const generatedSlug = slugify(originalTitle);
    const detailUrl = item.id ? `/${type === 'movie' ? 'movies' : (type === 'anime' ? 'anime' : 'tv')}/${generatedSlug}${year ? `-${year}` : ''}-${item.id}` : '#';

    let displayTitle = '';
    if (type === 'movie') {
        displayTitle = `مشاهدة فيلم ${originalTitle} مترجم`;
    } else { // Covers 'tv' and 'anime'
        // Check genre_ids if type is 'tv' and item has genre_ids
        const hasAnimationGenreId = type === 'tv' && item.genre_ids?.includes(16);

        if (type === 'anime' || hasAnimationGenreId) {
            displayTitle = `مشاهدة انمي ${originalTitle} مترجم`;
        } else { // Regular TV show
            displayTitle = `مشاهدة مسلسل ${originalTitle} مترجم`;
        }
    }
    
    return (
        <div className={`overflow-hidden bg-transparent group ${className || ''}`}>
            {/* Hidden structured data for SEO */}
            {originalTitle && item.id && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': type === 'movie' ? 'Movie' : 'TVSeries',
                            name: originalTitle,
                            potentialAction: {
                                '@type': 'WatchAction',
                                target: {
                                    '@type': 'EntryPoint',
                                    urlTemplate: detailUrl,
                                },
                            },
                        }),
                    }}
                />
            )}
            
            <div className="p-0 relative">
                <Link href={detailUrl} className="block w-full h-full aspect-[2/3] relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/40 border border-transparent transition-all duration-300">
                    {imageUrl ? (
                        <Image 
                            src={imageUrl} 
                            alt={`${displayTitle} - بوستر`} 
                            fill 
                            sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 15vw" 
                            priority={false} 
                            className="object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">لا توجد صورة</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {rating && parseFloat(rating) > 0 && (
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white rounded-full px-2 py-1 text-xs flex items-center gap-1 z-10">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span>{rating}</span>
                        </div>
                    )}
                    {formattedRuntime && (
                        <div className="absolute bottom-2 right-2 z-10 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-1.5 py-0.5 rounded">
                            {formattedRuntime}
                        </div>
                    )}
                </Link>
            </div>
            <div className="pt-3 text-center">
                <Link 
                    href={detailUrl} 
                    title={displayTitle} 
                    className="text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors line-clamp-1"
                >
                    {originalTitle}
                </Link>
                {year && (
                    <p className="text-xs text-gray-400 mt-1">{year}</p>
                )}
            </div>
        </div>
    );
} 