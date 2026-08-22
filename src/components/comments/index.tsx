'use client'; // This component will be a client component

import { useState, useEffect, FormEvent, FC } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';

import { useRouter } from 'next/navigation'; // Import useRouter

// Interfaces
export interface Comment { // Exporting Comment interface
  id: string;
  created_at: string;
  name: string;
  content: string;
  rating?: number | null; // Rating is optional and can be null
  parent_id?: string | null; // For replies later
  upvote_count: number; // Derived from upvotes table
  user_has_upvoted: boolean; // Client-side state based on user_identifier
  replies?: Comment[]; // Added for nesting replies
}

interface CommentSectionProps {
  mediaId: string;
  mediaType: 'movie' | 'tv' | 'anime';
  initialComments?: Comment[]; // Added for SSR
}

interface DisplayStarsProps {
    rating: number | null | undefined;
    totalStars?: number;
}

interface CommentItemProps {
    comment: Comment;
    onReply: (commentId: string, name: string) => void; // Updated signature
    onUpvote: (commentId: string) => Promise<void>;
    currentUserId: string | null;
    level?: number; // For indentation of replies
}

// Helper to get or create a unique user identifier from localStorage
const getAnonymousUserId = () => {
  if (typeof window !== 'undefined') { // Ensure localStorage is only accessed client-side
    let userId = localStorage.getItem('anonymousUserId');
    if (!userId) {
      userId = crypto.randomUUID(); // Modern browser API for UUIDs
      localStorage.setItem('anonymousUserId', userId);
    }
    return userId;
  }
  return null;
};

// DisplayStars Component
const DisplayStars: FC<DisplayStarsProps> = ({ rating, totalStars = 10 }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (rating === null || rating === undefined || rating < 1 || rating > totalStars) return null;

    // For mobile, only show 5 stars and scale the rating
    const isMobile = isClient && typeof window !== 'undefined' && window.innerWidth < 640;
    const visibleStars = isMobile ? Math.min(5, totalStars) : totalStars;
    const scaledRating = isMobile && totalStars > 5 ?
        Math.round((rating / totalStars) * 5) : rating;

    return (
        <div className="flex items-center flex-wrap">
            {[...Array(visibleStars)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <Star
                        key={index}
                        className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${
                        isMobile ?
                            (starValue <= scaledRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600') :
                            (starValue <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600')
                        }`}
                    />
                );
            })}
            {rating && totalStars && (
                <span className="ml-1.5 sm:ml-2 rtl:mr-1.5 sm:rtl:mr-2 text-xs sm:text-sm text-muted-foreground">
                ({rating}/{totalStars})
                </span>
            )}
        </div>
    );
};

// CommentItem Component
const CommentItem: FC<CommentItemProps> = ({ comment, onReply, onUpvote, currentUserId, level = 0 }) => {
    const handleReplyClick = () => {
        onReply(comment.id, comment.name);
    };

    const handleUpvoteClick = async () => {
        if (!currentUserId) return;
        await onUpvote(comment.id);
    };

    const nameTrimmed = comment.name.trim();
    const initials = nameTrimmed ? nameTrimmed.charAt(0).toUpperCase() : '?';

    return (
        <div className={`mb-3 sm:mb-4 ${level > 0 ? 'mt-3 sm:mt-4' : ''} ${level > 0 ? `mr-2 sm:mr-4 md:mr-8` : ''}`}>
        <article className="p-3 sm:p-4 bg-card border border-border/70 rounded-lg sm:rounded-xl">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
                <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-full bg-muted flex items-center justify-center text-primary font-semibold text-sm sm:text-base md:text-lg">
                {initials}
                </div>
                <h4 className="text-xs sm:text-sm md:text-base font-semibold text-foreground truncate" title={comment.name}>{comment.name}</h4>
            </div>
            <time dateTime={comment.created_at} className="text-xxs sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap flex-shrink-0 ml-2 rtl:ml-0 rtl:mr-2">
                {new Date(comment.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </time>
            </div>

            {comment.rating && !comment.parent_id && (
            <div className="mb-2 sm:mb-3">
                <DisplayStars rating={comment.rating} />
            </div>
            )}
            
            <p className="text-xs sm:text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-line break-words">
            {comment.content}
            </p>

            <div className="mt-2 sm:mt-3 pt-2 border-t border-border/80 flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
            <button
                onClick={handleUpvoteClick}
                disabled={!currentUserId}
                className={`flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse text-xs sm:text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-card rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 ${comment.user_has_upvoted ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-foreground'}`}
                aria-pressed={comment.user_has_upvoted}
                aria-label={comment.user_has_upvoted ? 'إلغاء الإعجاب' : 'إعجاب بالتعليق'}
            >
                <ThumbsUp className={`w-3 h-3 sm:w-4 sm:h-4 ${comment.user_has_upvoted ? 'fill-current' : ''}`} />
                <span>{comment.upvote_count ?? 0}</span>
            </button>
            <button 
                onClick={handleReplyClick} 
                className="flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-card rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1"
                aria-label="رد على هذا التعليق"
            >
                <MessageSquare size={14} className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>رد</span>
            </button>
            </div>
        </article>

        {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-0 pl-0"> 
            {comment.replies.map(reply => (
                <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onUpvote={onUpvote}
                currentUserId={currentUserId}
                level={level + 1}
                />
            ))}
            </div>
        )}
        </div>
    );
};

// CommentSection Component
export function CommentSection({ mediaId, mediaType, initialComments }: CommentSectionProps) {
  const router = useRouter(); // Initialize useRouter
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Combined loading state for fetch and submit
  const [error] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [anonymousUserId, setAnonymousUserId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState<string | null>(null);

  useEffect(() => {
    setAnonymousUserId(getAnonymousUserId());
  }, []);

  useEffect(() => {
    if (!anonymousUserId || !initialComments || initialComments.length === 0) {
        if (initialComments && initialComments.length > 0) {
            setComments(initialComments);
        }
        return;
    }

    const hydrateUpvoteStatus = async (commentTree: Comment[]): Promise<Comment[]> => {
      const allCommentIds: string[] = [];
      const collectIds = (nodes: Comment[]) => {
        nodes.forEach(node => {
          allCommentIds.push(node.id);
          if (node.replies) collectIds(node.replies);
        });
      };
      collectIds(commentTree);

      if (allCommentIds.length === 0) return commentTree;

      const { data: userUpvotes, error: upvotesError } = await supabase
        .from('comment_upvotes')
        .select('comment_id')
        .eq('user_identifier', anonymousUserId)
        .in('comment_id', allCommentIds);

      if (upvotesError) {
        console.error("Error fetching user upvotes for hydration:", upvotesError);
        return commentTree;
      }

      const userUpvotedIds = new Set(userUpvotes?.map(upvote => upvote.comment_id) || []);

      const updateNodes = (nodes: Comment[]): Comment[] => {
        return nodes.map(node => ({
          ...node,
          user_has_upvoted: userUpvotedIds.has(node.id),
          replies: node.replies ? updateNodes(node.replies) : [],
        }));
      };
      return updateNodes(commentTree);
    };

    const commentsToHydrate = JSON.parse(JSON.stringify(initialComments));

    hydrateUpvoteStatus(commentsToHydrate).then(hydratedComments => {
      setComments(hydratedComments);
    });

  }, [initialComments, anonymousUserId]);



  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newContent.trim()) {
      setSubmitError('الاسم والتعليق لا يمكن أن يكونا فارغين.');
      return;
    }
    if (newName.length > 100) {
      setSubmitError('الاسم لا يمكن أن يتجاوز 100 حرف.');
      return;
    }
    if (newContent.length > 5000) {
      setSubmitError('التعليق لا يمكن أن يتجاوز 5000 حرف.');
      return;
    }
    if (!currentRating && !replyingToCommentId) {
      setSubmitError('يرجى تقديم تقييم (1-10 نجوم).');
      return;
    }
    if(replyingToCommentId && !newContent.trim()){
        setSubmitError('التعليق لا يمكن أن يكون فارغاً.');
        return;
    }

    setIsLoading(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim(),
          content: newContent.trim(),
          mediaId: mediaId,
          mediaType: mediaType,
          rating: replyingToCommentId ? null : currentRating,
          parentId: replyingToCommentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'فشل إرسال التعليق' }));
        const errorMsg = errorData.error?.message || (typeof errorData.error === 'string' ? errorData.error : 'فشل إرسال التعليق. يرجى المحاولة مرة أخرى.');
        setSubmitError(errorMsg);
        setIsLoading(false);
        return;
      }

      setNewName('');
      setNewContent('');
      setCurrentRating(null);
      setReplyingToCommentId(null);
      setReplyingToName(null);
      
      router.refresh();

    } catch (error: unknown) {
      console.error('Error submitting comment:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل إرسال التعليق. يرجى المحاولة مرة أخرى.';
      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async (commentId: string) => {
    if (!anonymousUserId) return;

    let originalUpvoteStatus: boolean | undefined = undefined;
    let originalUpvoteCount: number | undefined = undefined;

    const findOriginalStatus = (nodes: Comment[]): boolean => {
      for (const node of nodes) {
        if (node.id === commentId) {
          originalUpvoteStatus = node.user_has_upvoted;
          originalUpvoteCount = node.upvote_count;
          return true;
        }
        if (node.replies && findOriginalStatus(node.replies)) {
          return true;
        }
      }
      return false;
    };

    findOriginalStatus(comments);

    if (originalUpvoteStatus === undefined || originalUpvoteCount === undefined) {
      console.error("Comment not found for upvote.");
      return;
    }

    const newOptimisticComments = JSON.parse(JSON.stringify(comments));
    const updateOptimistically = (nodes: Comment[]): boolean => {
      for (const node of nodes) {
        if (node.id === commentId) {
          node.user_has_upvoted = !originalUpvoteStatus;
          node.upvote_count = !originalUpvoteStatus ? originalUpvoteCount! + 1 : originalUpvoteCount! - 1;
          return true;
        }
        if (node.replies && updateOptimistically(node.replies)) {
          return true;
        }
      }
      return false;
    };

    updateOptimistically(newOptimisticComments);
    setComments(newOptimisticComments);

    try {
      if (originalUpvoteStatus) {
        const { error } = await supabase
          .from('comment_upvotes')
          .delete()
          .match({ comment_id: commentId, user_identifier: anonymousUserId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_upvotes')
          .insert({ comment_id: commentId, user_identifier: anonymousUserId });
        if (error) throw error;
      }
    } catch (error: unknown) {
      console.error('Error toggling upvote in DB:', error);
      
      const revertComments = JSON.parse(JSON.stringify(newOptimisticComments));
      const revertOptimisticChange = (nodes: Comment[]): boolean => {
        for (const node of nodes) {
          if (node.id === commentId) {
            node.user_has_upvoted = originalUpvoteStatus!;
            node.upvote_count = originalUpvoteCount!;
            return true;
          }
          if (node.replies && revertOptimisticChange(node.replies)) {
            return true;
          }
        }
        return false;
      };
      revertOptimisticChange(revertComments);
      setComments(revertComments);
    }
  };

  const handleSetReplyTo = (commentId: string, name: string) => {
    setReplyingToCommentId(commentId);
    setReplyingToName(name);
    setNewContent(''); 
    setCurrentRating(null); 
    
    const formElement = document.getElementById('commentForm');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const textareaElement = document.getElementById('commentContent') as HTMLTextAreaElement | null;
    textareaElement?.focus();
  };

  const getTotalCommentCount = (commentTree: Comment[]): number => {
    let count = 0;
    commentTree.forEach(comment => {
        count++; 
        if (comment.replies && comment.replies.length > 0) {
            count += getTotalCommentCount(comment.replies); 
        }
    });
    return count;
  };

  return (
    <section className="container mx-auto px-4 py-8 sm:py-16 antialiased">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6 sm:mb-10 text-center sm:text-right">
        {replyingToCommentId ? `الرد على ${replyingToName}` : 'شاركنا رأيك وتقييمك'}
      </h2>

      <div id="commentForm" className="mb-8 sm:mb-12 p-4 sm:p-6 md:p-8 bg-card border border-border rounded-xl">
        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-4 sm:mb-6">
          {replyingToCommentId ? `كتابة رد على ${replyingToName}` : 'أضف تعليقاً وتقييماً'}
        </h3>
        {replyingToCommentId && replyingToName && (
        <div className="mb-4 p-3 bg-primary/10 rounded-md border border-primary/30 text-sm">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-primary">الرد على: {replyingToName}</p>
            <button
              type="button"
              onClick={() => { setReplyingToCommentId(null); setReplyingToName(null); setNewContent(''); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              إلغاء الرد
            </button>
          </div>
        </div>
        )}
        <form onSubmit={handleSubmitComment} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="commenterName" className="block text-sm font-medium text-muted-foreground mb-1.5">
              الاسم الكامل
            </label>
            <input
              type="text"
              id="commenterName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 block w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-input rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/80 focus:border-primary placeholder:text-muted-foreground/70 text-sm sm:text-base"
              placeholder="مثال: عبدالله محمد"
              maxLength={100}
              required
              disabled={isLoading || !!replyingToCommentId} 
            />
          </div>
          {!replyingToCommentId && ( 
            <div>
              <label htmlFor="commenterRating" className="block text-sm font-medium text-muted-foreground mb-1.5">
                تقييمك (من 1 إلى 10 نجوم)
              </label>
              <div className="flex items-center flex-wrap gap-1">
                {[...Array(10)].map((_, index) => {
                  const ratingValue = index + 1;
                  return (
                    <button
                      type="button"
                      key={ratingValue}
                      onClick={() => setCurrentRating(ratingValue)}
                      className={`p-1 sm:p-1.5 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card ${currentRating === ratingValue ? 'bg-primary/20' : 'hover:bg-muted/70'}`}
                      aria-label={`Rate ${ratingValue} out of 10 stars`}
                    >
                      <Star
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${currentRating && ratingValue <= currentRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-500 hover:text-yellow-400/70'}`}
                      />
                    </button>
                  );
                })}
              </div>
              {currentRating && <p className="text-xs text-muted-foreground pt-1">تقييمك الحالي: {currentRating} من 10</p>}
            </div>
          )}
          <div>
            <label htmlFor="commentContent" className="block text-sm font-medium text-muted-foreground mb-1.5">
              محتوى التعليق
            </label>
            <textarea
              id="commentContent"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-input rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/80 focus:border-primary placeholder:text-muted-foreground/70 text-sm sm:text-base resize-none"
              placeholder="اكتب ما يجول في خاطرك هنا..."
              maxLength={5000}
              required
              disabled={isLoading}
            ></textarea>
          </div>
          {submitError && <p className="text-sm font-medium text-destructive py-1 px-2 bg-destructive/10 rounded-md">{submitError}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 sm:px-8 py-2.5 sm:py-3 border border-transparent text-sm sm:text-base font-semibold rounded-lg shadow-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-card disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جارٍ الإرسال...
              </>
            ) : (
              replyingToCommentId ? 'أرسل الرد' : 'أرسل التعليق والتقييم'
            )}
          </button>
        </form>
      </div>

      {comments.length > 0 && (
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4 sm:mb-8 text-center sm:text-right">
          آراء وتقييمات القراء ({getTotalCommentCount(comments)})
        </h3>
      )}

      {isLoading && comments.length === 0 && !initialComments && <p className="text-center text-muted-foreground py-8">جارٍ تحميل التعليقات...</p>}
      {error && <p className="text-center text-destructive font-medium py-8">{error}</p>}
      
      {comments.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleSetReplyTo}
              onUpvote={handleUpvote}
              currentUserId={anonymousUserId}
              level={0}
            />
          ))}
        </div>
      ) : (
        !isLoading && !error && (
          <div className="text-center py-8 sm:py-12">
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.862 8.25-8.625 8.25S3.75 16.556 3.75 12s3.862-8.25 8.625-8.25S21 7.444 21 12z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12c0 .023 0 .045 0 .068M8.25 12c0 .023 0 .045 0 .068" />
            </svg>
            <p className="mt-4 sm:mt-5 text-lg font-semibold text-muted-foreground">لا توجد تعليقات أو تقييمات بعد</p>
            <p className="mt-1 text-sm text-muted-foreground/80">كن أول من يشارك برأيه وتقييمه!</p>
          </div>
        )
      )}
    </section>
  );
}
