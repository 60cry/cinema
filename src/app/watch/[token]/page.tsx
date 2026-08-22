// Placeholder for watch page
import React from 'react';
import { jwtVerify } from 'jose';
import { WatchPlayerClient, type WatchPageProps } from '@/components/watch/WatchPlayerClient'; // Adjusted import
import type { Metadata } from 'next'; // Import Metadata type

// Helper type from Astro, can be reused or adapted
interface YtsTorrent {
    url: string;
    hash: string;
    quality: string;
    type: string;
    seeds: number;
    peers: number;
    size: string;
    size_bytes: number;
    date_uploaded: string;
    date_uploaded_unix: number;
}

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY; // Use Next.js env var
const JWT_SECRET = process.env.JWT_SECRET;

// Define props for the Page server component
type WatchPageServerProps = {
  params: Promise<{ token: string }>;
  // searchParams?: { [key: string]: string | string[] | undefined }; // Example if using searchParams
};

// This is a Server Component
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  // Wait for params if needed
  await params;
  
  return {
    title: 'Watch',
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        'max-video-preview': -1,
        'max-image-preview': 'none',
        'max-snippet': -1,
      },
    }
  };
}

export default async function WatchPage({ params }: WatchPageServerProps) {
    const { token } = await params;

    const propsForClient: WatchPageProps = { // Renamed from 'props' to avoid ambiguity
        // Initialize with default/error states
        initialError: null,
        initialTitle: 'Watch',
        mediaType: null,
        tmdbId: null,
        episodeInfo: null,
        providerUrls: {},
        availableTorrents: null,
        initialSelectedTorrentHash: null,
        tvEpisodeMagnet: null,
        initialSource: 'vidsrc', // Default initial source
    };

    if (typeof JWT_SECRET !== 'string' || !JWT_SECRET) {
        console.error("[Watch Page] FATAL: JWT_SECRET environment variable is not set!");
        propsForClient.initialError = "Server configuration error. Cannot verify watch link.";
        return <WatchPlayerClient {...propsForClient} />;
    }

    if (!token) {
        console.error("[Watch Page] No token provided in URL.");
        propsForClient.initialError = "Invalid watch link: Missing token.";
        return <WatchPlayerClient {...propsForClient} />;
    }

    try {
        console.log(`[Watch Page] Verifying token: ${(token as string).substring(0, 15)}...`);
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload: decoded } = await jwtVerify(token as string, secret);

        if (typeof decoded !== 'object' || decoded === null) {
            console.error("[Watch Page] Invalid token payload structure after verification.", decoded);
            throw new Error("Invalid token payload structure.");
        }
        const decodedTokenData = decoded;

        const tmdbIdFromToken = String(decodedTokenData.id);
        const mediaTypeFromToken = decodedTokenData.mediaType as 'movie' | 'tv' | 'anime';
        const seasonParam = decodedTokenData.season ? String(decodedTokenData.season) : null;
        const episodeParam = decodedTokenData.episode ? String(decodedTokenData.episode) : null;

        propsForClient.tmdbId = tmdbIdFromToken;
        propsForClient.mediaType = mediaTypeFromToken;


        console.log(`[Watch Page] Token valid. Decoded: tmdbId=${tmdbIdFromToken}, type=${mediaTypeFromToken}, s=${seasonParam}, e=${episodeParam}`);

        if (!tmdbIdFromToken || isNaN(Number(tmdbIdFromToken)) || !['movie', 'tv', 'anime'].includes(mediaTypeFromToken)) {
            console.error(`[Watch Page] Invalid data extracted from token: tmdbId=${tmdbIdFromToken}, type=${mediaTypeFromToken}`);
            throw new Error("Invalid data extracted from token.");
        }

        let fetchedTitle = 'Watch';
        let imdbId: string | null = null;

        if (mediaTypeFromToken && tmdbIdFromToken) {
            if ((mediaTypeFromToken === 'tv' || mediaTypeFromToken === 'anime') && seasonParam && episodeParam) {
                propsForClient.episodeInfo = { seasonNumber: parseInt(seasonParam, 10), episodeNumber: parseInt(episodeParam, 10) };
            } else if ((mediaTypeFromToken === 'tv' || mediaTypeFromToken === 'anime') && (!seasonParam || !episodeParam)) {
                 console.warn(`[Watch Page] TV/Anime type specified but missing season/episode in token.`);
                 propsForClient.initialError = "Season and episode numbers are required for TV shows and Anime in the watch link.";
                 return <WatchPlayerClient {...propsForClient} />;
            }
        }

        if (TMDB_API_KEY && tmdbIdFromToken) {
            const detailsUrl = `https://api.themoviedb.org/3/${mediaTypeFromToken === 'anime' ? 'tv' : mediaTypeFromToken}/${tmdbIdFromToken}?api_key=${TMDB_API_KEY}&language=en-US`;
            try {
                console.log(`[Watch Page Debug] Fetching TMDB details: ${detailsUrl.replace(TMDB_API_KEY, '[API_KEY]')}`);
                const detailsRes = await fetch(detailsUrl);
                if (detailsRes.ok) {
                    const detailsData = await detailsRes.json();
                    const baseTitle = detailsData.title || detailsData.name || 'Watch';

                    if (mediaTypeFromToken === 'movie') {
                        imdbId = detailsData.imdb_id;
                        console.log(`[Watch Page Debug] Extracted IMDb ID: ${imdbId}`);
                    }

                    if ((mediaTypeFromToken === 'tv' || mediaTypeFromToken === 'anime') && propsForClient.episodeInfo) {
                        const episodeDetailsUrl = `https://api.themoviedb.org/3/tv/${tmdbIdFromToken}/season/${propsForClient.episodeInfo.seasonNumber}/episode/${propsForClient.episodeInfo.episodeNumber}?api_key=${TMDB_API_KEY}&language=en-US`;
                        const episodeRes = await fetch(episodeDetailsUrl);
                        if (episodeRes.ok) {
                            const episodeData = await episodeRes.json();
                            fetchedTitle = episodeData.name
                                ? `${baseTitle} - S${propsForClient.episodeInfo.seasonNumber}E${propsForClient.episodeInfo.episodeNumber} - ${episodeData.name}`
                                : `${baseTitle} - S${propsForClient.episodeInfo.seasonNumber}E${propsForClient.episodeInfo.episodeNumber}`;
                        } else {
                            fetchedTitle = `${baseTitle} - S${propsForClient.episodeInfo.seasonNumber}E${propsForClient.episodeInfo.episodeNumber}`;
                        }
                    } else {
                        fetchedTitle = baseTitle;
                    }
                    propsForClient.initialTitle = fetchedTitle;
                } else {
                    console.warn(`[Watch Page Debug] Failed to fetch TMDB details: ${detailsRes.status}`);
                    propsForClient.initialError = propsForClient.initialError || `Could not load title details (Error: ${detailsRes.status})`;
                }
            } catch (fetchTitleError: unknown) {
                console.error('[Watch Page Debug] Error fetching TMDB details:', (fetchTitleError instanceof Error) ? fetchTitleError.message : String(fetchTitleError));
                propsForClient.initialError = propsForClient.initialError || 'Could not load title details.';
            }
        } else {
            if (!tmdbIdFromToken) propsForClient.initialError = propsForClient.initialError || "Missing content ID in token.";
            if (!TMDB_API_KEY) console.warn("[Watch Page Debug] TMDB_API_KEY is not set. Cannot fetch details.");
        }

        if (mediaTypeFromToken === 'movie' && imdbId) {
            const ytsEndpoints = [
                `https://yts.mx/api/v2/movie_details.json?imdb_id=${imdbId}`,
                `https://yts.pm/api/v2/movie_details.json?imdb_id=${imdbId}`,
                `https://yts.lt/api/v2/movie_details.json?imdb_id=${imdbId}`,
            ];

            for (const ytsUrl of ytsEndpoints) {
                try {
                    const ytsRes = await fetch(ytsUrl, {
                        headers: { 'Accept': 'application/json' },
                        signal: AbortSignal.timeout(3000),
                        next: { revalidate: 86400 }
                    });
                    if (ytsRes.ok) {
                        const ytsData = await ytsRes.json();
                        if (ytsData.status === 'ok' && ytsData.data?.movie?.torrents?.length > 0) {
                            propsForClient.availableTorrents = ytsData.data.movie.torrents as YtsTorrent[];
                            // Pick the healthiest torrent with highest seeds for fastest 50MB warmup buffer
                            const sortedBySeeds = [...propsForClient.availableTorrents].sort((a, b) => (b.seeds || 0) - (a.seeds || 0));
                            const defaultTorrent =
                                sortedBySeeds.find(t => t.quality === '1080p' && (t.seeds || 0) > 10) ||
                                sortedBySeeds[0] ||
                                propsForClient.availableTorrents[0];
                            if (defaultTorrent) {
                                propsForClient.initialSelectedTorrentHash = defaultTorrent.hash;
                            }
                            break;
                        }
                    }
                } catch {
                    // Fail silently or try next mirror
                }
            }
        }
        if (mediaTypeFromToken === 'movie' && !imdbId) {
             console.log('[Watch Page Debug] Skipping YTS torrent fetch because IMDb ID is missing or not fetched.');
        }

        if ((mediaTypeFromToken === 'tv' || mediaTypeFromToken === 'anime') && propsForClient.episodeInfo) {
            try {
                const showNameMatch = fetchedTitle.match(/^(.*?) - S\d+E\d+/);
                const showName = showNameMatch ? showNameMatch[1].trim() : fetchedTitle;
                const season = propsForClient.episodeInfo.seasonNumber;
                const episode = propsForClient.episodeInfo.episodeNumber;
                const query = `${showName} S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
                
                const torrentApiUrl = `https://torrent-api-py-nx0x.onrender.com/api/v1/search?site=1337x&query=${encodeURIComponent(query)}`;
                const res = await fetch(torrentApiUrl, {
                    signal: AbortSignal.timeout(3500),
                    next: { revalidate: 86400 }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
                        interface TorrentApiItem {
                            name: string;
                            magnet?: string;
                            seeders?: string | number;
                        }
                        const sortedTorrents = (data.data as TorrentApiItem[]).sort((a, b) => 
                            parseInt(String(b.seeders || '0')) - parseInt(String(a.seeders || '0'))
                        );
                        const best = sortedTorrents[0];
                        if (best.magnet) {
                            propsForClient.tvEpisodeMagnet = best.magnet;
                        }
                    }
                }
            } catch {
                // Ignore failure gracefully
            }
        }
        
        if (tmdbIdFromToken && mediaTypeFromToken) {
            const seasonNum = propsForClient.episodeInfo?.seasonNumber;
            const episodeNum = propsForClient.episodeInfo?.episodeNumber;
            const apiType = (mediaTypeFromToken === 'anime' ? 'tv' : mediaTypeFromToken);
            
            const animeSlugify = (str: string | undefined): string => {
                if (!str) return '';
                return str.toLowerCase().replace(/[^a-z0-9\\s-]/g, '').replace(/\\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
            };
            const animeBaseTitle = mediaTypeFromToken === 'anime' ? fetchedTitle?.split(' - S')[0] : '';
            const slugifiedAnimeTitle = animeSlugify(animeBaseTitle);

            const tempProviderUrls: Record<string, string | null> = {
                vidjoy: apiType === 'movie'
                    ? `https://vidjoy.pro/embed/movie/${tmdbIdFromToken}`
                    : (seasonNum && episodeNum ? `https://vidjoy.pro/embed/tv/${tmdbIdFromToken}/${seasonNum}/${episodeNum}` : null),
                vidsrc: apiType === 'movie'
                    ? `https://vidsrc.pro/embed/movie/${tmdbIdFromToken}`
                    : (seasonNum && episodeNum ? `https://vidsrc.pro/embed/tv/${tmdbIdFromToken}/${seasonNum}/${episodeNum}` : null),
                vidlink: apiType === 'movie'
                    ? `https://vidlink.pro/movie/${tmdbIdFromToken}`
                    : (seasonNum && episodeNum ? `https://vidlink.pro/tv/${tmdbIdFromToken}/${seasonNum}/${episodeNum}` : null),
                playerautoembed: apiType === 'movie'
                    ? `https://player.autoembed.cc/embed/movie/${tmdbIdFromToken}`
                    : (seasonNum && episodeNum ? `https://player.autoembed.cc/embed/tv/${tmdbIdFromToken}/${seasonNum}/${episodeNum}` : null),
                '2embed': apiType === 'movie'
                    ? `https://www.2embed.skin/embed/${tmdbIdFromToken}`
                    : (seasonNum && episodeNum ? `https://www.2embed.skin/embedtv/${tmdbIdFromToken}&s=${seasonNum}&e=${episodeNum}` : null),
                embedsu: apiType === 'movie'
                    ? `https://embed.su/embed/movie/${tmdbIdFromToken}`
                    : (seasonNum && episodeNum ? `https://embed.su/embed/tv/${tmdbIdFromToken}/${seasonNum}/${episodeNum}` : null),
                animeautoembed: mediaTypeFromToken === 'anime' && episodeNum && slugifiedAnimeTitle
                    ? `https://anime.autoembed.cc/embed/${slugifiedAnimeTitle}-episode-${episodeNum}`
                    : null,
                dramaautoembed: (mediaTypeFromToken === 'tv' || mediaTypeFromToken === 'anime') && episodeNum && seasonNum
                    ? `https://drama.autoembed.cc/embed/${tmdbIdFromToken}-episode-${episodeNum}?server=${seasonNum}`
                    : null,
            };
             propsForClient.providerUrls = Object.entries(tempProviderUrls).reduce((acc, [key, value]) => {
                if (value) acc[key] = value;
                return acc;
             }, {} as Record<string, string | null>);
        }

        if (mediaTypeFromToken === 'movie' && !propsForClient.providerUrls?.vidsrc && propsForClient.availableTorrents && propsForClient.availableTorrents.length > 0) {
            propsForClient.initialSource = 'webtor';
        } else if (propsForClient.providerUrls?.vidlink) {
             propsForClient.initialSource = 'vidlink';
        }
         else {
            propsForClient.initialSource = 'vidsrc';
        }

    } catch (err: unknown) {
        console.error("[Watch Page] Token verification or processing failed:", (err instanceof Error) ? err.message : String(err));
        if (err instanceof Error) {
            if (err.name === 'JWTExpired' || err.message.includes('expired')) {
                propsForClient.initialError = "This watch link has expired. Please generate a new one.";
            } else if (err.name === 'JWTInvalid' || err.message.includes('invalid')) {
                propsForClient.initialError = "Invalid watch link format or signature.";
            } else {
                propsForClient.initialError = err.message || "Could not validate watch link.";
            }
        } else {
            propsForClient.initialError = "An unknown error occurred during token validation.";
        }
    }
    
    if (propsForClient.initialError) {
        propsForClient.initialTitle = 'Error';
        propsForClient.mediaType = null;
        propsForClient.episodeInfo = null;
        propsForClient.providerUrls = {};
        propsForClient.availableTorrents = null;
        propsForClient.initialSelectedTorrentHash = null;
        propsForClient.tvEpisodeMagnet = null;
    }

    console.log("[Watch Page Server] Final props for client:", JSON.stringify({
        error: propsForClient.initialError,
        title: propsForClient.initialTitle,
        mediaType: propsForClient.mediaType,
        tmdbId: propsForClient.tmdbId,
        episodeInfo: propsForClient.episodeInfo,
        providerUrlCount: Object.keys(propsForClient.providerUrls || {}).length,
        hasAvailableTorrents: !!propsForClient.availableTorrents && propsForClient.availableTorrents.length > 0,
        torrentCount: propsForClient.availableTorrents?.length ?? 0,
        initialHash: propsForClient.initialSelectedTorrentHash,
        hasTvMagnet: !!propsForClient.tvEpisodeMagnet,
        initialSource: propsForClient.initialSource
    }, null, 2));

    return <WatchPlayerClient {...propsForClient} />;
}

export const runtime = 'edge';
export const revalidate = 0; // Disable ISR 