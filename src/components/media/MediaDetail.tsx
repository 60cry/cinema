import Image from 'next/image';
import {
    MovieDetail,
    getImageUrl,
    POSTER_SIZE,
    BACKDROP_SIZE,
    Season,
    CastMember as TmdbCastMember,
    CrewMember as TmdbCrewMember,
    getCollectionDetails,
    CollectionDetail,
    Director,
    TvShow,
    Video as TmdbVideo,
} from "@/lib/tmdb";
import { 
    Star, 
    Clock, 
    Calendar, 
    Users, 
    Check, 
    ArrowUp, 
    ArrowDown, 
    Play, 
    Film, 
    Tv, 
    Sparkles, 
    DollarSign, 
    TrendingUp, 
    Clapperboard, 
    Layers, 
    HelpCircle, 
    Info,
    PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import { MediaItemCard } from '@/components/media/MediaItemCard';
import { ReactNode } from 'react';
import { SignJWT } from 'jose';
import { WatchlistButton } from '@/components/media/WatchlistButton';
import { CommentSection, Comment } from '@/components/comments';

interface ExtendedMovie extends MovieDetail {
    genres?: { id: number; name: string }[];
    credits?: {
        cast: TmdbCastMember[];
        crew: TmdbCrewMember[];
    };
    videos?: {
        results: TmdbVideo[];
    };
    tagline?: string;
    status?: string;
}

interface ExtendedTvShow extends TvShow {
    genres?: { id: number; name: string }[];
    episode_run_time?: number[];
    number_of_seasons?: number;
    number_of_episodes?: number;
    seasons?: Season[];
    credits?: {
        cast: TmdbCastMember[];
        crew?: TmdbCrewMember[];
    };
    videos?: {
        results: TmdbVideo[];
    };
    episode?: number;
    tagline?: string;
    status?: string;
    created_by?: { id: number; name: string; profile_path: string | null }[];
}

export interface MediaDetailProps {
    item: ExtendedMovie | ExtendedTvShow;
    type: 'movie' | 'tv' | 'anime';
    recommendedMediaContent?: ReactNode;
    initialComments?: Comment[];
    collectionPartIds?: Set<number>;
    collectionName?: string;
}

interface MainWatchTokenPayload {
    [key: string]: unknown;
    mediaType: 'movie' | 'tv' | 'anime';
    id: number;
    season?: number;
    episode?: number;
}

// Helper function to format runtime
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

// Helper function to format status in Arabic
function formatStatus(status: string | undefined): string | null {
    if (!status) return null;
    const statusMap: Record<string, string> = {
        'Released': 'تم العرض',
        'Returning Series': 'مستمر',
        'Ended': 'منتهي',
        'In Production': 'قيد الإنتاج',
        'Post Production': 'مرحلة ما بعد الإنتاج',
        'Planned': 'مخطط له',
        'Canceled': 'ملغي'
    };
    return statusMap[status] || status;
}

// Improved SeasonCard component
async function SeasonCard({ season, tvId, tvSlug, itemType }: { season: Season, tvId: number, tvSlug: string, itemType: 'tv' | 'anime' }) {
    const imageUrl = getImageUrl(season.poster_path, POSTER_SIZE);
    const seasonPath = tvSlug && tvId ? `/tv/${tvSlug}-${tvId}/season/${season.season_number}` : '#';
    const placeholderImage = "/placeholder-poster.png";

    let watchToken = '';
    if (process.env.JWT_SECRET) {
        const payload: MainWatchTokenPayload = {
            mediaType: itemType,
            id: tvId,
        };
        if (itemType === 'tv' || itemType === 'anime') {
            payload.season = season.season_number || 1;
            payload.episode = 1;
        }
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        watchToken = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('3h')
            .sign(secret);
    }

    return (
        <div className="group relative bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
            <Link href={seasonPath} className="block relative aspect-[2/3] overflow-hidden bg-muted">
                <Image
                    src={imageUrl || placeholderImage}
                    alt={`ملصق ${season.name || `الموسم ${season.season_number}`}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                    className="transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-white text-xs font-semibold flex items-center gap-1">
                        <PlayCircle className="w-4 h-4 text-primary" />
                        عرض الحلقات
                    </span>
                </div>
                {typeof season.episode_count === 'number' && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-black/70 backdrop-blur-md text-white border border-white/10">
                        {season.episode_count} حلقة
                    </span>
                )}
            </Link>
            <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {season.name || `الموسم ${season.season_number}`}
                    </h3>
                    {season.air_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(season.air_date).getFullYear()}
                        </p>
                    )}
                </div>
                {watchToken && (
                    <Link href={`/watch/${watchToken}`} className="mt-3">
                        <button className="w-full text-xs px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 border border-primary/20">
                            <Play className="w-3 h-3 fill-current" />
                            مشاهدة
                        </button>
                    </Link>
                )}
            </div>
        </div>
    );
}

export async function MediaDetail({
    item,
    type,
    initialComments = [],
    recommendedMediaContent,
    collectionPartIds = new Set(),
    collectionName = ''
}: MediaDetailProps) {
    const movie = type === 'movie' ? item as ExtendedMovie : null;
    const tvShow = (type === 'tv' || type === 'anime') ? item as ExtendedTvShow : null;
    
    const title = movie ? movie.title : tvShow?.name;
    const originalTitle = movie?.original_title || tvShow?.original_name;
    const backdropPath = item.backdrop_path;
    const posterPath = item.poster_path;
    const overview = item.overview;
    const tagline = (item as ExtendedMovie | ExtendedTvShow).tagline;
    const statusText = formatStatus((item as ExtendedMovie | ExtendedTvShow).status);
    
    const mediaTypeForToken: 'movie' | 'tv' | 'anime' = type;

    let mainWatchToken = '';
    if (process.env.JWT_SECRET) {
        const payload: MainWatchTokenPayload = {
            mediaType: mediaTypeForToken,
            id: item.id,
        };
        if (mediaTypeForToken === 'tv' || mediaTypeForToken === 'anime') {
            payload.season = 1;
            payload.episode = 1;
        }
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        mainWatchToken = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('3h')
            .sign(secret);
    }
    
    const releaseDate = movie?.release_date;
    const firstAirDate = tvShow?.first_air_date;
    const runtime = movie?.runtime;
    const episodeRuntime = tvShow?.episode_run_time?.[0];
    const numberOfSeasons = tvShow?.number_of_seasons;
    const numberOfEpisodes = tvShow?.number_of_episodes;
    const director = movie?.credits?.crew?.find((crewMember: TmdbCrewMember) => crewMember.job === 'Director') as Director | undefined;
    const creators = tvShow?.created_by || [];
    const cast = item.credits?.cast?.slice(0, 10) || [];

    const formatCurrency = (amount: number | undefined) => {
        if (!amount || amount <= 0) return null;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const budget = formatCurrency(movie?.budget);
    const revenue = formatCurrency(movie?.revenue);

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            console.error('Error formatting date:', e);
            return dateStr;
        }
    };
    const displayDate = formatDate(releaseDate || firstAirDate);
    const year = releaseDate || firstAirDate 
        ? new Date(releaseDate || firstAirDate || '').getFullYear() 
        : null;

    const genres = item.genres || [];

    let collectionDetails: CollectionDetail | null = null;
    if (type === 'movie' && movie?.belongs_to_collection?.id) {
        try {
            collectionDetails = await getCollectionDetails(movie.belongs_to_collection.id);
        } catch (error) {
            console.error("Error fetching collection details:", error);
        }
    }

    const trailer = item.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
                 ?? item.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer')
                 ?? item.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Teaser');

    const trailerUrl = trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    const placeholderBackdrop = "/placeholder-backdrop.png";
    const placeholderPoster = "/placeholder-poster.png";

    const filteredCollectionParts = collectionDetails?.parts?.filter(part => part.id !== item.id).sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateA - dateB;
    }) || [];

    const displayCollectionName = collectionName || (collectionDetails?.name || '');

    let seoText = '';
    const mediaTypeNameForSeoText = type === 'movie' ? 'فيلم' : ( (type === 'anime' || tvShow?.genres?.some(g => g.id === 16)) ? 'انمي' : 'مسلسل');

    if (type === 'movie') {
        seoText = `مشاهدة فيلم ${title} ${year ? `(${year})` : ''} مترجم بجودة عالية بدون اعلانات مزعجة. متاح للمشاهدة والتحميل عبر سيرفرات سريعة.`;
    } else {
        seoText = `مشاهدة ${mediaTypeNameForSeoText} ${title} ${year ? `(${year})` : ''} مترجم بجودة عالية. تابع جميع الحلقات والمواسم أونلاين بروابط مباشرة وسريعة.`;
    }

    const altTextBase = title ? `مشاهدة ${type === 'movie' ? 'فيلم' : (type === 'anime' ? 'انمي' : 'مسلسل')} ${title} مترجم` : '';

    // Calculate profit/loss safely
    let hasValidFinancials = false;
    let profit: number | null = null;
    let profitPercentage: number | null = null;
    let isProfitable = false;

    if (movie && movie.budget && movie.revenue && movie.budget > 0 && movie.revenue > 0) {
        hasValidFinancials = true;
        profit = movie.revenue - movie.budget;
        profitPercentage = (profit / movie.budget) * 100;
        isProfitable = profit >= 0;
    }

    return (
        <div className="min-h-screen pb-12">
            {/* Hero Section - Cinematic Layout */}
            <section className="relative overflow-hidden pt-2 pb-10">
                {/* Backdrop with multi-layer modern gradient */}
                <div className="absolute inset-0 h-[65vh] lg:h-[75vh] w-full select-none pointer-events-none">
                    <Image
                        src={getImageUrl(backdropPath, BACKDROP_SIZE) || placeholderBackdrop}
                        alt={altTextBase ? `${altTextBase} - خلفية` : 'خلفية العرض'}
                        fill
                        className="object-cover object-center scale-105 blur-[1px] opacity-40 dark:opacity-30"
                        sizes="100vw"
                        priority={!!backdropPath}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
                </div>

                {/* Content Container */}
                <div className="relative container mx-auto px-4 pt-6 lg:pt-10">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                        
                        {/* Poster Column */}
                        <div className="mx-auto lg:mx-0 flex-shrink-0 w-full max-w-[260px] sm:max-w-[280px] lg:max-w-[320px]">
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 bg-muted/80 group">
                                <Image
                                    src={getImageUrl(posterPath, POSTER_SIZE) || placeholderPoster}
                                    alt={altTextBase ? `${altTextBase} - بوستر` : 'بوستر العرض'}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 768px) 280px, 320px"
                                    priority={!!posterPath}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                {/* Quality / Type Badges on Poster */}
                                <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary text-primary-foreground shadow-lg backdrop-blur-md">
                                        {type === 'movie' ? 'فيلم' : (type === 'anime' ? 'انمي' : 'مسلسل')}
                                    </span>
                                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-black/70 text-white border border-white/20 shadow-lg backdrop-blur-md">
                                        FHD
                                    </span>
                                </div>

                                {item.vote_average > 0 && (
                                    <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-medium">
                                        <div className="flex items-center gap-1.5 text-yellow-400">
                                            <Star className="w-4 h-4 fill-yellow-400" />
                                            <span className="font-bold text-sm">{item.vote_average.toFixed(1)}</span>
                                            <span className="text-white/70">/ 10</span>
                                        </div>
                                        {item.vote_count > 0 && (
                                            <span className="text-white/60 text-[11px]">
                                                {item.vote_count.toLocaleString('ar-EG')} تقييم
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Column */}
                        <div className="flex-1 space-y-5 text-right w-full">
                            {/* Titles */}
                            <div>
                                {tagline && (
                                    <p className="text-sm md:text-base font-medium text-primary mb-2 italic">
                                        &ldquo;{tagline}&rdquo;
                                    </p>
                                )}
                                
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-foreground tracking-tight leading-tight mb-2">
                                    {title}
                                </h1>
                                
                                {originalTitle && originalTitle !== title && (
                                    <h2 className="text-sm sm:text-base text-muted-foreground font-medium mb-3" dir="ltr">
                                        {originalTitle}
                                    </h2>
                                )}

                                {/* Metadata Pills */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground pt-1">
                                    {item.vote_average > 0 && (
                                        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full text-yellow-500 font-semibold">
                                            <Star className="w-3.5 h-3.5 fill-yellow-400" />
                                            <span>{item.vote_average.toFixed(1)}</span>
                                        </div>
                                    )}

                                    {year && (
                                        <div className="flex items-center gap-1.5 bg-muted/60 border border-border px-3 py-1 rounded-full font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                            <span>{year}</span>
                                        </div>
                                    )}

                                    {(runtime || episodeRuntime) && (
                                        <div className="flex items-center gap-1.5 bg-muted/60 border border-border px-3 py-1 rounded-full font-medium">
                                            <Clock className="w-3.5 h-3.5 text-primary" />
                                            <span>{formatRuntime(runtime || episodeRuntime || 0)}</span>
                                        </div>
                                    )}

                                    {numberOfSeasons && (
                                        <div className="flex items-center gap-1.5 bg-muted/60 border border-border px-3 py-1 rounded-full font-medium">
                                            <Tv className="w-3.5 h-3.5 text-primary" />
                                            <span>{numberOfSeasons} {numberOfSeasons === 1 ? 'موسم' : 'مواسم'}</span>
                                        </div>
                                    )}

                                    {numberOfEpisodes && (
                                        <div className="flex items-center gap-1.5 bg-muted/60 border border-border px-3 py-1 rounded-full font-medium">
                                            <Layers className="w-3.5 h-3.5 text-primary" />
                                            <span>{numberOfEpisodes} حلقة</span>
                                        </div>
                                    )}

                                    {statusText && (
                                        <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full font-medium">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>{statusText}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Genres */}
                            {genres.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {genres.map((genre) => (
                                        <Link
                                            key={genre.id}
                                            href={`/${type === 'movie' ? 'movies' : type}?genre=${genre.id}`}
                                            className="px-3.5 py-1 bg-secondary/80 hover:bg-primary hover:text-primary-foreground border border-border/80 hover:border-primary rounded-full text-xs font-semibold transition-all duration-200 shadow-sm"
                                        >
                                            {genre.name}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                {mainWatchToken && (
                                    <Link href={`/watch/${mainWatchToken}`}>
                                        <button className="group flex items-center gap-2.5 px-6 sm:px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl font-bold hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm sm:text-base">
                                            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                                            شاهد الآن
                                        </button>
                                    </Link>
                                )}

                                <WatchlistButton 
                                    id={item.id}
                                    type={mediaTypeForToken}
                                    title={title || ''}
                                    posterPath={posterPath}
                                    year={year}
                                />

                                {trailerUrl && (
                                    <a
                                        href="#trailer"
                                        className="flex items-center gap-2 px-4 py-2.5 bg-secondary/70 hover:bg-secondary border border-border text-foreground rounded-xl font-medium transition-colors text-sm"
                                    >
                                        <Clapperboard className="w-4 h-4 text-primary" />
                                        الإعلان التشويقي
                                    </a>
                                )}
                            </div>

                            {/* Overview / Story */}
                            {overview && (
                                <div className="pt-3 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                                        <Info className="w-5 h-5 text-primary" />
                                        <h2>قصة العمل</h2>
                                    </div>
                                    <p className="text-sm sm:text-base leading-relaxed text-foreground/85 bg-card/40 border border-border/60 rounded-xl p-4 backdrop-blur-sm">
                                        {overview}
                                    </p>
                                </div>
                            )}

                            {/* SEO Text */}
                            {seoText && (
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                                    {seoText}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Facts & Financials Grid */}
            {(director || (creators && creators.length > 0) || budget || revenue || displayDate) && (
                <section className="container mx-auto px-4 py-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Director / Creators */}
                        {(director || (creators && creators.length > 0)) && (
                            <div className="bg-card/70 backdrop-blur-sm rounded-xl p-5 border border-border hover:border-primary/40 transition-all hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-medium text-muted-foreground">
                                            {director ? 'المخرج' : 'المؤلف / المبدع'}
                                        </h3>
                                        {director ? (
                                            <Link
                                                href={`/director/${slugify(director.name)}-${director.id}`}
                                                className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
                                            >
                                                {director.name}
                                            </Link>
                                        ) : (
                                            <div className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                                                {creators.map(c => c.name).join('، ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Release Date */}
                        {displayDate && (
                            <div className="bg-card/70 backdrop-blur-sm rounded-xl p-5 border border-border hover:border-primary/40 transition-all hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-medium text-muted-foreground">تاريخ الإصدار</h3>
                                        <p className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                                            {displayDate}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Budget */}
                        {budget && (
                            <div className="bg-card/70 backdrop-blur-sm rounded-xl p-5 border border-border hover:border-primary/40 transition-all hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-medium text-muted-foreground">ميزانية الإنتاج</h3>
                                        <p className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                                            {budget}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Revenue / Box Office */}
                        {revenue && (
                            <div className="bg-card/70 backdrop-blur-sm rounded-xl p-5 border border-border hover:border-primary/40 transition-all hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-medium text-muted-foreground">الإيرادات العالمية</h3>
                                        <p className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                                            {revenue}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Commercial Performance */}
                        {hasValidFinancials && profit !== null && profitPercentage !== null && (
                            <div className="bg-card/70 backdrop-blur-sm rounded-xl p-5 border border-border hover:border-primary/40 transition-all hover:shadow-md sm:col-span-2 lg:col-span-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isProfitable ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {isProfitable ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground">الأداء المالي في شباك التذاكر</h3>
                                            <p className={`text-sm sm:text-base font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                                                {isProfitable ? 'حقق أرباحاً بنسبة ' : 'خسارة تجارية بنسبة '} {Math.abs(profitPercentage).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isProfitable ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                        {isProfitable ? 'ناجح تجارياً' : 'غير مربح'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Trailer Section */}
            {trailerUrl && (
                <section id="trailer" className="container mx-auto px-4 py-8">
                    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 lg:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <Clapperboard className="w-6 h-6 text-primary" />
                            <h2 className="text-xl sm:text-2xl font-bold">المقطع الدعائي الرسمي</h2>
                        </div>
                        <div className="max-w-4xl mx-auto">
                            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-border bg-black">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={trailerUrl}
                                    title={trailer?.name || `${title || 'Video'} Trailer`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Cast Section */}
            {cast.length > 0 && (
                <section className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />
                            <h2 className="text-xl sm:text-2xl font-bold">طاقم التمثيل والأبطال</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {cast.map((actor: TmdbCastMember) => (
                            <Link
                                key={actor.id}
                                href={`/person/${slugify(actor.name)}-${actor.id}`}
                                className="group bg-card/60 hover:bg-card border border-border/80 hover:border-primary/50 rounded-xl p-3 flex items-center gap-3 transition-all duration-200 hover:shadow-md"
                            >
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0 bg-muted ring-1 ring-border group-hover:ring-primary transition-all">
                                    <Image
                                        src={getImageUrl(actor.profile_path, 'w185') || '/placeholder-avatar.png'}
                                        alt={actor.name || 'صورة الممثل'}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                        {actor.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {actor.character || 'دور غير محدد'}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Seasons Section (TV & Anime) */}
            {(type === 'tv' || type === 'anime') && tvShow?.seasons && tvShow.seasons.length > 0 && (
                <section className="container mx-auto px-4 py-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Tv className="w-6 h-6 text-primary" />
                        <h2 className="text-xl sm:text-2xl font-bold">جميع مواسم العمل</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                        {await Promise.all(tvShow.seasons.map(async (season) => (
                            <SeasonCard
                                key={season.id}
                                season={season}
                                tvId={tvShow.id}
                                tvSlug={slugify(tvShow.name || '')}
                                itemType={type}
                            />
                        )))}
                    </div>
                </section>
            )}

            {/* Collection / Franchise Section */}
            {type === 'movie' && collectionDetails && filteredCollectionParts.length > 0 && (
                <section className="container mx-auto px-4 py-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Film className="w-6 h-6 text-primary" />
                        <h2 className="text-xl sm:text-2xl font-bold">
                            سلسلة أجزاء {displayCollectionName || collectionDetails.name}
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                        {filteredCollectionParts.map((part) => (
                            <div key={part.id} className="relative">
                                <MediaItemCard item={part} type="movie" />
                                {collectionPartIds.has(part.id) && (
                                    <div className="absolute top-2.5 right-2.5 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Recommended Media */}
            {recommendedMediaContent && (
                <section className="py-6">
                    {recommendedMediaContent}
                </section>
            )}

            {/* FAQ Section */}
            <section className="container mx-auto px-4 py-8">
                <div className="bg-card/50 border border-border/80 rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <HelpCircle className="w-6 h-6 text-primary" />
                        <h2 className="text-xl sm:text-2xl font-bold">الأسئلة الشائعة عن {title}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-background/80 rounded-xl p-5 border border-border/60 hover:border-primary/40 transition-colors">
                            <h3 className="font-bold text-sm sm:text-base text-foreground mb-2">
                                كيف أشاهد {title} مترجم بدون إعلانات؟
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                يمكنك الاستمتاع بمشاهدة {title} مباشرة عبر مشغل الفيديو عالي السرعة وبجودات متعددة تناسب جميع سرعات الإنترنت.
                            </p>
                        </div>

                        <div className="bg-background/80 rounded-xl p-5 border border-border/60 hover:border-primary/40 transition-colors">
                            <h3 className="font-bold text-sm sm:text-base text-foreground mb-2">
                                هل {title} متوفر للتحميل المباشر؟
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                نعم، يمكنك تحميل {title} بجودة FHD و HD مباشرة لمشاهدته لاحقاً دون اتصال بالإنترنت.
                            </p>
                        </div>

                        {type === 'movie' && runtime && (
                            <div className="bg-background/80 rounded-xl p-5 border border-border/60 hover:border-primary/40 transition-colors">
                                <h3 className="font-bold text-sm sm:text-base text-foreground mb-2">
                                    ما هي مدة عرض فيلم {title}؟
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    المدة الإجمالية للفيلم هي {formatRuntime(runtime)}.
                                </p>
                            </div>
                        )}

                        {(type === 'tv' || type === 'anime') && numberOfSeasons && (
                            <div className="bg-background/80 rounded-xl p-5 border border-border/60 hover:border-primary/40 transition-colors">
                                <h3 className="font-bold text-sm sm:text-base text-foreground mb-2">
                                    كم عدد مواسم وحلقات {title}؟
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    يتكون العمل من {numberOfSeasons} {numberOfSeasons === 1 ? 'موسم' : 'مواسم'} {numberOfEpisodes ? `بإجمالي ${numberOfEpisodes} حلقة` : ''}.
                                </p>
                            </div>
                        )}

                        <div className="bg-background/80 rounded-xl p-5 border border-border/60 hover:border-primary/40 transition-colors">
                            <h3 className="font-bold text-sm sm:text-base text-foreground mb-2">
                                ما هو تقييم الجمهور لـ {title}؟
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {item.vote_average && item.vote_count && item.vote_count > 0 
                                    ? `تقييم ${title} هو ${item.vote_average.toFixed(1)} من 10 بناءً على ${item.vote_count.toLocaleString('ar-EG')} تقييم.`
                                    : `التقييم قيد التحديث لـ ${title}.`}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comment Section */}
            <section className="container mx-auto px-4 py-8 border-t border-border">
                <CommentSection 
                    mediaId={item.id.toString()} 
                    mediaType={type} 
                    initialComments={initialComments}
                />
            </section>
        </div>
    );
}