'use client';

import React from 'react';
import { Movie, TvShow } from "@/lib/tmdb";
import { MediaItemCard } from "@/components/media/MediaItemCard";

interface RecommendedMediaProps {
    items: (Movie | TvShow)[];
    title: string;
    itemType: 'movie' | 'tv' | 'anime';
    className?: string; // Add className prop
}

export function RecommendedMedia({ items, title, itemType, className }: RecommendedMediaProps) {
    if (!items || items.length === 0) {
        return null;
    }

    const displayItems = items.slice(0, 15); 

    return (
        <section className={["container mx-auto px-4 py-8", className].filter(Boolean).join(' ')}>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">{title}</h2>
            <div 
                className="flex overflow-x-auto space-x-4 p-2 w-full"
                style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x mandatory',
                    cursor: 'grab'
                }}
            >
                {displayItems.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-48" style={{ scrollSnapAlign: 'start' }}>
                        <MediaItemCard item={item} type={itemType} className="w-full h-full" />
                    </div>
                ))}
            </div>
        </section>
    );
} 