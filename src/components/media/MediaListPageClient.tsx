'use client';

import React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    Genre,
    Language,
    Country,
    Movie,
    TvShow
} from '@/lib/tmdb';
import { MediaFilters } from './MediaFilters';
import { MediaItemCard } from './MediaItemCard';


// Helper to generate years array
const generateYears = (startYear: number): number[] => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= startYear; year--) {
        years.push(year);
    }
    return years;
};

interface MediaListPageClientProps {
    initialData: Movie[] | TvShow[];
    initialTotalPages: number;
    genres: Genre[];
    languages: Language[];
    countries?: Country[];
    mediaType: 'movie' | 'tv' | 'anime';
}

export const MediaListPageClient: React.FC<MediaListPageClientProps> = ({
    initialData,
    initialTotalPages,
    genres,
    languages,
    countries,
    mediaType,
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Compute filters from searchParams (not state)
    const filters: {
        genre?: string;
        year?: string | number;
        language?: string;
        country?: string;
        sortBy?: string;
    } = {
        genre: searchParams.get('genre') || undefined,
        year: searchParams.get('year') || undefined,
        language: searchParams.get('language') || undefined,
        country: searchParams.get('country') || undefined,
        sortBy: searchParams.get('sortBy') || 'vote_count.desc',
    };
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const years = generateYears(1950);
    const sortOptions = [
        { value: 'popularity.desc', label: 'الأكثر شعبية' },
        { value: 'vote_average.desc', label: 'الأعلى تقييماً' },
        mediaType === 'movie'
            ? { value: 'primary_release_date.desc', label: 'الأحدث إصداراً' }
            : { value: 'first_air_date.desc', label: 'الأحدث عرضاً' },
        { value: 'vote_count.desc', label: 'الأكثر تصويتاً' },
    ];

    const handleFilterChange = (newFilters: {
        genre?: string;
        year?: string | number;
        language?: string;
        country?: string;
        sortBy?: string;
    }) => {
        const params = new URLSearchParams();
        if (newFilters.genre) params.set('genre', newFilters.genre);
        if (newFilters.year) params.set('year', newFilters.year.toString());
        if (newFilters.language) params.set('language', newFilters.language);
        if (newFilters.country && mediaType === 'tv') params.set('country', newFilters.country);
        if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
        // Always reset to page 1 on filter change
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= initialTotalPages) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', newPage.toString());
            router.push(`${pathname}?${params.toString()}`);
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="w-full" dir="rtl">
            <div className="px-2 sm:px-6">
                <MediaFilters
                    genres={genres}
                    languages={languages}
                    countries={countries}
                    years={years}
                    sortOptions={sortOptions}
                    initialFilters={filters}
                    onFilterChange={handleFilterChange}
                    mediaType={mediaType}
                />
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-5 pt-3 px-2 sm:px-6">
                {initialData.length > 0 ? (
                    initialData.map((item) => (
                        <MediaItemCard key={item.id} item={item} type={mediaType === 'movie' ? 'movie' : 'tv'} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8 sm:py-10 text-xs sm:text-base">
                        لا توجد نتائج تطابق بحثك.
                    </p>
                )}
            </div>

            <div className="pt-4 sm:pt-8 px-2 sm:px-6">
                {initialTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 text-gray-800 rounded-l-md border border-gray-300 hover:bg-gray-300 text-xs sm:text-base disabled:opacity-50 disabled:pointer-events-none"
                        >
                            السابق
                        </button>
                        <span className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-800 text-xs sm:text-base">
                            {currentPage}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= initialTotalPages}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 text-gray-800 rounded-r-md border border-gray-300 hover:bg-gray-300 text-xs sm:text-base disabled:opacity-50 disabled:pointer-events-none"
                        >
                            التالي
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};