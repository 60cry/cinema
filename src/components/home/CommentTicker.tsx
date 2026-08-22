'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MessageSquare, Quote, Film, Tv, PlayCircle } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { getImageUrl } from '@/lib/tmdb';
import { CommentWithMedia } from '@/lib/comments';

interface CommentTickerProps {
  comments: CommentWithMedia[];
}

export function CommentTicker({ comments }: CommentTickerProps) {
  if (!comments || comments.length === 0) {
    return null;
  }

  // Ensure we have enough items so a single track is wider than ultra-wide screens (>3000px)
  let displayComments = [...comments];
  while (displayComments.length < 10) {
    displayComments = [...displayComments, ...comments];
  }

  // Calculate duration based on item count (approx 3.5s per card for a steady, readable speed)
  const duration = Math.max(30, displayComments.length * 3.5);

  const getMediaUrl = (comment: CommentWithMedia) => {
    const section =
      comment.media_type === 'movie'
        ? 'movies'
        : comment.media_type === 'anime'
        ? 'tv'
        : comment.media_type;
    return `/${section}/${slugify(comment.media_title)}-${comment.media_id}`;
  };

  const getMediaTypeBadge = (type: string) => {
    switch (type) {
      case 'movie':
        return { label: 'فيلم', icon: Film, className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'anime':
        return { label: 'انمي', icon: PlayCircle, className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      default:
        return { label: 'مسلسل', icon: Tv, className: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
    }
  };

  const renderCommentCard = (comment: CommentWithMedia, key: string) => {
    const badge = getMediaTypeBadge(comment.media_type);
    const BadgeIcon = badge.icon;
    const posterSrc = getImageUrl(comment.media_poster_path, 'w300') || '/placeholder-poster.png';
    const initial = comment.commenter_name?.trim()?.charAt(0)?.toUpperCase() || '؟';

    return (
      <div
        key={key}
        className="w-[300px] sm:w-[340px] shrink-0"
        dir="rtl"
      >
        <Link
          href={getMediaUrl(comment)}
          className="group/card relative flex flex-col h-full bg-card/80 hover:bg-card border border-border/70 hover:border-primary/50 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 backdrop-blur-sm"
        >
          {/* Top Header: Poster + Media Info & Rating */}
          <div className="flex gap-3 items-center mb-3">
            {/* Compact Poster */}
            <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-md border border-border/50 group-hover/card:scale-105 transition-transform duration-300">
              <Image
                src={posterSrc}
                alt={comment.media_title}
                fill
                sizes="60px"
                className="object-cover"
                loading="lazy"
              />
            </div>

            {/* Media Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${badge.className}`}>
                  <BadgeIcon className="w-2.5 h-2.5" />
                  {badge.label}
                </span>

                {comment.rating ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 mr-auto">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    {comment.rating}/10
                  </span>
                ) : null}
              </div>

              <h3
                className="text-xs sm:text-sm font-bold text-foreground group-hover/card:text-primary transition-colors truncate"
                title={comment.media_title}
              >
                {comment.media_title}
              </h3>

              {/* Commenter info */}
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-primary/80 to-primary/30 text-primary-foreground flex items-center justify-center text-[9px] font-bold">
                  {initial}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                  {comment.commenter_name}
                </span>
              </div>
            </div>
          </div>

          {/* Comment Body */}
          <div className="relative flex-1 bg-muted/40 group-hover/card:bg-muted/60 rounded-xl p-2.5 border border-border/40 transition-colors">
            <Quote className="w-3.5 h-3.5 text-primary/40 mb-1" />
            <p
              className="text-xs text-foreground/90 leading-relaxed line-clamp-2"
              title={comment.comment_content}
            >
              {comment.comment_content}
            </p>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <section className="w-full overflow-hidden py-10 relative bg-background border-y border-border/40 select-none group">
      {/* Header */}
      <div className="container mx-auto px-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  أحدث التعليقات والتقييمات
                </h2>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                تفاعل حي ومباشر من مجتمع سينما العرب
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
            <span>مرر المؤشر للإيقاف</span>
          </div>
        </div>
      </div>

      {/* Infinite Seamless Marquee */}
      <div
        className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
        dir="ltr"
      >
        {/* Left & Right Subtle Fade Overlays */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Marquee Track */}
        <div
          className="flex w-max py-2 marquee-track"
          style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
        >
          {/* Primary Track */}
          <div className="flex shrink-0 items-center gap-4 pr-4">
            {displayComments.map((comment, index) =>
              renderCommentCard(comment, `track1-${comment.comment_id}-${index}`)
            )}
          </div>

          {/* Secondary Track (Seamless clone for infinite loop) */}
          <div className="flex shrink-0 items-center gap-4 pr-4" aria-hidden="true">
            {displayComments.map((comment, index) =>
              renderCommentCard(comment, `track2-${comment.comment_id}-${index}`)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}