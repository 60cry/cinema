'use client';

import React, { useState } from 'react';
import { Genre, Language, Country } from '@/lib/tmdb'; // Assuming types are exported from tmdb.ts
import { ChevronDown, Filter } from "lucide-react";

// Define a unique, non-empty string for the "All" option
const ALL_VALUE = "__ALL__";

interface MediaFiltersProps {
    genres: Genre[];
    languages: Language[];
    countries?: Country[]; // Optional for movies
    years: number[]; // Array of years, e.g., [2024, 2023, ...]
    sortOptions: { value: string; label: string }[];
    initialFilters: {
        genre?: string;
        year?: number | string; // Allow empty string for "All"
        language?: string;
        country?: string;
        sortBy?: string;
    };
    onFilterChange: (filters: {
        genre?: string;
        year?: number | string;
        language?: string;
        country?: string;
        sortBy?: string;
    }) => void;
    mediaType: 'movie' | 'tv' | 'anime'; // To conditionally show country filter
}

export const MediaFilters: React.FC<MediaFiltersProps> = ({
    genres,
    languages,
    countries,
    years,
    sortOptions,
    initialFilters,
    onFilterChange,
    mediaType,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Handler for Select component (now using pure Tailwind)
    const handleValueChange = (name: string, value: string) => {
        // Treat the special ALL_VALUE as undefined to clear the filter
        const newValue = value === ALL_VALUE ? undefined : value;
        onFilterChange({ ...initialFilters, [name]: newValue });
    };

    const toggleFilters = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="mb-4 py-2 sm:py-4 px-2 sm:px-4 bg-card dark:bg-card/90 rounded-lg shadow-sm border border-border/40 transition-all w-full" dir="rtl">
            {/* Mobile header and toggle */}
            <div className="flex items-center justify-between mb-1 sm:mb-3">
                <h2 className="text-sm sm:text-base font-medium">تصفية النتائج</h2>
                <button 
                    onClick={toggleFilters}
                    className="sm:hidden flex items-center gap-1 p-1 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-md transition-colors h-8 text-xs"
                >
                    <Filter size={16} />
                    <span className="text-xs">{isExpanded ? 'إخفاء' : 'عرض'}</span>
                    <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
            
            {/* Desktop view or expanded mobile view */}
            <div className={`${isExpanded ? 'block' : 'hidden sm:block'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                    {/* Genre Filter */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="genre-select" className="text-xs text-muted-foreground text-right">التصنيف</label>
                        <select id="genre-select" name="genre" value={initialFilters.genre || ''} onChange={e => handleValueChange('genre', e.target.value)} className="w-full h-10 text-right flex-row-reverse text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
                            <option value="__ALL__">الكل</option>
                            {genres.map((genre) => (
                                <option key={genre.id} value={String(genre.id)}>{genre.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Filter */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="year-select" className="text-xs text-muted-foreground text-right">السنة</label>
                        <select id="year-select" name="year" value={String(initialFilters.year || '')} onChange={e => handleValueChange('year', e.target.value)} className="w-full h-10 text-right flex-row-reverse text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
                            <option value="__ALL__">الكل</option>
                            {years.map((year) => (
                                <option key={year} value={String(year)}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Language Filter */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="language-select" className="text-xs text-muted-foreground text-right">اللغة</label>
                        <select id="language-select" name="language" value={initialFilters.language || ''} onChange={e => handleValueChange('language', e.target.value)} className="w-full h-10 text-right flex-row-reverse text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
                            <option value="__ALL__">الكل</option>
                            {languages.map((lang) => (
                                <option key={lang.iso_639_1} value={lang.iso_639_1}>{lang.english_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Country Filter (Conditional) */}
                    {/* Only show country filter if mediaType is 'tv' (not movie or anime) */}
                    {mediaType === 'tv' && countries && (
                        <div className="flex flex-col gap-1">
                            <label htmlFor="country-select" className="text-xs text-muted-foreground text-right">البلد</label>
                            <select id="country-select" name="country" value={initialFilters.country || ''} onChange={e => handleValueChange('country', e.target.value)} className="w-full h-10 text-right flex-row-reverse text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
                                <option value="__ALL__">الكل</option>
                                {countries.map((country) => (
                                    <option key={country.iso_3166_1} value={country.iso_3166_1}>{country.english_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Sort By Filter */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="sortBy-select" className="text-xs text-muted-foreground text-right">ترتيب حسب</label>
                        <select id="sortBy-select" name="sortBy" value={initialFilters.sortBy || 'vote_count.desc'} onChange={e => handleValueChange('sortBy', e.target.value)} className="w-full h-10 text-right flex-row-reverse text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}; 