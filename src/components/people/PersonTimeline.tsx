'use client';

import { useState } from 'react';
import { PersonMovieCredit, PersonTvCredit } from '@/lib/tmdb';
import { MediaItemCard } from '@/components/media/MediaItemCard';

type Credit = PersonMovieCredit | PersonTvCredit;

export interface CategorizedCredits {
    acting: Credit[];
    directing: Credit[];
    writing: Credit[];
    production: Credit[];
}

export interface YearCredits {
    [year: string]: CategorizedCredits;
}

interface PersonTimelineProps {
    credits: YearCredits;
}

const categoryNames = {
    acting: 'تمثيل',
    directing: 'إخراج',
    writing: 'كتابة',
    production: 'إنتاج',
};

export function PersonTimeline({ credits }: PersonTimelineProps) {
    const years = Object.keys(credits).sort((a, b) => Number(b) - Number(a));
    const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

    const toggleYear = (year: string) => {
        const newExpanded = new Set(expandedYears);
        if (newExpanded.has(year)) {
            newExpanded.delete(year);
        } else {
            newExpanded.add(year);
        }
        setExpandedYears(newExpanded);
    };

    if (years.length === 0) {
        return <p>لا توجد أعمال متاحة.</p>;
    }

    return (
        <div className="space-y-6">
            {years.map(year => {
                const isExpanded = expandedYears.has(year);
                const totalCredits = Object.values(credits[year]).flat().length;
                
                return (
                    <div key={year} className="border border-border rounded-lg overflow-hidden">
                        {/* Year header - clickable */}
                        <button
                            onClick={() => toggleYear(year)}
                            className="w-full bg-muted/50 hover:bg-muted px-4 py-3 flex items-center justify-between transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold">{year}</h2>
                                <span className="text-sm text-muted-foreground">
                                    {totalCredits} أعمال
                                </span>
                            </div>
                            <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                ▶
                            </div>
                        </button>

                        {/* Content - expandable */}
                        {isExpanded && (
                            <div className="p-4 bg-card">
                                {Object.entries(categoryNames).map(([key, name]) => {
                                    const categoryCredits = credits[year][key as keyof CategorizedCredits];
                                    if (categoryCredits.length === 0) return null;

                                    return (
                                        <div key={key} className="mb-6 last:mb-0">
                                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                {name} ({categoryCredits.length})
                                            </h3>
                                            
                                            {/* Horizontal scrollable row */}
                                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                                                {categoryCredits.map(credit => (
                                                    <div key={credit.credit_id} className="flex-shrink-0 w-24">
                                                        <MediaItemCard item={credit} type={credit.media_type} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}