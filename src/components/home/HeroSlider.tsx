'use client';

import { Movie } from '@/lib/tmdb';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/tmdb';
import { slugify } from '@/lib/utils';
import { Star } from 'lucide-react';

interface HeroSliderProps {
    movies: Movie[];
}

function truncate(str: string, n: number) {
    return (str.length > n) ? str.slice(0, n-1) + '...' : str;
}

export function HeroSlider({ movies }: HeroSliderProps) {
    if (!movies || movies.length === 0) {
        return null;
    }

    const heroMovie = movies[0];

    return (
        <div className="relative h-[60vh] md:h-[80vh] w-full -mt-16 sm:-mt-20">
            <Image
                src={getImageUrl(heroMovie.backdrop_path, 'w1280') || '/placeholder-backdrop.png'}
                alt={heroMovie.title}
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                <div className="max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-bold text-shadow">{heroMovie.title}</h1>
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="flex items-center gap-1.5">
                            <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold text-lg md:text-xl">{heroMovie.vote_average.toFixed(1)}</span>
                        </div>
                        <span className="text-base md:text-lg">{heroMovie.release_date?.substring(0, 4)}</span>
                    </div>
                    <p className="text-sm md:text-lg mt-4 max-w-lg mx-auto">{truncate(heroMovie.overview, 150)}</p>
                    <div className="mt-8">
                        <Link href={`/movies/${slugify(heroMovie.title)}-${heroMovie.id}`}>
                            <span className="bg-primary text-primary-foreground px-8 py-3 rounded-full text-base md:text-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
                                التفاصيل
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}