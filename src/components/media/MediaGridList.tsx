'use client';

import React, { useState } from 'react';
import { Movie, TvShow } from "@/lib/tmdb";
import { MediaItemCard } from "./MediaItemCard";

interface MediaGridListProps {
    title: string;
    items: (Movie | TvShow)[];
    type: 'movie' | 'tv' | 'anime';
    viewMoreLink?: string;
    className?: string;
    initialCount?: number;
}

export function MediaGridList({ 
    title, 
    items, 
    type, 
    viewMoreLink, 
    className,
    initialCount = 6 
}: MediaGridListProps) {
    const [showMore, setShowMore] = useState(false);
    
    if (!items || items.length === 0) {
        return null;
    }

    // Show initial items or all if showMore is true
    const displayedItems = showMore ? items : items.slice(0, initialCount);

    return (
        <section className={["mb-6 w-full", className].filter(Boolean).join(' ')} dir="rtl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-4 px-2 sm:px-6 gap-2 sm:gap-0">
                <h2 className="text-lg sm:text-2xl font-semibold tracking-tight text-right">{title}</h2>
                {viewMoreLink && (
                    <a href={viewMoreLink} className="text-blue-600 underline-offset-4 hover:underline dark:text-blue-400 text-xs sm:text-base">
                        المزيد »
                    </a>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-5 px-2 sm:px-6">
                {displayedItems.map((item) => (
                    <MediaItemCard key={`${type}-${item.id}`} item={item} type={type} />
                ))}
            </div>

            {!showMore && items.length > initialCount && (
                <div className="flex justify-center mt-3 sm:mt-6">
                    <button 
                        onClick={() => setShowMore(true)}
                        className="px-4 sm:px-6 text-xs sm:text-base border border-border bg-card text-foreground hover:bg-secondary active:bg-secondary/80 rounded-md h-10 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 w-full max-w-xs"
                    >
                        عرض المزيد
                    </button>
                </div>
            )}
        </section>
    );
} 