import { supabaseServer } from './supabase';
import { getMovieDetails, getTvShowDetails, Movie, TvShow } from './tmdb';

export interface Comment {
  id: string;
  created_at: string;
  name: string;
  content: string;
  rating?: number | null;
  parent_id?: string | null;
  upvote_count: number;
  user_has_upvoted: boolean;
  replies?: Comment[];
}

export interface CommentWithMedia {
  comment_id: string;
  comment_content: string;
  commenter_name: string;
  media_id: number;
  media_type: 'movie' | 'tv' | 'anime';
  media_title: string;
  media_poster_path: string | null;
  rating?: number | null;
  created_at?: string;
}

/**
 * Builds a hierarchical comment tree from a flat list of comments
 */
export function buildCommentTree(commentList: Comment[]): Comment[] {
  const commentMap: { [key: string]: Comment } = {};
  const topLevelComments: Comment[] = [];

  // Initialize replies array for all comments and populate map
  commentList.forEach(comment => {
    comment.replies = [];
    commentMap[comment.id] = comment;
  });

  // Populate replies
  commentList.forEach(comment => {
    if (comment.parent_id && commentMap[comment.parent_id]) {
      commentMap[comment.parent_id].replies?.push(comment);
    } else {
      topLevelComments.push(comment);
    }
  });

  // Sort top-level comments by creation date (descending - newest first)
  topLevelComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Sort replies within each comment by creation date (ascending - oldest first for replies)
  const sortRepliesRecursive = (commentsToSort: Comment[]) => {
    commentsToSort.forEach(c => {
      if (c.replies && c.replies.length > 0) {
        c.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        sortRepliesRecursive(c.replies);
      }
    });
  };
  sortRepliesRecursive(topLevelComments);

  return topLevelComments;
}

/**
 * Fetches latest approved comments from Supabase and joins them with TMDB media information
 */
export async function getLatestCommentsWithMediaDetails(limit: number = 20): Promise<CommentWithMedia[]> {
  try {
    const { data: comments, error } = await supabaseServer
      .from('comments')
      .select('id, content, name, media_id, media_type, rating, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !comments || comments.length === 0) {
      return [];
    }

    const movieIds = new Set<number>();
    const tvShowIds = new Set<number>();

    comments.forEach(comment => {
      if (comment.media_type === 'movie') {
        movieIds.add(comment.media_id);
      } else if (comment.media_type === 'tv' || comment.media_type === 'anime') {
        tvShowIds.add(comment.media_id);
      }
    });

    const movieDetailsPromises = Array.from(movieIds).map(async id => {
      try {
        return await getMovieDetails(id);
      } catch {
        return null;
      }
    });

    const tvShowDetailsPromises = Array.from(tvShowIds).map(async id => {
      try {
        return await getTvShowDetails(id);
      } catch {
        return null;
      }
    });

    const [movieDetailsRaw, tvShowDetailsRaw] = await Promise.all([
      Promise.all(movieDetailsPromises),
      Promise.all(tvShowDetailsPromises),
    ]);

    const movieDetails = movieDetailsRaw.filter((movie): movie is Movie => movie !== null);
    const tvShowDetails = tvShowDetailsRaw.filter((tvShow): tvShow is TvShow => tvShow !== null);

    const mediaDetailsMap = new Map<string, Movie | TvShow>();
    movieDetails.forEach(movie => {
      mediaDetailsMap.set(`movie-${movie.id}`, movie);
    });
    tvShowDetails.forEach(tvShow => {
      mediaDetailsMap.set(`tv-${tvShow.id}`, tvShow);
    });

    const combinedData: (CommentWithMedia | null)[] = comments.map(comment => {
      const mediaKey = comment.media_type === 'anime' ? `tv-${comment.media_id}` : `${comment.media_type}-${comment.media_id}`;
      const media = mediaDetailsMap.get(mediaKey);

      if (!media) return null;

      return {
        comment_id: comment.id,
        comment_content: comment.content,
        commenter_name: comment.name,
        media_id: comment.media_id,
        media_type: comment.media_type,
        media_title: (media as Movie).title || (media as TvShow).name,
        media_poster_path: media.poster_path,
        rating: comment.rating,
        created_at: comment.created_at,
      };
    });

    return combinedData.filter((item): item is CommentWithMedia => item !== null);
  } catch (err) {
    console.error('Error fetching comments with media details:', err);
    return [];
  }
}