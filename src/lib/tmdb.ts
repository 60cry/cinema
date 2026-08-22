import { z } from 'zod';
import axios, { isAxiosError } from 'axios';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'placeholder';
const API_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/';
export const POSTER_SIZE = 'w1280';
export const BACKDROP_SIZE = 'w1280';

// --- Zod Schemas for Type Validation ---

// const MovieSchema = z.object({ // Unused
//   id: z.number(),
//   title: z.string(),
//   original_title: z.string(),
//   overview: z.string(),
//   poster_path: z.string().nullable(),
//   backdrop_path: z.string().nullable(),
//   release_date: z.string().optional(), // Optional as it might be missing
//   vote_average: z.number(),
//   vote_count: z.number(),
//   popularity: z.number(),
//   genre_ids: z.array(z.number()).optional(), // Included in list responses
// });

// Schema for a single season within the TV show details response
const SeasonSchema = z.object({
    air_date: z.string().nullable().optional(),
    episode_count: z.number().optional(),
    id: z.number(),
    name: z.string(),
    overview: z.string(),
    poster_path: z.string().nullable(),
    season_number: z.number(),
    vote_average: z.number().optional(),
});

const EpisodeSchema = z.object({
    air_date: z.string().nullable().optional(),
    episode_number: z.number(),
    id: z.number(),
    name: z.string(),
    overview: z.string(),
    production_code: z.string().optional(),
    runtime: z.number().nullable().optional(),
    season_number: z.number(),
    show_id: z.number().optional(), // Often included
    still_path: z.string().nullable(),
    vote_average: z.number(),
    vote_count: z.number(),
    // crew: z.array(z.any()).optional(), // Add specific schema if needed
    // guest_stars: z.array(z.any()).optional(), // Add specific schema if needed
});

const CastMemberSchema = z.object({
    adult: z.boolean(),
    gender: z.number().nullable(),
    id: z.number(),
    known_for_department: z.string(),
    name: z.string(),
    original_name: z.string(),
    popularity: z.number(),
    profile_path: z.string().nullable(),
    cast_id: z.number().optional(), // Specific to movie cast
    character: z.string().optional(),
    credit_id: z.string(),
    order: z.number().optional(), // Order in the credits
    roles: z.array(z.object({ // Specific to TV cast
        credit_id: z.string(),
        character: z.string(),
        episode_count: z.number(),
    })).optional(),
    total_episode_count: z.number().optional(), // Specific to TV cast
});

const CrewMemberSchema = z.object({
    adult: z.boolean().optional(), // Optional as it's not always present or relevant
    gender: z.number().nullable().optional(),
    id: z.number(),
    known_for_department: z.string().optional(),
    name: z.string(),
    original_name: z.string().optional(),
    popularity: z.number().optional(),
    profile_path: z.string().nullable(),
    credit_id: z.string().optional(), // Often present
    department: z.string().optional(), // e.g., "Directing", "Writing"
    job: z.string().optional(), // e.g., "Director", "Screenplay"
});

const CreditsResponseSchema = z.object({
    cast: z.array(CastMemberSchema),
    crew: z.array(CrewMemberSchema).optional().default([]) // Ensure crew is always an array
});

// Schema for the full response when fetching season details
const SeasonDetailSchema = SeasonSchema.extend({
    _id: z.string().optional(), // Sometimes included
    episodes: z.array(EpisodeSchema),
});

// const TvShowSchema = z.object({ // Unused
//     id: z.number(),
//     name: z.string(),
//     original_name: z.string(),
//     overview: z.string(),
//     poster_path: z.string().nullable(),
//     backdrop_path: z.string().nullable(),
//     first_air_date: z.string().optional(),
//     vote_average: z.number(),
//     vote_count: z.number(),
//     popularity: z.number(),
//     genre_ids: z.array(z.number()).optional(),
//     number_of_seasons: z.number().optional(), // Often included
//     number_of_episodes: z.number().optional(), // Often included
//     seasons: z.array(SeasonSchema).optional(),
// });

const GenreSchema = z.object({
    id: z.number(),
    name: z.string(),
});

const GenresResponseSchema = z.object({
    genres: z.array(GenreSchema),
});

const PagedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  page: z.number(),
  results: z.array(itemSchema),
  total_pages: z.number(),
  total_results: z.number(),
});

// --- Base Schemas ---
const BaseMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string(),
  overview: z.string(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  release_date: z.string().optional(),
  vote_average: z.number(),
  vote_count: z.number(),
  popularity: z.number(),
  genre_ids: z.array(z.number()).optional(),
  runtime: z.number().nullable().optional(),
  budget: z.number().optional(),
  revenue: z.number().optional(),
});

const BaseTvShowSchema = z.object({
    id: z.number(),
    name: z.string(),
    original_name: z.string(),
    overview: z.string(),
    poster_path: z.string().nullable(),
    backdrop_path: z.string().nullable(),
    first_air_date: z.string().optional(),
    vote_average: z.number(),
    vote_count: z.number(),
    popularity: z.number(),
    genre_ids: z.array(z.number()).optional(),
    number_of_seasons: z.number().optional(), 
    number_of_episodes: z.number().optional(),
    seasons: z.array(SeasonSchema).optional(),
});

// Define Video schemas BEFORE they are used in Detail Schemas
const VideoSchema = z.object({
    iso_639_1: z.string().optional(),
    iso_3166_1: z.string().optional(),
    name: z.string(),
    key: z.string(), // YouTube key
    site: z.string(), // e.g., "YouTube"
    size: z.number().optional(), // e.g., 1080
    type: z.string(), // e.g., "Trailer", "Teaser"
    official: z.boolean(),
    published_at: z.string().optional(),
    id: z.string(), // Video ID
});

const VideosResponseSchema = z.object({
    results: z.array(VideoSchema),
});

// Schema for Keywords (often a list of keyword objects)
const KeywordSchema = z.object({
    id: z.number(),
    name: z.string(),
});

const KeywordsResponseSchema = z.object({
    // For movies, TMDB returns { id: <movie_id>, keywords: [{id, name}, ...] }
    keywords: z.array(KeywordSchema).optional(), 
    // For TV shows, TMDB returns { id: <tv_id>, results: [{id, name}, ...] }
    results: z.array(KeywordSchema).optional(), 
});

// --- Collection Schemas ---
const BaseCollectionSchema = z.object({
    id: z.number(),
    name: z.string(),
    poster_path: z.string().nullable(),
    backdrop_path: z.string().nullable(),
});

// Schema for movie parts within a collection (similar to BaseMovieSchema)
const CollectionPartSchema = BaseMovieSchema.extend({}); // Inherits basic movie fields

const CollectionDetailSchema = BaseCollectionSchema.extend({
    overview: z.string().optional(),
    parts: z.array(CollectionPartSchema), // Array of movies in the collection
});

// --- Detail Schemas with Credits & Videos ---
const MovieDetailSchema = BaseMovieSchema.extend({
    genres: z.array(GenreSchema).optional(), 
    credits: CreditsResponseSchema.optional(),
    videos: VideosResponseSchema.optional(),
    belongs_to_collection: BaseCollectionSchema.nullable().optional(), // Add collection info
    keywords: KeywordsResponseSchema.optional(), // Added keywords for movies
});

const TvShowDetailSchema = BaseTvShowSchema.extend({
    genres: z.array(GenreSchema).optional(),
    credits: CreditsResponseSchema.optional(), 
    videos: VideosResponseSchema.optional(), // Now defined
    keywords: KeywordsResponseSchema.optional(), // Added keywords for TV
    created_by: z.array(z.object({
        id: z.number(),
        credit_id: z.string().optional(), 
        name: z.string(),
        gender: z.number().nullable().optional(), // gender can be null
        profile_path: z.string().nullable(),
    })).optional(),
});

// --- Paged Schemas ---
const PagedMoviesResponseSchema = PagedResponseSchema(BaseMovieSchema);
const PagedTvShowsResponseSchema = PagedResponseSchema(BaseTvShowSchema);

// Schema for Person results within Multi Search
const BasePersonSchema = z.object({
    id: z.number(),
    name: z.string(),
    profile_path: z.string().nullable(),
    known_for_department: z.string().optional(), // Department they are known for
    // Add other relevant person fields if needed for suggestions
});

// Union schema for multi search results
const MultiSearchResultSchema = z.union([
    BaseMovieSchema.extend({ media_type: z.literal('movie') }),
    BaseTvShowSchema.extend({ media_type: z.literal('tv') }),
    BasePersonSchema.extend({ media_type: z.literal('person') })
]);

// Schema for the paged response of multi search
const PagedMultiSearchResponseSchema = PagedResponseSchema(MultiSearchResultSchema);

// Type Definitions from Zod Schemas
export type Movie = z.infer<typeof BaseMovieSchema>; // Base type for general use
export type TvShow = z.infer<typeof BaseTvShowSchema>; // Base type for general use
export type MovieDetail = z.infer<typeof MovieDetailSchema>; // Detail type
export type TvShowDetail = z.infer<typeof TvShowDetailSchema>; // Detail type
export type Genre = z.infer<typeof GenreSchema>;
export type Season = z.infer<typeof SeasonSchema>;
export type Episode = z.infer<typeof EpisodeSchema>; 
export type SeasonDetail = z.infer<typeof SeasonDetailSchema>;
export type CastMember = z.infer<typeof CastMemberSchema>;
export type CrewMember = z.infer<typeof CrewMemberSchema>; // Export CrewMember type
export type Director = CrewMember & { job: 'Director' }; // Define Director type
export type CreditsResponse = z.infer<typeof CreditsResponseSchema>;
export type PagedMoviesResponse = z.infer<typeof PagedMoviesResponseSchema>;
export type PagedTvShowsResponse = z.infer<typeof PagedTvShowsResponseSchema>;
export type Person = z.infer<typeof BasePersonSchema>; // Add Person type
export type MultiSearchResult = z.infer<typeof MultiSearchResultSchema>; // Add Multi Search result type
export type PagedMultiSearchResponse = z.infer<typeof PagedMultiSearchResponseSchema>; // Add Multi Search response type
export type Collection = z.infer<typeof BaseCollectionSchema>; // Basic collection type
export type CollectionPart = z.infer<typeof CollectionPartSchema>; // Movie part type
export type CollectionDetail = z.infer<typeof CollectionDetailSchema>; // Detailed collection type

const PersonDetailSchema = z.object({
    adult: z.boolean(),
    also_known_as: z.array(z.string()),
    biography: z.string(),
    birthday: z.string().nullable(),
    deathday: z.string().nullable().optional(),
    gender: z.number(),
    homepage: z.string().nullable().optional(),
    id: z.number(),
    imdb_id: z.string().optional(),
    known_for_department: z.string(),
    name: z.string(),
    place_of_birth: z.string().nullable(),
    popularity: z.number(),
    profile_path: z.string().nullable(),
});

// Schemas for combined credits
const PersonMovieCreditSchema = BaseMovieSchema.extend({ 
    media_type: z.literal('movie'),
    character: z.string().optional(),
    credit_id: z.string(),
    order: z.number().optional(),
});

const PersonTvCreditSchema = BaseTvShowSchema.extend({ 
    media_type: z.literal('tv'),
    character: z.string().optional(),
    credit_id: z.string(),
    episode_count: z.number().optional(),
});

const PersonMovieCrewCreditSchema = PersonMovieCreditSchema.extend({
    department: z.string(),
    job: z.string(),
});

const PersonTvCrewCreditSchema = PersonTvCreditSchema.extend({
    department: z.string(),
    job: z.string(),
});

const PersonCombinedCreditsSchema = z.object({
    cast: z.array(z.union([PersonMovieCreditSchema, PersonTvCreditSchema])),
    crew: z.array(z.union([PersonMovieCrewCreditSchema, PersonTvCrewCreditSchema])).optional(),
    id: z.number(), 
});

// Type Definitions from Zod Schemas
export type PersonDetail = z.infer<typeof PersonDetailSchema>;
export type PersonMovieCredit = z.infer<typeof PersonMovieCreditSchema>;
export type PersonTvCredit = z.infer<typeof PersonTvCreditSchema>;
export type PersonMovieCrewCredit = z.infer<typeof PersonMovieCrewCreditSchema>;
export type PersonTvCrewCredit = z.infer<typeof PersonTvCrewCreditSchema>;
export type PersonCombinedCredits = z.infer<typeof PersonCombinedCreditsSchema>; // <-- Add PersonCombinedCredits type

export type Video = z.infer<typeof VideoSchema>; 
export type VideosResponse = z.infer<typeof VideosResponseSchema>; 

// --- Helper Function for API Calls ---

async function fetchTmdb<T extends z.ZodTypeAny>(
    endpoint: string,
    schema: T,
    language: string = 'ar-SA', // Default language is Arabic
    extraParams: Record<string, string | number | boolean | undefined> = {}
): Promise<z.infer<T>> {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || TMDB_API_KEY || 'placeholder';
    const baseUrl = process.env.NEXT_PUBLIC_TMDB_BASE_URL || API_BASE_URL;
    const requestUrl = `${baseUrl}/${endpoint}`;

    const definedParams: Record<string, string | number | boolean> = {};
    for (const key in extraParams) {
        if (extraParams[key] !== undefined) {
            definedParams[key] = extraParams[key]!;
        }
    }

    const params = {
        api_key: apiKey,
        language: language, // Use the passed language parameter
        ...definedParams
    };

    // console.log(`Fetching TMDB URL: ${requestUrl}, PARAMS: ${JSON.stringify(params)}`);

    try {
        const response = await axios.get(requestUrl, { params });
        const data = response.data;
        const validationResult = schema.safeParse(data);

        if (!validationResult.success) {
            console.error("TMDB API Response Validation Error:", validationResult.error.issues);
            // console.error("Raw data:", JSON.stringify(data, null, 2)); 
            throw new Error("Failed to validate TMDB API response structure.");
        }
        
        return validationResult.data;
    } catch (error) {
        if (isAxiosError(error)) {
            // Log the basic error details first
            console.error(`Axios Error (${error.response?.status || 'Network Error'}) on endpoint ${endpoint}:`, error.response?.data || error.message);
            
            // Re-throw the error if it wasn't handled above (e.g., not a 404, or a 404 on an unsupported endpoint)
            throw new Error(`TMDB API request failed: ${error.message}`);
        } else {
            console.error("Non-Axios error fetching from TMDB:", error);
            throw error; // Re-throw other types of errors
        }
    }
}

// --- New Helper Function to Merge English Titles ---
function mergeWithEnglishTitles<T extends Movie | TvShow | MovieDetail | TvShowDetail | CollectionPart>(
    arItems: T[],
    enItems: T[]
): T[] {
    const enItemsMap = new Map(enItems.map(item => [item.id, item]));
    return arItems.map(arItem => {
        const enItem = enItemsMap.get(arItem.id);
        if (enItem) {
            if ('title' in arItem && 'title' in enItem) {
                (arItem as Movie | MovieDetail | CollectionPart).title = (enItem as Movie | MovieDetail | CollectionPart).title;
            } else if ('name' in arItem && 'name' in enItem) {
                (arItem as TvShow | TvShowDetail).name = (enItem as TvShow | TvShowDetail).name;
            }
        }
        return arItem;
    });
}

// --- API Functions ---

/**
 * Fetches popular movies from TMDB.
 * Returns a paged response with Arabic details but English titles.
 * @param page - The page number to fetch.
 * @returns A promise resolving to the paged response of popular movies with English titles.
 */
export async function getPopularMovies(page: number = 1): Promise<PagedMoviesResponse> {
    // Fetch popular movies in Arabic
    const arPagedResponse = await fetchTmdb(
        'movie/popular',
        PagedMoviesResponseSchema,
        'ar-SA',
        { page }
    );

    // Fetch popular movies in English for the same page
    const enPagedResponse = await fetchTmdb(
        'movie/popular',
        PagedMoviesResponseSchema,
        'en-US',
        { page }
    );

    // Merge English titles into Arabic results
    if (arPagedResponse && arPagedResponse.results && enPagedResponse && enPagedResponse.results) {
        arPagedResponse.results = mergeWithEnglishTitles(arPagedResponse.results, enPagedResponse.results);
    }

    return arPagedResponse;
}

/**
 * Fetches top-rated movies from TMDB.
 * Returns a paged response with Arabic details but English titles.
 * @param page - The page number to fetch.
 * @returns A promise resolving to the paged response of top-rated movies with English titles.
 */
export async function getTopRatedMovies(page: number = 1): Promise<PagedMoviesResponse> {
    const filters: MediaFilters = {
        sort_by: 'vote_average.desc',
        'vote_count.gte': 10000, // Exclude movies with low vote counts
        page,
    };
    return discoverMovies(filters);
}

/**
 * Fetches popular TV shows from TMDB, excluding Reality, Talk, Soap, and News genres.
 * Returns a paged response with Arabic details but English names.
 * @param page - The page number to fetch.
 * @returns A promise resolving to the paged response of popular TV shows with English names.
 */
export async function getPopularTvShows(page: number = 1): Promise<PagedTvShowsResponse> {
    const params = {
        page,
        sort_by: 'popularity.desc',
        without_genres: '10764,10767,10766,10763'
    };

    const arPagedResponse = await fetchTmdb('discover/tv', PagedTvShowsResponseSchema, 'ar-SA', params);
    const enPagedResponse = await fetchTmdb('discover/tv', PagedTvShowsResponseSchema, 'en-US', params);

    if (arPagedResponse && arPagedResponse.results && enPagedResponse && enPagedResponse.results) {
        arPagedResponse.results = mergeWithEnglishTitles(arPagedResponse.results, enPagedResponse.results);
    }
    return arPagedResponse;
}

/**
 * Fetches popular Japanese Anime (TV Shows with genre ID 16 from Japan)
 * that have at least 350 user votes from TMDB.
 * Returns a paged response with Arabic details but English names.
 * @param page - The page number to fetch.
 * @returns A promise resolving to the paged response of popular Japanese anime shows with English names.
 */
export async function getPopularAnime(page: number = 1): Promise<PagedTvShowsResponse> {
    const params = {
        page,
        with_genres: 16,
        with_origin_country: 'JP',
        "vote_count.gte": 350,
        sort_by: 'popularity.desc'
    };

    const arPagedResponse = await fetchTmdb('discover/tv', PagedTvShowsResponseSchema, 'ar-SA', params);
    const enPagedResponse = await fetchTmdb('discover/tv', PagedTvShowsResponseSchema, 'en-US', params);

    if (arPagedResponse && arPagedResponse.results && enPagedResponse && enPagedResponse.results) {
        arPagedResponse.results = mergeWithEnglishTitles(arPagedResponse.results, enPagedResponse.results);
    }
    return arPagedResponse;
}

/**
 * Fetches details for a specific movie by its ID, including credits, videos, and keywords.
 * Returns Arabic details with the English title merged in.
 * @param movieId - The ID of the movie to fetch.
 * @returns A promise resolving to the movie details with an English title.
 */
export async function getMovieDetails(movieId: number): Promise<MovieDetail> {
    const appendToResponse = 'credits,videos,keywords';
    
    // Fetch details in Arabic (default language)
    const arDetails = await fetchTmdb(
        `movie/${movieId}`,
        MovieDetailSchema,
        'ar-SA',
        { append_to_response: appendToResponse }
    );

    // Fetch details in English
    const enDetails = await fetchTmdb(
        `movie/${movieId}`,
        MovieDetailSchema,
        'en-US',
        { append_to_response: appendToResponse } // Append same fields for consistency if needed
    );

    // Merge English title into Arabic details
    if (arDetails && enDetails && enDetails.title) {
        arDetails.title = enDetails.title;
        // Note: arDetails.original_title remains the Arabic original title
    }

    return arDetails;
}

/**
 * Fetches details for a specific TV show by its ID, including credits, videos, and keywords.
 * Returns Arabic details with the English name merged in.
 * @param tvId - The ID of the TV show to fetch.
 * @returns A promise resolving to the TV show details with an English name.
 */
export async function getTvShowDetails(tvId: number): Promise<TvShowDetail> {
    const appendToResponse = 'credits,videos,keywords';

    // Fetch details in Arabic
    const arDetails = await fetchTmdb(
        `tv/${tvId}`,
        TvShowDetailSchema,
        'ar-SA',
        { append_to_response: appendToResponse }
    );

    // Fetch details in English
    const enDetails = await fetchTmdb(
        `tv/${tvId}`,
        TvShowDetailSchema,
        'en-US',
        { append_to_response: appendToResponse }
    );

    // Merge English name into Arabic details
    if (arDetails && enDetails && enDetails.name) {
        arDetails.name = enDetails.name;
        // Note: arDetails.original_name remains the Arabic original name
    }

    return arDetails;
}

/**
 * Fetches details for a specific TV show season, including episodes.
 * @param tvId - The ID of the TV show.
 * @param seasonNumber - The season number to fetch.
 * @returns A promise resolving to the season details.
 */
export async function getSeasonDetails(
    tvId: number,
    seasonNumber: number
): Promise<SeasonDetail> {
    return fetchTmdb(`tv/${tvId}/season/${seasonNumber}`, SeasonDetailSchema);
}

/**
 * Searches for movies on TMDB.
 * Returns Arabic results with English titles.
 * @param query - The search query string.
 * @param page - The page number to fetch.
 * @returns A promise resolving to the paged response of movie search results with English titles.
 */
export async function searchMovies(query: string, page: number = 1): Promise<PagedMoviesResponse> {
    const params = { query, page };
    const arPagedResponse = await fetchTmdb('search/movie', PagedMoviesResponseSchema, 'ar-SA', params);
    const enPagedResponse = await fetchTmdb('search/movie', PagedMoviesResponseSchema, 'en-US', params);

    if (arPagedResponse && arPagedResponse.results && enPagedResponse && enPagedResponse.results) {
        arPagedResponse.results = mergeWithEnglishTitles(arPagedResponse.results, enPagedResponse.results);
    }
    return arPagedResponse;
}

/**
 * Searches for TV shows on TMDB.
 * Returns Arabic results with English names.
 * @param query - The search query string.
 * @param page - The page number to fetch.
 * @returns A promise resolving to the paged response of TV show search results with English names.
 */
export async function searchTvShows(query: string, page: number = 1): Promise<PagedTvShowsResponse> {
    const params = { query, page };
    const arPagedResponse = await fetchTmdb('search/tv', PagedTvShowsResponseSchema, 'ar-SA', params);
    const enPagedResponse = await fetchTmdb('search/tv', PagedTvShowsResponseSchema, 'en-US', params);

    if (arPagedResponse && arPagedResponse.results && enPagedResponse && enPagedResponse.results) {
        arPagedResponse.results = mergeWithEnglishTitles(arPagedResponse.results, enPagedResponse.results);
    }
    return arPagedResponse;
}

/**
 * Searches across movies, TV shows, and people.
 * Returns Arabic results, but movie/TV titles/names are replaced with English.
 * @param query - The search query string.
 * @param page - The page number to fetch.
 * @returns A promise resolving to the paged response of multi-search results with English titles/names for media.
 */
export async function searchMulti(query: string, page: number = 1): Promise<PagedMultiSearchResponse> {
    const params = { query, page };
    const arPagedResponse = await fetchTmdb('search/multi', PagedMultiSearchResponseSchema, 'ar-SA', params);
    const enPagedResponse = await fetchTmdb('search/multi', PagedMultiSearchResponseSchema, 'en-US', params);

    if (arPagedResponse && arPagedResponse.results && enPagedResponse && enPagedResponse.results) {
        const enItemsMap = new Map(enPagedResponse.results.map(item => [item.id, item]));
        
        arPagedResponse.results = arPagedResponse.results.map(arItem => {
            const enItem = enItemsMap.get(arItem.id);
            if (enItem) {
                if (arItem.media_type === 'movie' && enItem.media_type === 'movie' && 'title' in arItem && 'title' in enItem) {
                    arItem.title = enItem.title;
                } else if (arItem.media_type === 'tv' && enItem.media_type === 'tv' && 'name' in arItem && 'name' in enItem) {
                    arItem.name = enItem.name;
                }
                // Person names remain Arabic (as fetched in arPagedResponse)
            }
            return arItem;
        });
    }
    return arPagedResponse;
}

/**
 * Fetches details for a specific collection by its ID.
 * Returns Arabic details with the English collection name and English movie titles merged in.
 * @param collectionId - The ID of the collection to fetch.
 * @returns A promise resolving to the collection details with English names/titles.
 */
export async function getCollectionDetails(collectionId: number): Promise<CollectionDetail> {
    // Fetch collection details in Arabic
    const arDetails = await fetchTmdb(
        `collection/${collectionId}`,
        CollectionDetailSchema,
        'ar-SA'
    );

    // Fetch collection details in English
    const enDetails = await fetchTmdb(
        `collection/${collectionId}`,
        CollectionDetailSchema,
        'en-US'
    );

    // Merge English name and part titles into Arabic details
    if (arDetails && enDetails) {
        if (enDetails.name) {
            arDetails.name = enDetails.name;
        }
        if (arDetails.parts && enDetails.parts) {
            // Use the helper to merge titles for the movie parts
            arDetails.parts = mergeWithEnglishTitles(arDetails.parts, enDetails.parts);
        }
    }

    return arDetails;
}

// --- Genre Functions ---
let genreCache: { movie: Genre[], tv: Genre[] } | null = null;

/**
 * Fetches movie or TV genres from TMDB and caches them.
 * @param type - 'movie' or 'tv'
 * @returns A promise resolving to an array of genres.
 */
async function fetchAndCacheGenres(type: 'movie' | 'tv'): Promise<Genre[]> {
    if (genreCache && genreCache[type]?.length > 0) {
        return genreCache[type];
    }

    const endpoint = `genre/${type}/list`;
    const response = await fetchTmdb(endpoint, GenresResponseSchema);

    if (!genreCache) {
        genreCache = { movie: [], tv: [] };
    }
    genreCache[type] = response.genres;

    return response.genres;
}

/**
 * Gets a map of genre IDs to genre names for movies.
 * @returns A promise resolving to a Map<number, string>.
 */
export async function getMovieGenres(): Promise<Genre[]> {
    return fetchAndCacheGenres('movie');
}

/**
 * Gets a map of genre IDs to genre names for TV shows.
 * @returns A promise resolving to a Map<number, string>.
 */
export async function getTvGenres(): Promise<Genre[]> {
    return fetchAndCacheGenres('tv');
}

// --- Detail Functions ---

/**
 * Fetches details for a specific person by their ID.
 * @param personId - The ID of the person to fetch.
 * @returns A promise resolving to the person details.
 */
export async function getPersonDetails(personId: number): Promise<PersonDetail> {
    return fetchTmdb(`person/${personId}`, PersonDetailSchema);
}

/**
 * Fetches combined movie and TV credits for a specific person.
 * @param personId - The ID of the person.
 * @returns A promise resolving to the person's combined credits.
 */
export async function getPersonCombinedCredits(personId: number): Promise<PersonCombinedCredits> {
    // language param ensures titles within credits are translated if available
    return fetchTmdb(`person/${personId}/combined_credits`, PersonCombinedCreditsSchema);
}

// --- Search Functions ---

// Example function to construct full image URLs
export function getImageUrl(path: string | null | undefined, size: string = POSTER_SIZE): string | null {
    if (!path) {
        return null; // Or return a placeholder image URL
    }
    // Ensure IMAGE_BASE_URL ends with a '/'
    const baseUrl = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL : `${IMAGE_BASE_URL}/`;
    // Ensure size doesn't start or end with a '/'
    const cleanSize = size.replace(/^\/+|\/+$/g, '');
    // Ensure path starts with a '/'
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Construct the URL correctly: baseUrl + size + path
    // Example: https://image.tmdb.org/t/p/ + w500 + /abc.jpg
    return `${baseUrl}${cleanSize}${cleanPath}`
}

// Example: Recommendation functions return Movie[] or TvShow[]. They should also be modified

export async function getMovieRecommendations(id: number, page: number = 1): Promise<Movie[]> {
    const params = { page };
    try {
        const arPagedResponse = await fetchTmdb(`movie/${id}/recommendations`, PagedMoviesResponseSchema, 'ar-SA', params);
        const enPagedResponse = await fetchTmdb(`movie/${id}/recommendations`, PagedMoviesResponseSchema, 'en-US', params);
        
        if (arPagedResponse?.results && enPagedResponse?.results) {
            return mergeWithEnglishTitles(arPagedResponse.results, enPagedResponse.results);
        }
        return arPagedResponse?.results || [];
    } catch { 
        console.error(`Failed to get recommendations for movie ${id}.`);
        return [];
    }
}

export async function getTvShowRecommendations(id: number, page: number = 1): Promise<TvShow[]> {
     const params = { page };
    try {
        const arPagedResponse = await fetchTmdb(`tv/${id}/recommendations`, PagedTvShowsResponseSchema, 'ar-SA', params);
        const enPagedResponse = await fetchTmdb(`tv/${id}/recommendations`, PagedTvShowsResponseSchema, 'en-US', params);
        
        if (arPagedResponse?.results && enPagedResponse?.results) {
            return mergeWithEnglishTitles(arPagedResponse.results, enPagedResponse.results);
        }
        return arPagedResponse?.results || [];
    } catch { 
        console.error(`Failed to get recommendations for TV show ${id}.`);
        return [];
    }
}

// --- Filtering Types ---

export interface MediaFilters {
    page?: number;
    sort_by?: string;
    with_genres?: string; // Keep as string for comma-separated IDs
    without_genres?: string; // Keep as string for comma-separated IDs
    primary_release_year?: number;
    first_air_date_year?: number;
    with_original_language?: string;
    with_origin_country?: string;
    'vote_count.gte'?: number;
    // Adjust index signature to match fetchTmdb's extraParams exactly
    [key: string]: string | number | boolean | undefined;
}

// --- Updated Discover Functions ---

/**
 * Discovers movies based on filters.
 * Returns a paged response with Arabic details but English titles.
 * @param filters - Filtering options.
 * @returns A promise resolving to the paged response of discovered movies with English titles.
 */
export async function discoverMovies(filters: MediaFilters = {}): Promise<PagedMoviesResponse> {
    const { page = 1, sort_by = 'popularity.desc', ...restFilters } = filters;
    const movieFilters = { ...restFilters, primary_release_year: filters.primary_release_year };
    delete movieFilters.first_air_date_year;
    delete movieFilters.with_origin_country;

    const params = { page, sort_by, ...movieFilters };

    const arPagedResponse = await fetchTmdb('discover/movie', PagedMoviesResponseSchema, 'ar-SA', params);
    const enPagedResponse = await fetchTmdb('discover/movie', PagedMoviesResponseSchema, 'en-US', params);

    if (arPagedResponse && arPagedResponse.results && enPagedResponse && enPagedResponse.results) {
        arPagedResponse.results = mergeWithEnglishTitles(arPagedResponse.results, enPagedResponse.results);
    }
    return arPagedResponse;
}

/**
 * Discovers TV shows based on filters.
 * Returns a paged response with Arabic details but English names.
 * @param filters - Filtering options.
 * @returns A promise resolving to the paged response of discovered TV shows with English names.
 */
export async function discoverTvShows(filters: MediaFilters = {}): Promise<PagedTvShowsResponse> {
    const { page = 1, sort_by = 'popularity.desc', ...restFilters } = filters;
    const tvFilters = { ...restFilters, first_air_date_year: filters.first_air_date_year };
    delete tvFilters.primary_release_year;

    const defaultExclusions = '10764,10767,10766,10763,16'; // Also exclude anime
    let exclusions = tvFilters.without_genres ? tvFilters.without_genres.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (!tvFilters.with_genres) {
        exclusions = [...exclusions, ...defaultExclusions.split(',')];
    }
    tvFilters.without_genres = [...new Set(exclusions)].join(',');

    const params = { page, sort_by, ...tvFilters };

    const arPagedResponse = await fetchTmdb('discover/tv', PagedTvShowsResponseSchema, 'ar-SA', params);
    const enPagedResponse = await fetchTmdb('discover/tv', PagedTvShowsResponseSchema, 'en-US', params);

    if (arPagedResponse && arPagedResponse.results && enPagedResponse && enPagedResponse.results) {
        arPagedResponse.results = mergeWithEnglishTitles(arPagedResponse.results, enPagedResponse.results);
    }
    return arPagedResponse;
}

/**
 * Discovers Anime (TV shows from Japan with Animation genre) based on filters.
 * Returns a paged response with Arabic details but English names.
 * @param filters - Filtering options.
 * @returns A promise resolving to the paged response of discovered anime shows with English names.
 */
export async function discoverAnime(filters: MediaFilters = {}): Promise<PagedTvShowsResponse> {
    const baseParams: MediaFilters = {
        with_genres: '16',
        with_origin_country: 'JP',
        'vote_count.gte': 100,
        ...filters,
    };
    
    const { page = 1, sort_by = 'popularity.desc', ...restApiFilters } = baseParams;
    const params = { page, sort_by, ...restApiFilters };

    // console.log("--- Discovering Anime with Params: ---", params); 
    const arPagedResponse = await fetchTmdb('discover/tv', PagedTvShowsResponseSchema, 'ar-SA', params);
    const enPagedResponse = await fetchTmdb('discover/tv', PagedTvShowsResponseSchema, 'en-US', params);

    if (arPagedResponse && arPagedResponse.results && enPagedResponse && enPagedResponse.results) {
        arPagedResponse.results = mergeWithEnglishTitles(arPagedResponse.results, enPagedResponse.results);
    }
    return arPagedResponse;
}

// --- Functions to Fetch Filter Data ---

// let languageCache: Language[] | null = null; // Unused
export async function getLanguages(): Promise<Language[]> {
    // Return a predefined list instead of fetching from API
    // Ensure the structure matches the Language type { iso_639_1, english_name, name }
    const popularLanguages: Language[] = [
        { iso_639_1: 'en', english_name: 'English', name: 'English' },
        { iso_639_1: 'ja', english_name: 'Japanese', name: '日本語' },
        { iso_639_1: 'es', english_name: 'Spanish', name: 'Español' },
        { iso_639_1: 'fr', english_name: 'French', name: 'Français' },
        { iso_639_1: 'ko', english_name: 'Korean', name: '한국어/조선말' },
        { iso_639_1: 'de', english_name: 'German', name: 'Deutsch' },
        { iso_639_1: 'zh', english_name: 'Chinese', name: '普通话' }, // Mandarin
        { iso_639_1: 'hi', english_name: 'Hindi', name: 'हिन्दी' },
        { iso_639_1: 'it', english_name: 'Italian', name: 'Italiano' },
        { iso_639_1: 'ru', english_name: 'Russian', name: 'Pусский' },
        { iso_639_1: 'pt', english_name: 'Portuguese', name: 'Português' },
        { iso_639_1: 'ar', english_name: 'Arabic', name: 'العربية' },
        { iso_639_1: 'tr', english_name: 'Turkish', name: 'Türkçe' },
        { iso_639_1: 'sv', english_name: 'Swedish', name: 'svenska' },
        { iso_639_1: 'nl', english_name: 'Dutch', name: 'Nederlands' },
        { iso_639_1: 'pl', english_name: 'Polish', name: 'Polski' },
        { iso_639_1: 'no', english_name: 'Norwegian', name: 'Norsk' },
        { iso_639_1: 'fi', english_name: 'Finnish', name: 'suomi' },
        { iso_639_1: 'da', english_name: 'Danish', name: 'Dansk' },
        { iso_639_1: 'th', english_name: 'Thai', name: 'ภาษาไทย' },
        // Add more or adjust as needed
    ];
    return popularLanguages; // Return the hardcoded list directly
}

// Return a hardcoded list of popular countries
export async function getCountries(): Promise<Country[]> {
    // Return a predefined list instead of fetching from API
    // Ensure the structure matches the Country type { iso_3166_1, english_name, native_name? }
    const popularCountries: Country[] = [
        { iso_3166_1: 'US', english_name: 'United States of America' },
        { iso_3166_1: 'JP', english_name: 'Japan' },
        { iso_3166_1: 'GB', english_name: 'United Kingdom' },
        { iso_3166_1: 'KR', english_name: 'South Korea' },
        { iso_3166_1: 'IN', english_name: 'India' },
        { iso_3166_1: 'FR', english_name: 'France' },
        { iso_3166_1: 'CA', english_name: 'Canada' },
        { iso_3166_1: 'CN', english_name: 'China' },
        { iso_3166_1: 'DE', english_name: 'Germany' },
        { iso_3166_1: 'ES', english_name: 'Spain' },
        { iso_3166_1: 'AU', english_name: 'Australia' },
        { iso_3166_1: 'IT', english_name: 'Italy' },
        { iso_3166_1: 'RU', english_name: 'Russia' },
        { iso_3166_1: 'BR', english_name: 'Brazil' },
        { iso_3166_1: 'MX', english_name: 'Mexico' },
        { iso_3166_1: 'SE', english_name: 'Sweden' }, // Added Sweden
        { iso_3166_1: 'NO', english_name: 'Norway' }, // Added Norway
        { iso_3166_1: 'DK', english_name: 'Denmark' }, // Added Denmark
        { iso_3166_1: 'TR', english_name: 'Turkey' }, // Added Turkey
        { iso_3166_1: 'HK', english_name: 'Hong Kong' }, // Added Hong Kong
        // Add more or adjust as needed
    ];
    return popularCountries; // Return the hardcoded list directly
}

// --- Schemas for Configuration Data ---
// Restore schemas as types are derived from them
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LanguageSchema = z.object({ 
    iso_639_1: z.string(), // e.g., "en"
    english_name: z.string(), // e.g., "English"
    name: z.string(), // e.g., "English" or native name
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CountrySchema = z.object({ 
    iso_3166_1: z.string(), // e.g., "US"
    english_name: z.string(), // e.g., "United States of America"
    native_name: z.string().optional(), // Native name
});

// --- Type Definitions (Ensure all used types are defined) ---
export type Language = z.infer<typeof LanguageSchema>;
export type Country = z.infer<typeof CountrySchema>;

// --- Sitemap Specific Fetching Functions ---

// Define a more generic PagedResponse type that matches the structure of PagedMoviesResponse, PagedTvShowsResponse etc.
interface SitemapPagedResponse<TItem> {
    page: number;
    results: TItem[];
    total_pages: number;
    total_results: number;
}

// New helper function to fetch English versions of titles/names
async function fetchEnglishVersions(
    items: Array<{ id: number; title?: string; name?: string }>, // Basic items with ID
    mediaType: 'movie' | 'tv'
): Promise<Map<number, string>> {
    const englishTitlesMap = new Map<number, string>();
    if (!items || items.length === 0) {
        return englishTitlesMap;
    }

    // TMDB API can be sensitive to too many concurrent requests.
    // A small batch size is safer. Consider making this configurable or using a queue if issues arise.
    const batchSize = 10; 

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const promises = batch.map(async (item) => {
            try {
                if (mediaType === 'movie') {
                    // Fetch only the English title, no need for full append_to_response here
                    const enDetails = await fetchTmdb(`/movie/${item.id}`, MovieDetailSchema, 'en-US');
                    if (enDetails && enDetails.title) {
                        englishTitlesMap.set(item.id, enDetails.title);
                    }
                } else if (mediaType === 'tv') {
                     // Fetch only the English name
                    const enDetails = await fetchTmdb(`/tv/${item.id}`, TvShowDetailSchema, 'en-US');
                    if (enDetails && enDetails.name) {
                        englishTitlesMap.set(item.id, enDetails.name);
                    }
                }
            } catch (error) {
                // Log a warning but don't let one failed fetch stop the entire sitemap generation
                console.warn(`Sitemap: Failed to fetch English details for ${mediaType} ID ${item.id}:`, (error as Error)?.message || 'Unknown error');
                // Continue processing other items - this item will just be missing from the englishTitlesMap
            }
        });
        
        // Wait for all promises in the batch to settle (not just resolve)
        await Promise.allSettled(promises);
    }
    return englishTitlesMap;
}

// Modified fetchAllPages to include English title fetching
async function fetchAllPages<TItem extends Movie | TvShow>(
    fetchFunction: (filters: MediaFilters) => Promise<SitemapPagedResponse<TItem>>,
    baseFilters: MediaFilters = {},
    maxPagesToFetch: number = 10, // Default to 10 pages (200 items)
    fetchEnglishTitles: boolean = false, // Parameter to control English title fetching
    mediaTypeForEnglish?: 'movie' | 'tv' // Specify media type for English fetching
): Promise<Array<{ id: number; title?: string; name?: string; release_date?: string; first_air_date?: string }>> {
    let allItems: Array<{ id: number; title?: string; name?: string; release_date?: string; first_air_date?: string }> = [];
    let currentPage = 1;
    const baseLanguage = (baseFilters.language as string) || 'ar-SA';

    try {
        while (currentPage <= maxPagesToFetch) {
            let data: SitemapPagedResponse<TItem> | null = null;
            try {
                // Attempt to fetch the current page
                data = await fetchFunction({ ...baseFilters, page: currentPage, language: baseLanguage });
            } catch (pageFetchError) {
                console.warn(`Sitemap: Failed to fetch page ${currentPage} for ${mediaTypeForEnglish || 'items'}. Error: ${ (pageFetchError as Error)?.message || pageFetchError }. Skipping page.`);
                currentPage++; // Increment to try the next page
                if (currentPage <= maxPagesToFetch) {
                    await new Promise(resolve => setTimeout(resolve, 250)); // Small delay before next attempt
                }
                continue; // Skip to the next iteration of the while loop
            }

            // If data is null or results are missing (e.g., after a caught error or empty response)
            if (!data || !data.results || data.results.length === 0) {
                console.warn(`Sitemap: No data or empty results for page ${currentPage} of ${mediaTypeForEnglish || 'items'}.`);
                // Decide if we should break or continue
                if (data && data.page >= data.total_pages) { // If API says no more pages
                    break;
                }
                currentPage++;
                if (currentPage <= maxPagesToFetch) {
                    await new Promise(resolve => setTimeout(resolve, 250)); 
                }
                continue; 
            }
            
            const itemsWithDates = data.results.map(item => ({
                id: item.id,
                title: (item as Movie).title, 
                name: (item as TvShow).name,   
                release_date: (item as Movie).release_date,
                first_air_date: (item as TvShow).first_air_date,
            }));
            allItems = allItems.concat(itemsWithDates);

            if (data.page >= data.total_pages || data.page >= maxPagesToFetch) {
                break;
            }
            currentPage++;
            if (currentPage <= maxPagesToFetch) {
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        }

        if (fetchEnglishTitles && mediaTypeForEnglish && allItems.length > 0) {
            console.log(`Sitemap: Fetching English titles for ${allItems.length} ${mediaTypeForEnglish} items...`);
            const englishTitlesMap = await fetchEnglishVersions(allItems, mediaTypeForEnglish);
            console.log(`Sitemap: Fetched ${englishTitlesMap.size} English titles.`);
            
            allItems = allItems.map(item => {
                const englishTitleOrName = englishTitlesMap.get(item.id);
                if (mediaTypeForEnglish === 'movie') {
                    return { ...item, title: englishTitleOrName || item.title };
                } else if (mediaTypeForEnglish === 'tv') {
                    return { ...item, name: englishTitleOrName || item.name };
                }
                return item;
            });
        }
    } catch (error) {
        // This outer catch handles errors not caught by the inner page fetch loop (e.g., in fetchEnglishVersions or other logic)
        console.error(`Sitemap: Error in fetchAllPages main block for ${mediaTypeForEnglish || 'items'}:`, (error as Error)?.message || 'Unknown error');
        // Depending on policy, you might want to return allItems collected so far or an empty array
    }
    return allItems;
}

// Constants for sitemap fetching limits
const MAX_SITEMAP_PAGES_MOVIES = 100; // Fetches up to 100 pages (2000 movies if 20 per page)
const MAX_SITEMAP_PAGES_TV = 100;     // Fetches up to 100 pages (2000 TV shows)
const MAX_SITEMAP_PAGES_ANIME = 100;  // Fetches up to 100 pages (2000 anime)

export async function getAllMoviesForSitemap(): Promise<Array<{ id: number; title: string; release_date?: string }>> {
    console.log("Sitemap: Starting to fetch movies...");
    try {
        const movies = await fetchAllPages(
            discoverMovies, // Pass the discoverMovies function directly
            { sort_by: 'vote_count.desc', language: 'ar-SA' }, // Base filters, ensure language is AR for primary details
            MAX_SITEMAP_PAGES_MOVIES,
            true,       // fetchEnglishTitles
            'movie'     // mediaTypeForEnglish
        );
        console.log(`Sitemap: Fetched ${movies.length} raw movie items.`);
        // Only include items with valid data (both ID and title)
        return movies
            .filter(movie => movie.id && movie.title) // Ensure title (now English) exists
            .map(movie => ({ id: movie.id, title: movie.title!, release_date: movie.release_date }));
    } catch (error) {
        console.error("Sitemap: Critical error fetching movies:", error);
        // Return empty array rather than failing the entire sitemap generation
        return [];
    }
}

export async function getAllTvShowsForSitemap(): Promise<Array<{ id: number; name: string; first_air_date?: string }>> {
    console.log("Sitemap: Starting to fetch TV shows...");
    try {
        const tvShows = await fetchAllPages(
            discoverTvShows, // Pass the discoverTvShows function directly
            { sort_by: 'vote_count.desc', language: 'ar-SA' }, // Base filters
            MAX_SITEMAP_PAGES_TV,
            true,        // fetchEnglishTitles
            'tv'         // mediaTypeForEnglish
        );
        console.log(`Sitemap: Fetched ${tvShows.length} raw TV show items.`);
        // Only include items with valid data
        return tvShows
            .filter(tv => tv.id && tv.name) // Ensure name (now English) exists
            .map(tv => ({ id: tv.id, name: tv.name!, first_air_date: tv.first_air_date }));
    } catch (error) {
        console.error("Sitemap: Critical error fetching TV shows:", error);
        // Return empty array rather than failing the entire sitemap generation
        return [];
    }
}

export async function getAllAnimeForSitemap(): Promise<Array<{ id: number; name: string; first_air_date?: string }>> {
    console.log("Sitemap: Starting to fetch anime...");
    try {
        const anime = await fetchAllPages(
            discoverAnime, // Pass the discoverAnime function directly
            { sort_by: 'vote_count.desc', language: 'ar-SA' }, // Base filters (discoverAnime handles with_genres: '16')
            MAX_SITEMAP_PAGES_ANIME,
            true,        // fetchEnglishTitles
            'tv'         // mediaTypeForEnglish (Anime is treated as TV for title fetching)
        );
        console.log(`Sitemap: Fetched ${anime.length} raw anime items.`);
        // Anime usually uses 'name' like TV shows.
        return anime
            .filter(a => a.id && a.name) // Ensure name (now English) exists
            .map(a => ({ id: a.id, name: a.name!, first_air_date: a.first_air_date }));
    } catch (error) {
        console.error("Sitemap: Critical error fetching anime:", error);
        // Return empty array rather than failing the entire sitemap generation
        return [];
    }
}

/**
 * Fetches popular people for the sitemap.
 */
const PagedPeopleResponseSchema = PagedResponseSchema(BasePersonSchema);
export type PagedPeopleResponse = z.infer<typeof PagedPeopleResponseSchema>; // Export type for clarity if needed elsewhere

export async function getPopularPeopleForSitemap(pagesToFetch: number = 5): Promise<Array<{ id: number; name: string }>> {
    console.log(`Fetching ${pagesToFetch} pages of popular people for sitemap...`);
    const allPeople: Array<{ id: number; name: string }> = [];
    
    try {
        for (let currentPage = 1; currentPage <= pagesToFetch; currentPage++) {
            try {
                const response: PagedPeopleResponse = await fetchTmdb(
                    'person/popular', 
                    PagedPeopleResponseSchema, 
                    'en-US',  // Add language parameter
                    { page: currentPage }  // This is now the extraParams argument
                );
                if (response && Array.isArray(response.results)) {
                     response.results.forEach((person: Person) => {
                        allPeople.push({ id: person.id, name: person.name });
                    });
                } else {
                     console.warn(`No results found for popular people page ${currentPage} or response.results is not an array.`);
                }
                if (currentPage >= response.total_pages) break; 
            } catch (error) {
                console.error(`Error fetching popular people page ${currentPage} for sitemap:`, (error as Error).message);
                // Continue to next page instead of breaking entire function
                continue;
            }
        }
        console.log(`Finished fetching popular people. Total items fetched: ${allPeople.length}`);
        return allPeople;
    } catch (error) {
        console.error("Sitemap: Critical error fetching popular people:", error);
        return []; // Return empty array rather than failing the build
    }
}