'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface WatchlistButtonProps {
  id: number;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  posterPath: string | null;
  year?: number | null;
}

interface WatchlistItem {
  id: number;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  posterPath: string | null;
  year?: number | null;
  addedAt: string;
}

export function WatchlistButton({ id, type, title, posterPath, year }: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const checkIfInWatchlist = useCallback(() => {
    try {
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]') as WatchlistItem[];
      const exists = watchlist.some((item) => 
        item.id === id && item.type === type
      );
      setIsInWatchlist(exists);
    } catch (error) {
      console.error('Error checking watchlist:', error);
      setIsInWatchlist(false);
    }
  }, [id, type]);

  useEffect(() => {
    setIsClient(true);
    checkIfInWatchlist();
  }, [id, type, checkIfInWatchlist]);

  const toggleWatchlist = () => {
    try {
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]') as WatchlistItem[];
      
      if (isInWatchlist) {
        // Remove from watchlist
        const newWatchlist = watchlist.filter((item) => 
          !(item.id === id && item.type === type)
        );
        localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
        setIsInWatchlist(false);
      } else {
        // Add to watchlist
        const newItem: WatchlistItem = {
          id,
          type,
          title,
          posterPath,
          year,
          addedAt: new Date().toISOString(),
        };
        watchlist.push(newItem);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  if (!isClient) {
    return null; // Don't render anything on the server to prevent hydration mismatch
  }

  return (
    <button
      onClick={toggleWatchlist}
      className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        isInWatchlist
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      }`}
      aria-label={isInWatchlist ? 'إزالة من قائمة المشاهدة' : 'إضافة إلى قائمة المشاهدة'}
    >
      {isInWatchlist ? (
        <>
          <BookmarkCheck className="h-4 w-4 ml-2" />
          <span>تمت الإضافة</span>
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4 ml-2" />
          <span>إضافة إلى القائمة</span>
        </>
      )}
    </button>
  );
} 