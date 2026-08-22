'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { slugify, cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Define the structure of a watchlist item
interface WatchlistItem {
  id: number;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  posterPath: string | null;
  year?: number | null;
  addedAt: string;
}

export function WatchlistDisplay() {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadWatchlist();
  }, []);

  const loadWatchlist = () => {
    try {
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      // Sort by newest first
      watchlist.sort((a: WatchlistItem, b: WatchlistItem) => 
        new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
      setWatchlistItems(watchlist);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setWatchlistItems([]);
    }
  };

  const removeItem = (id: number, type: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      const newWatchlist = watchlist.filter((item: WatchlistItem) => 
        !(item.id === id && item.type === type)
      );
      localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
      setWatchlistItems(newWatchlist);
    } catch (error) {
      console.error('Error removing item from watchlist:', error);
    }
  };

  if (!isClient) {
    return null; // Don't render anything on the server to prevent hydration mismatch
  }

  // Get the proper URL for the media type and ID
  const getItemUrl = (item: WatchlistItem) => {
    const slug = `${slugify(item.title)}-${item.id}`;
    switch (item.type) {
      case 'movie':
        return `/movies/${slug}`;
      case 'tv':
        return `/tv/${slug}`;
      case 'anime':
        return `/anime/${slug}`;
      default:
        return '#';
    }
  };

  // Get the poster image URL
  const getPosterUrl = (posterPath: string | null) => {
    if (!posterPath) return '/placeholder-poster.png';
    
    // Check if it's a TMDB path or full URL
    if (posterPath.startsWith('/')) {
      return `https://image.tmdb.org/t/p/w500${posterPath}`;
    }
    return posterPath;
  };

  // Get the display title
  const getDisplayTitle = (item: WatchlistItem) => {
    if (item.type === 'movie') {
      return `مشاهدة فيلم ${item.title} مترجم`;
    } else if (item.type === 'anime') {
      return `مشاهدة انمي ${item.title} مترجم`;
    } else {
      return `مشاهدة مسلسل ${item.title} مترجم`;
    }
  };

  if (watchlistItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        لم تقم بإضافة أي عناصر إلى قائمة المشاهدة بعد
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {watchlistItems.map((item) => (
        <div key={`${item.type}-${item.id}`} className="overflow-hidden bg-transparent group m-0.5">
          <div className="p-0 relative">
            <Link href={getItemUrl(item)} className="block w-full h-full aspect-[2/3] relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden group">
              <Image
                src={getPosterUrl(item.posterPath)}
                alt={`${getDisplayTitle(item)} - بوستر`}
                fill
                sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 15vw"
                priority={false}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white rounded-full px-2 py-1 text-xs flex items-center gap-1 z-10">
                <Trash 
                  className="w-3 h-3 text-red-400 cursor-pointer" 
                  onClick={(e) => removeItem(item.id, item.type, e)}
                />
              </div>
              <div className={cn(badgeVariants({ variant: "secondary" }), "absolute bottom-2 right-2 z-10")}>
                {item.type === 'movie' ? 'فيلم' : item.type === 'anime' ? 'انمي' : 'مسلسل'}
              </div>
            </Link>
          </div>
          <div className="pt-3 text-center">
            <Link 
              href={getItemUrl(item)}
              title={getDisplayTitle(item)}
              className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
            >
              {getDisplayTitle(item)}
            </Link>
            {item.year && (
              <p className="text-xs text-gray-400 mt-1">{item.year}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}