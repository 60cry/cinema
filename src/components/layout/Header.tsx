'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Home, Film, Tv, User, Search, Bookmark, ChevronDown } from 'lucide-react';
import { searchMulti, getImageUrl, MultiSearchResult } from '@/lib/tmdb';

import { slugify, cn } from '@/lib/utils';

// Define movie categories for the dropdown with proper typing
const movieCategories = [
    { title: "أفلام أكشن", href: "/movies?genre=28" },
    { title: "أفلام مغامرة", href: "/movies?genre=12" },
    { title: "أفلام كوميديا", href: "/movies?genre=35" },
    { title: "أفلام دراما", href: "/movies?genre=18" },
    { title: "أفلام رعب", href: "/movies?genre=27" },
    { title: "أفلام خيال علمي", href: "/movies?genre=878" },
    { title: "أفلام كرتون", href: "/movies?genre=16" },
    { title: "أفلام وثائقية", href: "/movies?genre=99" },
    { title: "أفلام رومانسية", href: "/movies?genre=10749" },
];

// Define TV show categories for the dropdown with proper typing
const tvCategories = [
    { title: "مسلسلات دراما", href: "/tv?genre=18" },
    { title: "مسلسلات كوميديا", href: "/tv?genre=35" },
    { title: "مسلسلات أكشن", href: "/tv?genre=10759" },
    { title: "مسلسلات جريمة", href: "/tv?genre=80" },
    { title: "مسلسلات خيال علمي", href: "/tv?genre=10765" },
];



// Main navigation items
const mainNavItems = [
    { title: "الرئيسية", href: "/", icon: <Home className="h-5 w-5" /> },
    { 
        title: "أفلام", 
        href: "/movies", 
        icon: <Film className="h-5 w-5" />, 
        dropdown: movieCategories 
    },
    { 
        title: "مسلسلات", 
        href: "/tv", 
                icon: <Tv className="h-5 w-5" />,
                dropdown: tvCategories
            },
                { 
                    title: "قائمة المشاهدة", 
                    href: "/watchlist", 
                    icon: <Bookmark className="h-5 w-5" />,
                    highlight: true 
                },        
        ];
// Category item component
const CategoryItem = ({ href, title, onClick }: { href: string, title: string, onClick?: () => void }) => (
    <Link 
        href={href} 
        className="flex items-center py-3 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
        onClick={onClick}
        replace={true}
    >
        <span>{title}</span>
    </Link>
);

// NavItem component for desktop menu
const NavItem = ({ 
    item, 
    isActive, 
    togglePanel, 
    activePanel, 
    handleItemClick 
}: { 
    item: typeof mainNavItems[0], 
    isActive: boolean,
    togglePanel: (name: string) => void,
    activePanel: string | null,
    handleItemClick: () => void
}) => {
    const hasDropdown = !!item.dropdown;
    const panelId = `${item.title.toLowerCase()}-panel`;
    
    return (
        <div className="relative">
            {hasDropdown ? (
                <button
                    className={cn(
                        "text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1 px-2 py-1 rounded",
                        "hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
                        isActive && "text-blue-600 dark:text-blue-400",
                        item.highlight && "text-blue-600 dark:text-blue-400 font-semibold"
                    )}
                    onClick={() => togglePanel(panelId)}
                    aria-expanded={activePanel === panelId}
                    aria-controls={panelId}
                    aria-label={`قائمة ${item.title}`}
                >
                    {item.title}
                    <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        activePanel === panelId && "rotate-180"
                    )} />
                </button>
            ) : (
                <Link 
                    href={item.href} 
                    className={cn(
                        "text-gray-700 dark:text-gray-300 font-medium px-2 py-1 flex items-center gap-1 rounded",
                        "hover:text-blue-600 dark:hover:text-blue-400",
                        isActive && "text-blue-600 dark:text-blue-400",
                        item.highlight && "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20 rounded-full px-4 py-1.5"
                    )}
                    onClick={handleItemClick}
                >
                    {item.title}
                </Link>
            )}
            
            {hasDropdown && (
                <div 
                    id={panelId} 
                    className={cn(
                        "absolute top-full right-0 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-50 mt-1 transition-all duration-300 origin-top-right",
                        activePanel === panelId ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
                    )}
                >
                    <div className="p-2 grid grid-cols-1 gap-1">
                        {item.dropdown?.map((category, i) => (
                            <CategoryItem 
                                key={i} 
                                href={category.href} 
                                title={category.title} 
                                onClick={handleItemClick}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Mobile Nav item component
const MobileNavItem = ({ item, isActive, handleItemClick }: { item: typeof mainNavItems[0], isActive: boolean, handleItemClick: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasDropdown = !!item.dropdown;
    
    return (
        <div className="py-1">
            {hasDropdown ? (
                <>
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "w-full flex items-center justify-between py-3 px-4 rounded-md text-gray-900 dark:text-gray-100 text-base hover:bg-gray-100 dark:hover:bg-gray-800",
                            isActive && "text-blue-600 dark:text-blue-400"
                        )}
                    >
                        <div className="flex items-center">
                            <span className="ml-3 text-gray-500 dark:text-gray-400">{item.icon}</span>
                            <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronDown className={cn(
                            "h-5 w-5 transition-transform text-gray-400",
                            isOpen && "rotate-180"
                        )} />
                    </button>
                    <div className={cn(
                        "grid grid-rows-[0fr] transition-all duration-300 bg-gray-50 dark:bg-gray-900/50 overflow-hidden rounded-b-md",
                        isOpen && "grid-rows-[1fr] pt-1 pb-2 mt-1"
                    )}>
                        <div className="min-h-0 pl-4 pr-2">
                            {item.dropdown?.map((category, i) => (
                                <CategoryItem 
                                    key={i} 
                                    href={category.href} 
                                    title={category.title} 
                                    onClick={handleItemClick}
                                />
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <Link 
                    href={item.href} 
                    className={cn(
                        "flex items-center py-3 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 text-base",
                        isActive && "text-blue-600 dark:text-blue-400",
                        item.highlight && "text-blue-600 dark:text-blue-400 font-medium"
                    )} 
                    onClick={handleItemClick}
                >
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{item.icon}</span>
                    <span className="font-medium">{item.title}</span>
                </Link>
            )}
        </div>
    );
};

// Search result item component
const SearchResultItem = ({ result, handleItemClick }: { result: MultiSearchResult, handleItemClick: () => void }) => {
    const getResultUrl = (result: MultiSearchResult) => {
        const titleOrName = 'title' in result ? result.title : result.name;
        const year = 'release_date' in result ? result.release_date?.substring(0, 4) : ('first_air_date' in result ? result.first_air_date?.substring(0, 4) : null);
        const slug = slugify(titleOrName || '');
        
        if (result.media_type === 'movie') {
            return `/movies/${slug}${year ? `-${year}` : ''}-${result.id}`;
        } else if (result.media_type === 'tv') {
            return `/tv/${slug}${year ? `-${year}` : ''}-${result.id}`;
        } else if (result.media_type === 'person') {
            return `/person/${slug}-${result.id}`;
        }
        return '#';
    };

    const getResultIcon = (result: MultiSearchResult) => {
        if (result.media_type === 'movie') {
            return <Film className="h-4 w-4 ml-1.5 text-gray-500 dark:text-gray-400" />;
        } else if (result.media_type === 'tv') {
            return <Tv className="h-4 w-4 ml-1.5 text-gray-500 dark:text-gray-400" />;
        } else {
            return <User className="h-4 w-4 ml-1.5 text-gray-500 dark:text-gray-400" />;
        }
    };

    const getResultName = (result: MultiSearchResult) => {
        return 'title' in result ? result.title : result.name;
    };

    const getImagePath = () => {
        const path = 'poster_path' in result ? result.poster_path : ('profile_path' in result ? result.profile_path : null);
        const imageUrl = path ? getImageUrl(path, 'w92') : null;
        return imageUrl || '/placeholder-poster.png';
    };

    return (
        <Link 
            href={getResultUrl(result)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            onClick={handleItemClick}
        >
            <div className="w-10 h-14 relative flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                <Image
                    src={getImagePath()}
                    alt={getResultName(result) || 'Result image'}
                    fill
                    className="object-cover"
                    sizes="40px"
                    onError={(e) => e.currentTarget.src = '/placeholder-poster.png'}
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                    {getResultIcon(result)}
                    <span>
                        {result.media_type === 'movie' ? 'فيلم' : result.media_type === 'tv' ? 'مسلسل' : 'شخصية'}
                    </span>
                </div>
                <p className="text-sm font-medium line-clamp-1">{getResultName(result)}</p>
                {(result.media_type === 'movie' || result.media_type === 'tv') && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {('release_date' in result && result.release_date?.substring(0,4)) || ('first_air_date' in result && result.first_air_date?.substring(0,4)) || ''}
                    </p>
                )}
            </div>
        </Link>
    );
};

export function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<MultiSearchResult[]>([]);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    
    const router = useRouter();
    const pathname = usePathname();
    const headerRef = useRef<HTMLElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const mobileSearchButtonRef = useRef<HTMLButtonElement>(null);
    

    // Check if current path matches an item
    const isPathActive = (itemPath: string) => {
        if (itemPath === '/') return pathname === '/';
        return pathname.startsWith(itemPath);
    };

    // Handle scroll effects
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        
        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Check initial scroll position
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Define the async function to be debounced
    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.length < 2) {
            setShowSuggestions(false);
            setSearchResults([]);
            return;
        }
        try {
            const results = await searchMulti(query);
            setSearchResults(results.results.slice(0, 6)); // Limit to 6 results for dropdown
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error fetching search suggestions:", error);
            setShowSuggestions(false);
            setSearchResults([]);
        }
    }, []);

    // Add a ref to store the timeout ID between renders
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    // Create the debounced version using an inline function in useCallback
    const debouncedFetch = useCallback((query: string) => {
        // Clear any existing timeout
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }
        
        // Set a new timeout
        timeoutIdRef.current = setTimeout(async () => {
            try {
                await fetchSuggestions(query);
            } catch (error) {
                console.error("Error in debounced fetchSuggestions call:", error);
            }
        }, 300);
    }, [fetchSuggestions]);

    useEffect(() => {
        debouncedFetch(searchQuery);
    }, [searchQuery, debouncedFetch]);

    // Handle clicking outside to close suggestions AND dropdown panels
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;

            // Prevent immediate closing when clicking the search elements
            if (
                // Don't close if clicking mobile search button
                (mobileSearchButtonRef.current && mobileSearchButtonRef.current.contains(target)) ||
                // Don't close if clicking inside the mobile search overlay
                (isSearchExpanded && (target as Element).closest('.mobile-search-overlay')) ||
                // Don't close if clicking inside the search input container
                (searchContainerRef.current && searchContainerRef.current.contains(target))
            ) {
                return;
            }

            // Close suggestions if clicking outside search container
            if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
                setShowSuggestions(false);
                // Only close expanded search if clicking outside on mobile
                if (isSearchExpanded && window.innerWidth < 768) { 
                    setIsSearchExpanded(false);
                }
            }
            
            // Handle dropdown clicks for main nav panels
            if (headerRef.current && !headerRef.current.contains(target)) {
                setActivePanel(null); 
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSearchExpanded]);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery) {
            setShowSuggestions(false);
            setActivePanel(null);
            setIsSearchExpanded(false);
            router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
        }
    };

    const togglePanel = (name: string) => {
        setActivePanel(prevState => prevState === name ? null : name);
    };

    // Close panels when item clicked
    const handleItemClick = () => {
        setActivePanel(null);
        setShowSuggestions(false);
        setSearchQuery('');
        setIsSearchExpanded(false);
    };

    // Toggle expanded search on mobile
    const toggleSearch = () => {
        const newState = !isSearchExpanded;
        setIsSearchExpanded(newState);
        
        if (newState) {
            // Focus the input after a short delay to allow transition
            setTimeout(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 50);

            // When opening search and we already have text, show suggestions
            if (searchQuery.length >= 2) {
                setShowSuggestions(true);
            }
        }
    };

    return (
        <header 
            ref={headerRef} 
            className={cn(
                "sticky top-0 z-50 transition-all duration-200",
                "bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm",
                "border-b border-gray-200 dark:border-gray-800",
                isScrolled ? "shadow-sm" : ""
            )}
        >
            <div className="max-w-[1400px] mx-auto px-2 sm:px-4">
                {/* Mobile Search Overlay - Only visible when expanded */}
                <div 
                    className={cn(
                        "absolute inset-x-0 top-0 h-14 sm:h-16 px-2 sm:px-4 flex items-center justify-between transition-all duration-300 z-20",
                        "bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800",
                        "mobile-search-overlay",
                        isSearchExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <form onSubmit={handleSearchSubmit} className="w-full flex items-center gap-2 sm:gap-3">
                        <button 
                            type="button" 
                            onClick={toggleSearch}
                            className="p-2 text-gray-500 dark:text-gray-400"
                            aria-label="العودة"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div ref={searchContainerRef} className="relative flex-1">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث عن أفلام، مسلسلات، أشخاص..."
                                className="w-full h-10 pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:border-blue-500 text-sm"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            {searchQuery && (
                                <button 
                                    type="button" 
                                    onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                                    aria-label="مسح البحث"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            بحث
                        </button>
                    </form>

                    {/* Mobile Search Results */}
                    {showSuggestions && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mx-1 sm:mx-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg max-h-[70vh] overflow-y-auto z-30 rounded-b-lg">
                            <div className="p-3 space-y-2">
                                {searchResults.map((result) => (
                                    <SearchResultItem 
                                        key={`${result.media_type}-${result.id}`}
                                        result={result}
                                        handleItemClick={handleItemClick}
                                    />
                                ))}
                                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleItemClick();
                                            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                                        }}
                                        className="block w-full text-center py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md font-medium"
                                    >
                                        {`عرض كل النتائج لـ "${searchQuery}"`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Header Content */}
                <div className="flex items-center justify-between h-16 sm:h-20 relative">
                    {/* --- Group 1: Logo --- */}
                    <div className="flex items-center flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2" onClick={handleItemClick}>
                            <Image 
                                src="/logo.svg"
                                alt="سينما العرب Logo" 
                                width={384}
                                height={96}
                                priority
                                className="h-12 w-auto sm:h-14"
                            />
                        </Link>
                    </div>

                    {/* --- Group 2: Center (Desktop Navigation) --- */}
                    <nav className="hidden md:flex flex-grow items-center justify-evenly">
                        {mainNavItems.map((item) => (
                            <NavItem 
                                key={item.href}
                                item={item} 
                                isActive={isPathActive(item.href)} 
                                togglePanel={togglePanel}
                                activePanel={activePanel}
                                handleItemClick={handleItemClick}
                            />
                        ))}
                    </nav>

                    {/* --- Group 3: Actions (Search, Theme, Mobile Menu) --- */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Mobile Search Button */}
                        <button 
                            ref={mobileSearchButtonRef}
                            onClick={toggleSearch} 
                            className="md:hidden h-10 w-10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            aria-label="بحث"
                        >
                            <Search className="h-5 w-5" />
                        </button>


                        
                        {/* Desktop Search */}
                        <div ref={searchContainerRef} className="relative hidden md:block">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
                                    placeholder="ابحث..."
                                    className="w-full h-10 px-10 py-2 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:border-blue-500 text-sm md:w-48 lg:w-64"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                {searchQuery && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                                        aria-label="مسح البحث"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </form>
                                
                            {/* Desktop Search Results Dropdown */}
                            {showSuggestions && searchResults.length > 0 && (
                                <div className="absolute top-full right-0 left-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 max-h-[70vh] overflow-y-auto">
                                    <div className="p-2 space-y-1">
                                        {searchResults.map((result) => (
                                            <SearchResultItem 
                                                key={`${result.media_type}-${result.id}`}
                                                result={result}
                                                handleItemClick={handleItemClick}
                                            />
                                        ))}
                                        <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleItemClick();
                                                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                                                }}
                                                className="block w-full text-center py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md font-medium"
                                            >
                                                {`عرض كل النتائج لـ "${searchQuery}"`}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => togglePanel('mobileNav')}
                            className="md:hidden h-10 w-10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            aria-label="فتح القائمة الرئيسية"
                            aria-expanded={activePanel === 'mobileNav'}
                            aria-controls="mobile-nav-panel"
                        >
                            {activePanel === 'mobileNav' ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            <div 
                id="mobile-nav-panel" 
                className={cn(
                    "md:hidden bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800",
                    "overflow-hidden transition-all duration-300",
                    activePanel === 'mobileNav' ? "max-h-[calc(100vh-4rem)]" : "max-h-0", 
                    "overflow-y-auto"
                )} 
                aria-hidden={activePanel !== 'mobileNav'}
            >
                <div className="divide-y divide-gray-100 dark:divide-gray-800 px-2 py-2">
                    {mainNavItems.map((item) => (
                        <MobileNavItem 
                            key={item.href} 
                            item={item} 
                            isActive={isPathActive(item.href)} 
                            handleItemClick={handleItemClick} 
                        />
                    ))}
                </div>
            </div>
        </header>
    );
} 