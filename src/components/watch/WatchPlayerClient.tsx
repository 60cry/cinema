'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';

// This interface should ideally be in a shared types file if also used by the server component directly
// For now, co-locating for simplicity as WatchPageProps is passed from server to this client component.
interface YtsTorrent {
    url: string;
    hash: string;
    quality: string;
    type: string;
    seeds: number;
    peers: number;
    size: string;
    size_bytes: number;
    date_uploaded: string;
    date_uploaded_unix: number;
}

// Moved PROVIDER_DISPLAY_NAMES outside the component for stability
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
    vidjoy: '⭐ VidJoy',
    vidsrc: 'Server 1',
    vidlink: 'VidLink HD',
    playerautoembed: 'Server 4',
    '2embed': 'Server 5',
    embedsu: 'Embed.su',
    animeautoembed: 'Server A',
    dramaautoembed: 'Server D',
    webtor: 'Server T (Movie)', // Generic key for movies, will be TORRENT_PROVIDER_MOVIE
    torrenteps: 'Server T (TV/Anime)', // Generic key for tv/anime, will be TORRENT_PROVIDER_TV
    twoanimexyz: 'Anime-X (2A)', // Added for 2anime.xyz from animeapi.skin
};

export interface WatchPageProps {
    initialError?: string | null;
    initialTitle?: string;
    mediaType?: 'movie' | 'tv' | 'anime' | null;
    tmdbId?: string | null;
    episodeInfo?: {
        seasonNumber: number;
        episodeNumber: number;
    } | null;
    providerUrls?: Record<string, string | null>;
    availableTorrents?: YtsTorrent[] | null;
    initialSelectedTorrentHash?: string | null;
    tvEpisodeMagnet?: string | null;
    initialSource?: string;
}

// Webtor related types - mirroring general structure from Astro's usage
// These are illustrative; actual Webtor SDK might provide more specific types.
interface WebtorPlayerEventHandlers {
    ready?: (player: WebtorPlayerInstance) => void;
    error?: (error: Error | unknown) => void; // Changed any to Error | unknown
    destroy?: () => void;
    // Other events like 'playbackStarted', 'seeds' could be added
}

interface WebtorCommand {
    id: string;
    magnet?: string | null;
    torrentUrl?: string | null; // Though not used in current logic, kept for completeness
    title?: string;
    width?: string | number;
    height?: string | number;
    lang?: string;
    i18n?: Record<string, Record<string, Record<string, string>>>; // Corrected nested type for i18n
    on?: WebtorPlayerEventHandlers;
    // Allow other properties the SDK might use
    [key: string]: unknown; // Use unknown instead of any
}

interface WebtorPlayerInstance {
    destroy: () => void;
    // Other methods/properties the player instance might have
    [key: string]: unknown; // Use unknown instead of any
}

declare global {
    interface Window {
        // Webtor can be an array to push commands to, or the player instance itself after init.
        webtor?: WebtorPlayerInstance | WebtorCommand[] | { push: (command: WebtorCommand) => WebtorPlayerInstance | unknown }; // Use unknown for return type
    }
}

// interface WebtorConfig extends WebtorCommand {} // Removed this interface

export function WatchPlayerClient(props: WatchPageProps) {
    const {
        initialError,
        initialTitle = 'Watch',
        mediaType,
        tmdbId,
        // episodeInfo, // Already intended to be removed
        providerUrls = {},
        availableTorrents,
        initialSelectedTorrentHash,
        tvEpisodeMagnet,
        initialSource = 'vidsrc'
    } = props;

    const [selectedSource, setSelectedSource] = useState<string>(initialSource);
    const [currentSelectedTorrentHash, setCurrentSelectedTorrentHash] = useState<string | null | undefined>(initialSelectedTorrentHash);
    const [currentTitle, setCurrentTitle] = useState<string>(initialTitle);
    const [isLoadingWebtorSDK, setIsLoadingWebtorSDK] = useState(false);
    const [isWebtorPlayerLoading, setIsWebtorPlayerLoading] = useState(false);


    const providerIframeRef = useRef<HTMLIFrameElement>(null);
    const webtorContainerRef = useRef<HTMLDivElement>(null);
    const serverSelectorRef = useRef<HTMLDivElement>(null);
    const qualitySelectorRef = useRef<HTMLDivElement>(null);
    const playerMessageOverlayRef = useRef<HTMLDivElement>(null);
    const playerMessageRef = useRef<HTMLParagraphElement>(null);

    const webtorInstanceRef = useRef<WebtorPlayerInstance | null>(null);

    const TORRENT_PROVIDER_MOVIE = 'webtor';
    const TORRENT_PROVIDER_TV = 'torrenteps';

    const showPlayerMessage = useCallback((message: string, isError = false) => {
        if (playerMessageRef.current && playerMessageOverlayRef.current) {
            playerMessageRef.current.textContent = message;
            playerMessageRef.current.className = `text-lg ${isError ? 'text-red-400' : 'text-yellow-400'}`;
            playerMessageOverlayRef.current.style.display = 'flex';
        }
        if (providerIframeRef.current) providerIframeRef.current.style.display = 'none';
        if (webtorContainerRef.current) webtorContainerRef.current.style.display = 'none';
        console.log(`Player Message: ${message}`);
    }, []);

    const hidePlayerMessage = useCallback(() => {
        if (playerMessageOverlayRef.current) playerMessageOverlayRef.current.style.display = 'none';
    }, []);

    const updateButtonStyles = useCallback(() => {
        const serverButtons = serverSelectorRef.current?.querySelectorAll('button');
        serverButtons?.forEach(button => {
            const source = button.dataset.source;
            if (!source) return;

            const baseClasses = 'px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 ease-in-out shadow border flex items-center gap-1.5';
            let activeClasses = 'scale-105 ring-2 ring-offset-2 ring-offset-gray-900';
            let inactiveClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';

            if (source === 'vidjoy') {
                activeClasses += ' bg-yellow-500 text-black border-yellow-400 ring-yellow-500';
                inactiveClasses += ' bg-yellow-600 text-yellow-100 border-yellow-500 hover:bg-yellow-500 hover:border-yellow-400';
            } else if (source === TORRENT_PROVIDER_MOVIE || source === TORRENT_PROVIDER_TV) {
                activeClasses += ' bg-teal-600 text-white border-teal-400 ring-teal-500';
                inactiveClasses += ' bg-teal-700 text-teal-100 border-teal-600 hover:bg-teal-600 hover:border-teal-500';
            } else if (source === 'vidsrc' || source === 'vidlink') {
                activeClasses += ' bg-blue-600 text-white border-blue-400 ring-blue-500';
                inactiveClasses += ' bg-blue-700 text-blue-100 border-blue-600 hover:bg-blue-600 hover:border-blue-500';
            } else {
                activeClasses += ' bg-purple-600 text-white border-purple-400 ring-purple-500';
                inactiveClasses += ' bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600 hover:border-gray-500';
            }
            if (source === 'vidlink') {
                button.classList.add('vidlink-button-active');
            } else {
                button.classList.remove('vidlink-button-active');
            }

            if (source === selectedSource) {
                button.className = `${baseClasses} ${activeClasses}`;
                button.disabled = true;
            } else {
                button.className = `${baseClasses} ${inactiveClasses}`;
                button.disabled = (source === TORRENT_PROVIDER_MOVIE && (!availableTorrents || availableTorrents.length === 0)) ||
                                  (source === TORRENT_PROVIDER_TV && !tvEpisodeMagnet);
            }
        });

        const qualityButtons = qualitySelectorRef.current?.querySelectorAll('button');
        qualityButtons?.forEach(button => {
            const hash = button.dataset.hash;
            const baseClasses = 'px-2 py-0.5 rounded text-xs font-medium transition-colors duration-150 ease-in-out';
            const activeClasses = 'bg-teal-600 text-white cursor-default';
            const inactiveClasses = 'bg-gray-600 text-gray-200 hover:bg-gray-500';
            if (hash === currentSelectedTorrentHash) {
                button.className = `${baseClasses} ${activeClasses}`;
                button.disabled = true;
            } else {
                button.className = `${baseClasses} ${inactiveClasses}`;
                button.disabled = false;
            }
        });
    }, [selectedSource, currentSelectedTorrentHash, availableTorrents, tvEpisodeMagnet]);

    const loadWebtorSdk = useCallback((callback: () => void) => {
        // Check if webtor is already a usable instance or the command queue array
        if (window.webtor && 
            (typeof (window.webtor as WebtorPlayerInstance).destroy === 'function' || // It's an instance
             Array.isArray(window.webtor) || // It's the command array
             typeof (window.webtor as { push?: (command: WebtorCommand) => WebtorPlayerInstance | unknown }).push === 'function' ) // It's an object with push (like SDK itself)
        ) {
            callback();
            return;
        }
        const existingScript = document.getElementById('webtor-sdk-script');
        if (existingScript) {
            const interval = setInterval(() => {
                if (window.webtor) {
                    clearInterval(interval);
                    callback();
                }
            }, 100);
            return;
        }

        console.log('Loading Webtor SDK...');
        setIsLoadingWebtorSDK(true);
        const script = document.createElement('script');
        script.id = 'webtor-sdk-script';
        script.src = 'https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js';
        script.async = true;
        script.onload = () => {
            console.log('Webtor SDK loaded.');
            setIsLoadingWebtorSDK(false);
            if (!window.webtor) { // Initialize if SDK script doesn't do it itself
                window.webtor = [];
            }
            callback();
        };
        script.onerror = () => {
            console.error('Failed to load Webtor SDK.');
            setIsLoadingWebtorSDK(false);
            showPlayerMessage('Failed to load Torrent Player component.', true);
        };
        document.head.appendChild(script);
    }, [showPlayerMessage]);

    const initializeWebtorPlayer = useCallback((torrentHashForPlayer: string | null | undefined, directMagnetLink: string | null) => {
        loadWebtorSdk(() => {
            if (!webtorContainerRef.current) {
                console.error("Webtor container ref is not available.");
                showPlayerMessage('Player container not found.', true);
                return;
            }
            setIsWebtorPlayerLoading(true);
            hidePlayerMessage();
            let finalMagnetLink = directMagnetLink;

            if (!finalMagnetLink && torrentHashForPlayer && mediaType === 'movie' && availableTorrents) {
                const currentTorrent = availableTorrents.find(t => t.hash === torrentHashForPlayer);
                if (!currentTorrent) {
                    showPlayerMessage('Selected torrent quality not found.', true);
                    setIsWebtorPlayerLoading(false);
                    return;
                }
                // Use currentTitle state for magnet link generation
                const movieTitleForMagnet = currentTitle && currentTitle !== 'Watch' ? currentTitle.split(' - S')[0] : 'Movie';
                const encodedTitle = encodeURIComponent(movieTitleForMagnet);
                // Modern high-speed active BitTorrent trackers
                const trackers = [
                    'udp://tracker.opentrackr.org:1337/announce',
                    'udp://open.stealth.si:80/announce',
                    'udp://tracker.torrent.eu.org:451/announce',
                    'udp://tracker.openbittorrent.com:6969/announce',
                    'udp://explodie.org:6969/announce',
                    'udp://tracker.moeking.me:6969/announce',
                    'udp://movies.subtletv.org:6969/announce',
                    'http://tracker.openbittorrent.com:80/announce',
                ].map(tr => `&tr=${encodeURIComponent(tr)}`).join('');
                finalMagnetLink = `magnet:?xt=urn:btih:${currentTorrent.hash}&dn=${encodedTitle}${trackers}`;
            }

            if (!finalMagnetLink) {
                showPlayerMessage('Could not determine torrent source.', true);
                setIsWebtorPlayerLoading(false);
                return;
            }

            webtorContainerRef.current.innerHTML = ''; // Clear first

            try {
                if (webtorInstanceRef.current && typeof webtorInstanceRef.current.destroy === 'function') {
                    console.log("Destroying previous webtor instance before re-initializing.");
                    webtorInstanceRef.current.destroy();
                    webtorInstanceRef.current = null; 
                }
                console.log(`Initializing Webtor with magnet: ${finalMagnetLink.substring(0, 70)}...`);

                const webtorConfig: WebtorCommand = {
                    id: 'webtor-player-container', // This is the ID of the div
                    magnet: finalMagnetLink,
                    width: '100%',
                    height: '100%',
                    title: currentTitle, // Use currentTitle state
                    lang: 'en',
                    i18n: { en: { common: { "prepare to play": "Connecting to torrent network..." } } },
                    on: {
                        ready: (player: WebtorPlayerInstance) => {
                            console.log('Webtor player ready.', player);
                            setIsWebtorPlayerLoading(false);
                            hidePlayerMessage();
                            webtorInstanceRef.current = player; // Store the active instance
                            if (webtorContainerRef.current?.querySelector('.custom-webtor-loader')) {
                                webtorContainerRef.current.querySelector('.custom-webtor-loader')?.remove();
                            }
                        },
                        error: (err: Error | unknown) => { // Changed any to Error | unknown
                            console.error('Webtor player error:', err);
                            setIsWebtorPlayerLoading(false);
                            const message = (err instanceof Error) ? err.message : 'Unknown error';
                            showPlayerMessage(`Torrent Player Error: ${message}`, true);
                        },
                        destroy: () => { // Handle SDK's own destroy event if it calls it
                            console.log('Webtor player destroyed (event from SDK).');
                            if (webtorInstanceRef.current && webtorInstanceRef.current === window.webtor) {
                                window.webtor = []; // Reset if global instance was this one
                            }
                            // webtorInstanceRef.current = null; // Already handled if destroyed via our ref
                        }
                    }
                };
                
                // How SDK's .push is typically used:
                if (window.webtor && typeof (window.webtor as { push?: (command: WebtorCommand) => WebtorPlayerInstance | unknown }).push === 'function') {
                    // Assuming push is part of an object structure provided by the SDK
                    webtorInstanceRef.current = (window.webtor as { push: (config: WebtorCommand) => WebtorPlayerInstance | unknown }).push(webtorConfig) as WebtorPlayerInstance;
                } else if (window.webtor && Array.isArray(window.webtor)) {
                     // If it's an array, push the config. The SDK then processes this.
                    (window.webtor as WebtorCommand[]).push(webtorConfig);
                    // Instance is usually set in the 'ready' callback for this pattern
                } else {
                    console.error('Webtor SDK is not available or not in an expected state to push command.');
                    showPlayerMessage('Could not initialize Torrent Player.', true);
                    setIsWebtorPlayerLoading(false);
                }

            } catch (error: unknown) { // Changed any to unknown
                console.error("Error during Webtor initialization:", error);
                setIsWebtorPlayerLoading(false);
                const message = (error instanceof Error) ? error.message : 'Unknown error';
                showPlayerMessage(`Failed to initialize torrent player: ${message}`, true);
            }
        });
    }, [loadWebtorSdk, mediaType, availableTorrents, currentTitle, showPlayerMessage, hidePlayerMessage]);

    // Effect for setting initial source and selected torrent hash
    useEffect(() => {
        let newInitialSource = initialSource;
        if (providerUrls?.vidlink) { // Prefer VidLink if available
            newInitialSource = 'vidlink';
        } else if (mediaType === 'movie' && !providerUrls?.vidsrc && availableTorrents && availableTorrents.length > 0) {
            newInitialSource = TORRENT_PROVIDER_MOVIE;
        }
        setSelectedSource(newInitialSource);

        if (newInitialSource === TORRENT_PROVIDER_MOVIE && !initialSelectedTorrentHash && availableTorrents && availableTorrents.length > 0) {
            // Auto-select first torrent for movies if none is pre-selected and source is webtor
            setCurrentSelectedTorrentHash(availableTorrents[0].hash);
        } else if (initialSelectedTorrentHash) {
            setCurrentSelectedTorrentHash(initialSelectedTorrentHash);
        }
    }, [initialSource, initialSelectedTorrentHash, mediaType, providerUrls, availableTorrents]);


    // Main effect to handle player changes based on state
    useEffect(() => {
        if (initialError || !tmdbId) return;

        hidePlayerMessage();
        if (providerIframeRef.current) {
            providerIframeRef.current.style.display = 'none';
            providerIframeRef.current.src = 'about:blank';
        }
        if (webtorContainerRef.current) {
            webtorContainerRef.current.style.display = 'none';
        }
        if (qualitySelectorRef.current) {
            qualitySelectorRef.current.style.display = 'none';
        }

        if (selectedSource === TORRENT_PROVIDER_MOVIE && mediaType === 'movie') {
            if (webtorContainerRef.current) webtorContainerRef.current.style.display = 'block';
            if (qualitySelectorRef.current && availableTorrents && availableTorrents.length > 0) {
                qualitySelectorRef.current.style.display = 'flex';
            }
            if (currentSelectedTorrentHash) {
                initializeWebtorPlayer(currentSelectedTorrentHash, null);
            } else {
                // This case should ideally be handled by the initial hash setting effect.
                // If still no hash, means no torrents were available or suitable.
                if (availableTorrents && availableTorrents.length > 0) {
                     // This should ideally not be reached if the above effect works.
                    console.warn("Initializing movie torrent player without pre-selected hash, attempting first available.");
                    setCurrentSelectedTorrentHash(availableTorrents[0].hash); // Trigger re-run for this effect
                } else {
                    showPlayerMessage('No torrents available for this movie.', true);
                }
            }
        } else if (selectedSource === TORRENT_PROVIDER_TV && (mediaType === 'tv' || mediaType === 'anime') && tvEpisodeMagnet) {
            if (webtorContainerRef.current) webtorContainerRef.current.style.display = 'block';
            initializeWebtorPlayer(null, tvEpisodeMagnet);
        } else if (providerUrls && providerUrls[selectedSource]) {
            if (providerIframeRef.current) {
                const url = providerUrls[selectedSource];
                if (providerIframeRef.current.src !== url) { // Avoid unnecessary reloads
                    console.log(`Loading provider iframe: ${url}`);
                    providerIframeRef.current.src = url || 'about:blank';
                }
                providerIframeRef.current.style.display = 'block';
            }
        } else {
            if(selectedSource && tmdbId) { // Only show message if a source was actually selected
                showPlayerMessage(`Source "${PROVIDER_DISPLAY_NAMES[selectedSource] || selectedSource}" is not available.`, true);
            }
        }
        updateButtonStyles();
    }, [
        selectedSource, currentSelectedTorrentHash, initialError, tmdbId, mediaType, tvEpisodeMagnet,
        providerUrls, availableTorrents, initializeWebtorPlayer, updateButtonStyles,
        showPlayerMessage, hidePlayerMessage
    ]);


    // Effect for building server and quality buttons (DOM manipulation)
    useEffect(() => {
        if (initialError || !tmdbId) {
             if(serverSelectorRef.current) serverSelectorRef.current.innerHTML = '';
             if(qualitySelectorRef.current) qualitySelectorRef.current.innerHTML = '';
            return;
        }

        const createButton = (text: string, sourceKey: string, iconHtml: string | null = null) => {
            const button = document.createElement('button');
            button.dataset.source = sourceKey;
            if (iconHtml) {
                const iconSpan = document.createElement('span');
                iconSpan.innerHTML = iconHtml;
                iconSpan.setAttribute('aria-hidden', 'true');
                button.appendChild(iconSpan);
            }
            const textSpan = document.createElement('span');
            textSpan.textContent = text;
            button.appendChild(textSpan);
            button.addEventListener('click', () => setSelectedSource(sourceKey));
            return button;
        };

        if (serverSelectorRef.current) {
            serverSelectorRef.current.innerHTML = '';
            const sourcesForButtons: { key: string; name: string; icon?: string }[] = [];

            Object.keys(providerUrls).forEach(sourceKey => {
                if (providerUrls[sourceKey]) {
                    sourcesForButtons.push({
                        key: sourceKey,
                        name: PROVIDER_DISPLAY_NAMES[sourceKey] || sourceKey,
                         icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>`
                    });
                }
            });

            if (mediaType === 'movie' && availableTorrents && availableTorrents.length > 0) {
                sourcesForButtons.push({ key: TORRENT_PROVIDER_MOVIE, name: PROVIDER_DISPLAY_NAMES[TORRENT_PROVIDER_MOVIE], icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2zM2 10a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>` });
            }
            if ((mediaType === 'tv' || mediaType === 'anime') && tvEpisodeMagnet) {
                sourcesForButtons.push({ key: TORRENT_PROVIDER_TV, name: PROVIDER_DISPLAY_NAMES[TORRENT_PROVIDER_TV], icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2zM2 10a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>` });
            }

            const priorityOrder = ['vidjoy', TORRENT_PROVIDER_MOVIE, TORRENT_PROVIDER_TV, 'vidsrc', 'vidlink', 'animeautoembed', 'twoanimexyz', 'playerautoembed', '2embed', 'embedsu', 'dramaautoembed'];
            sourcesForButtons.sort((a, b) => {
                const aIndex = priorityOrder.indexOf(a.key);
                const bIndex = priorityOrder.indexOf(b.key);
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return (PROVIDER_DISPLAY_NAMES[a.key] || a.key).localeCompare(PROVIDER_DISPLAY_NAMES[b.key] || b.key);
            });
            sourcesForButtons.forEach(source => serverSelectorRef.current?.appendChild(createButton(source.name, source.key, source.icon)));
        }

        if (qualitySelectorRef.current) {
            qualitySelectorRef.current.innerHTML = '';
             if (mediaType === 'movie' && availableTorrents && availableTorrents.length > 0) {
                qualitySelectorRef.current.innerHTML = '<span class="text-sm mr-1 text-gray-400">Quality:</span>';
                const sortedTorrents = [...availableTorrents].sort((a, b) => (b.quality || '').localeCompare(a.quality || ''));
                sortedTorrents.forEach(torrent => {
                    const button = document.createElement('button');
                    button.dataset.hash = torrent.hash;
                    button.textContent = `${torrent.quality}${torrent.type ? ` (${torrent.type.toUpperCase()})` : ''}`;
                    button.addEventListener('click', () => setCurrentSelectedTorrentHash(torrent.hash));
                    qualitySelectorRef.current?.appendChild(button);
                });
            }
        }
        updateButtonStyles();
    }, [
        initialError, tmdbId, mediaType, providerUrls, availableTorrents, 
        tvEpisodeMagnet, updateButtonStyles
    ]);

    // Effect to set document title
    useEffect(() => {
        // currentTitle state is now used for Webtor magnet link title.
        // Keep document.title update separate if initialTitle is preferred for that.
        if (!initialError && initialTitle) {
            document.title = `Watching ${initialTitle}`;
            setCurrentTitle(initialTitle); // Also update currentTitle state used by player
        } else if (initialError) {
            document.title = 'Error - Watch';
            setCurrentTitle('Error');
        } else {
            document.title = 'Watch';
            setCurrentTitle('Watch');
        }
    }, [initialTitle, initialError]);

    // Effect for VidLink pulsating style
    useEffect(() => {
        const styleId = 'vidlink-pulsate-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .vidlink-button-active { animation: pulseVidlink 2s infinite; transform-origin: center; }
                @keyframes pulseVidlink {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    70% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }`;
            document.head.appendChild(style);
            return () => {
                const styleElement = document.getElementById(styleId);
                if (styleElement) document.head.removeChild(styleElement);
            };
        }
    }, []);

    // Effect for Webtor instance cleanup on unmount
    useEffect(() => {
        return () => {
            if (webtorInstanceRef.current && typeof webtorInstanceRef.current.destroy === 'function') {
                console.log("Destroying webtor instance on component unmount (via ref).");
                webtorInstanceRef.current.destroy();
                
                // Check if window.webtor was this specific instance and clean up if so
                if (window.webtor === webtorInstanceRef.current) {
                     console.log("Resetting window.webtor as it was the destroyed instance.");
                     window.webtor = []; // Or back to its initial SDK state if known
                }
                webtorInstanceRef.current = null;
            } else if (window.webtor && typeof (window.webtor as WebtorPlayerInstance).destroy === 'function' && !Array.isArray(window.webtor)) {
                // If instance wasn't in ref, but window.webtor is a destroyable instance (e.g. SDK replaced array with instance)
                console.log("Destroying webtor instance on component unmount (via window.webtor).");
                (window.webtor as WebtorPlayerInstance).destroy();
                window.webtor = []; // Reset to command queue state
            }
        };
    }, []);


    if (initialError) {
        return (
            <div className="container mx-auto px-0 sm:px-2 md:px-4 py-8 min-h-[calc(100vh-100px)] flex flex-col bg-gray-900 text-white">
                <div className="text-center text-red-400 text-2xl font-semibold mt-10 flex-grow flex flex-col justify-center items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{initialError}</p>
                    <p className="text-lg text-gray-400 mt-2">Please check the link or go back.</p>
                    <Link href="/" className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors">Go Home</Link>
                </div>
                 <div className="text-center mt-8 text-xs text-gray-500">
                    <Link href="/dmca" className="hover:text-purple-400 underline">DMCA Policy</Link>
                </div>
            </div>
        );
    }

    if (!tmdbId && !initialError) {
        return (
             <div className="container mx-auto px-0 sm:px-2 md:px-4 py-8 min-h-[calc(100vh-100px)] flex flex-col bg-gray-900 text-white">
                <div className="text-center text-yellow-400 text-2xl font-semibold mt-10 flex-grow flex flex-col justify-center items-center">
                     <p>Loading watch information...</p>
                 </div>
                  <div className="text-center mt-8 text-xs text-gray-500">
                    <Link href="/dmca" className="hover:text-purple-400 underline">DMCA Policy</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-0 sm:px-2 md:px-4 py-8 min-h-[calc(100vh-100px)] flex flex-col bg-gray-900 text-white">
            <noscript>
                <div style={{ textAlign: 'center', padding: '20px', color: 'red', fontSize: '1.2em'}}>
                    JavaScript is required to use the player. Please enable it in your browser settings.
                </div>
            </noscript>

            <div ref={serverSelectorRef} id="server-selector" className="flex flex-wrap justify-center items-center gap-2 mb-4">
                {/* Server buttons dynamically populated */}
            </div>

            <div ref={qualitySelectorRef} id="quality-selector" className="flex justify-center items-center space-x-2 mb-4 flex-wrap gap-1" style={{ display: 'none' }}>
                {/* Quality buttons dynamically populated */}
            </div>

            <div className="flex-grow flex items-center justify-center w-full bg-black rounded-lg shadow-xl aspect-video relative overflow-hidden">
                <iframe
                    ref={providerIframeRef}
                    id="provider-iframe"
                    className="w-full h-full border-0 absolute inset-0"
                    title="Video Player"
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture"
                    style={{ display: 'none' }}
                ></iframe>

                <div
                    id="webtor-player-container" // ID used by Webtor SDK
                    ref={webtorContainerRef}
                    className="w-full h-full bg-black" // Ensure it takes space
                    style={{ display: 'none' }} // Controlled by effects
                >
                    {(isLoadingWebtorSDK || isWebtorPlayerLoading) && (
                         <div className="custom-webtor-loader flex items-center justify-center h-full text-gray-400 text-center px-4">
                             <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-600 h-12 w-12 mb-4 animate-spin border-t-purple-500"></div>
                             <p className="ml-4">{isLoadingWebtorSDK ? 'Loading Torrent SDK...' : 'Initializing Torrent Player...'}</p>
                         </div>
                    )}
                </div>

                <div ref={playerMessageOverlayRef} id="player-message-overlay" className="absolute inset-0 bg-black/80 flex items-center justify-center text-center px-4" style={{ display: 'none' }}>
                    <p ref={playerMessageRef} id="player-message" className="text-lg text-yellow-400"></p>
                </div>
            </div>

            <div className="text-center mt-8 text-xs text-gray-500">
                <Link href="/dmca" className="hover:text-purple-400 underline">DMCA Policy</Link>
            </div>

            <div className="text-xs text-center text-gray-500 mt-6 pb-4">
                <p>&copy; {new Date().getFullYear()} Your Site Name. All rights reserved.</p>
                <p className="mt-1">
                    <Link href="/" className="hover:text-gray-300 transition-colors">
                        Go to Homepage
                    </Link>
                </p>
            </div>
        </div>
    );
} 