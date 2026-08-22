'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchMulti, MultiSearchResult, Movie, TvShow, Person } from '@/lib/tmdb';
import { MediaItemCard } from '@/components/media/MediaItemCard';
import { PersonCard } from '@/components/people/PersonCard';
import { AlertTriangle, Search } from 'lucide-react';

interface SearchResultsProps {
    initialQuery: string;
}

export function SearchResults({ initialQuery }: SearchResultsProps) {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || initialQuery || '';

    const [results, setResults] = useState<MultiSearchResult[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchSearchResults = useCallback(async (page: number) => {
        if (!query) {
            setResults([]);
            setTotalPages(0);
            return;
        }

        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await searchMulti(query, page);
            // Filter out results without poster/profile (optional, consider backend filtering)
            const validResults = response.results.filter(item => 
                (item.media_type === 'movie' && item.poster_path) ||
                (item.media_type === 'tv' && item.poster_path) ||
                (item.media_type === 'person' && item.profile_path)
            );
            setResults(validResults);
            setTotalPages(response.total_pages > 500 ? 500 : response.total_pages); // Cap pages
            setCurrentPage(page);
        } catch (error) {
            console.error(`Error fetching search results for query "${query}":`, error);
            setFetchError(`حدث خطأ أثناء البحث عن "${query}". الرجاء المحاولة مرة أخرى.`);
            setResults([]);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    // Fetch results when query or page changes
    useEffect(() => {
        fetchSearchResults(currentPage);
    }, [query, currentPage, fetchSearchResults]);

    // Reset page to 1 when query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [query]);

    // Empty state - no search query
    if (!query) {
        return (
            <div className="w-full px-4 sm:px-6 py-16 flex flex-col items-center justify-center min-h-[70vh] pb-16">
                <div className="text-center max-w-lg">
                    <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <Search className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">ابدأ البحث</h1>
                    <p className="text-muted-foreground mb-6">
                        اكتب اسم فيلم أو مسلسل أو ممثل للبحث عنه في قاعدة البيانات لدينا
                    </p>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="w-full px-4 sm:px-6 py-8 pb-16">
                <h1 className="text-2xl font-bold mb-6">
                    جاري البحث عن: <span className="text-primary">{query}</span>
                </h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, index) => (
                        <div className="h-[240px] sm:h-[270px] w-full rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" key={index} />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (fetchError) {
        return (
            <div className="w-full px-4 sm:px-6 py-8 pb-16">
                <h1 className="text-2xl font-bold mb-6">
                    نتائج البحث عن: <span className="text-primary">{query}</span>
                </h1>
                <div className="mb-6 border border-red-300 bg-red-50 text-red-800 rounded-lg p-4 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <div>{fetchError}</div>
                </div>
            </div>
        );
    }

    // No results state
    if (results.length === 0) {
        return (
            <div className="w-full px-4 sm:px-6 py-8 pb-16">
                <h1 className="text-2xl font-bold mb-6">
                    نتائج البحث عن: <span className="text-primary">{query}</span>
                </h1>
                <div className="bg-card rounded-xl p-8 text-center border">
                    <p className="text-muted-foreground text-lg">
                        لم نتمكن من العثور على نتائج تطابق &quot;{query}&quot;
                    </p>
                    <p className="text-muted-foreground mt-2">
                        حاول استخدام كلمات مفتاحية مختلفة أو تحقق من الإملاء
                    </p>
                </div>
            </div>
        );
    }

    // Results display
    return (
        <div className="w-full px-4 sm:px-6 py-8 pb-16">
            <h1 className="text-2xl font-bold mb-6">
                نتائج البحث عن: <span className="text-primary">{query}</span>
                <span className="text-sm font-normal text-muted-foreground mr-2">
                    (عدد النتائج: {results.length})
                </span>
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.map((item) => {
                    if (item.media_type === 'movie') {
                        return <MediaItemCard key={`movie-${item.id}`} item={item as Movie} type="movie" />;
                    } else if (item.media_type === 'tv') {
                        return <MediaItemCard key={`tv-${item.id}`} item={item as TvShow} type="tv" />;
                    } else if (item.media_type === 'person') {
                        return <PersonCard key={`person-${item.id}`} person={item as Person} />;
                    }
                    return null;
                })}
            </div>

            {totalPages > 1 && (
                <div className="mt-6">
                    {/* Replace <Pagination> with inline pagination or remove if not needed */}
                </div>
            )}
        </div>
    );
} 