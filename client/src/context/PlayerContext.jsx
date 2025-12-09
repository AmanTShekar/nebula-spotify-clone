import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [time, setTime] = useState({
        currentTime: 0,
        totalTime: 0
    });
    const [volume, setVolumeState] = useState(() => {
        const saved = localStorage.getItem('spotify_volume');
        return saved ? parseFloat(saved) : 100;
    });
    const [tracks, setTracks] = useState([]);
    const [shuffledTracks, setShuffledTracks] = useState([]);
    const [trackIndex, setTrackIndex] = useState(-1);
    const [videoId, setVideoId] = useState(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(0);
    const [recentTracks, setRecentTracks] = useState(() => {
        try {
            const saved = localStorage.getItem('spotify_recent');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse recent tracks", e);
            return [];
        }
    });

    const playerContainerRef = useRef(null);
    const playerRef = useRef(null);
    const timeUpdateInterval = useRef(null);

    const toggleMaximize = () => setIsMaximized(prev => !prev);

    // Persist Recent Tracks
    useEffect(() => {
        try {
            localStorage.setItem('spotify_recent', JSON.stringify(recentTracks));
        } catch (e) {
            console.error("Failed to save recent tracks", e);
        }
    }, [recentTracks]);

    // Shuffle Logic
    const toggleShuffle = useCallback(() => {
        setShuffle(prev => {
            const newShuffleState = !prev;
            if (newShuffleState) {
                const current = tracks[trackIndex];
                const others = tracks.filter((_, i) => i !== trackIndex);
                for (let i = others.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [others[i], others[j]] = [others[j], others[i]];
                }
                const newQueue = [current, ...others];
                setShuffledTracks(newQueue);
            } else {
                setShuffledTracks([]);
            }
            return newShuffleState;
        });
    }, [tracks, trackIndex]);

    const toggleRepeat = () => setRepeat(prev => (prev + 1) % 3);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // Helper functions
    const startTimeUpdate = useCallback(() => {
        if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
        timeUpdateInterval.current = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                try {
                    const currentTime = playerRef.current.getCurrentTime();
                    const duration = playerRef.current.getDuration();
                    setTime({ currentTime, totalTime: duration });
                } catch (e) { /* Player not ready */ }
            }
        }, 100);
    }, []);

    const stopTimeUpdate = useCallback(() => {
        if (timeUpdateInterval.current) {
            clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = null;
        }
    }, []);

    const playTrack = useCallback((track, allTracks = [], isInternalNavigation = false) => {
        setCurrentTrack(track);

        // Add to History (Deduped)
        if (track) {
            setRecentTracks(prev => {
                const filtered = prev.filter(t => t.id !== track.id);
                return [track, ...filtered].slice(0, 20);
            });
        }

        if (!isInternalNavigation) {
            // New playback request from UI
            if (allTracks.length > 0) {
                setTracks(allTracks);
                setTrackIndex(allTracks.findIndex(t => t.id === track.id));
                // We access the current value of 'shuffle' from the state captured in closure
                // To avoid stale 'shuffle', we should include it in dependency or use functional updates where possible.
                // However, playTrack is complex. Let's rely on 'shuffle' dependency.
                if (shuffle) {
                    const others = allTracks.filter(t => t.id !== track.id);
                    for (let i = others.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [others[i], others[j]] = [others[j], others[i]];
                    }
                    setShuffledTracks([track, ...others]);
                }
            } else {
                setTracks([track]);
                setTrackIndex(0);
                if (shuffle) setShuffledTracks([track]);
            }
        } else {
            setTrackIndex(tracks.findIndex(t => t.id === track.id));
        }
    }, [tracks, shuffle]);

    // Navigation Logic
    const [autoplay, setAutoplay] = useState(true);

    const nextTrack = useCallback(async () => {
        const activeQueue = shuffle ? shuffledTracks : tracks;
        let currentIndex = -1;
        if (shuffle) {
            currentIndex = activeQueue.findIndex(t => t.id === currentTrack?.id);
        } else {
            currentIndex = trackIndex;
        }

        if (repeat === 2) { // Repeat One
            if (playerRef.current) {
                playerRef.current.seekTo(0);
                playerRef.current.playVideo();
            }
            return;
        }

        if (currentIndex < activeQueue.length - 1) {
            const next = activeQueue[currentIndex + 1];
            playTrack(next, tracks, true);
        } else if (repeat === 1) { // Repeat All
            const next = activeQueue[0];
            playTrack(next, tracks, true);
        } else if (autoplay && currentTrack) {
            // Autoplay Logic: Fetch recommendations
            try {
                // Determine seed (Spotify ID preferred)
                const seedTrack = currentTrack.id; // Assuming ID is Spotify ID for now or we have mapped it
                if (!seedTrack) return;

                const token = await axios.get(`${import.meta.env.VITE_API_URL}/auth/token`); // Minimal token fetch or use existing logic if possible. 
                // Context doesn't have token easily without usingAuth hook which might cause circular dep.
                // Actually we can use the backend endpoint which handles token.

                const res = await axios.get(`${import.meta.env.VITE_API_URL}/spotify/recommendations?seed_tracks=${seedTrack}&limit=5`);
                const newTracks = res.data.tracks;

                if (newTracks && newTracks.length > 0) {
                    // Append to tracks
                    setTracks(prev => [...prev, ...newTracks]);
                    if (shuffle) {
                        setShuffledTracks(prev => [...prev, ...newTracks]);
                    }

                    // Play the first new track immediately
                    playTrack(newTracks[0], tracks, true); // Note: passing 'tracks' here might be stale, but playTrack updates global state.
                    // Actually, safer to just append and let the next 'nextTrack' call or manual play work? 
                    // No, we want seamless playback.
                    // playTrack updates 'currentTrack', 'recentTracks'.
                    // We need to ensure the queue state is updated before playing? 
                    // React state updates are batched.

                    // Let's rely on the fact that we updated state, and we pass the object.
                    // 'playTrack' uses 'tracks' from its closure provided by 'nextTrack'.
                }
            } catch (err) {
                console.error("Autoplay failed", err);
            }
        }
    }, [trackIndex, tracks, shuffledTracks, shuffle, repeat, currentTrack, playTrack, autoplay]);

    const prevTrack = useCallback(() => {
        if (playerRef.current && playerRef.current.getCurrentTime() > 5) {
            playerRef.current.seekTo(0);
            return;
        }

        const activeQueue = shuffle ? shuffledTracks : tracks;
        let currentIndex = -1;
        if (shuffle) {
            currentIndex = activeQueue.findIndex(t => t.id === currentTrack?.id);
        } else {
            currentIndex = trackIndex;
        }

        if (currentIndex > 0) {
            const prev = activeQueue[currentIndex - 1];
            playTrack(prev, tracks, true);
        } else {
            playerRef.current.seekTo(0);
        }
    }, [trackIndex, tracks, shuffledTracks, shuffle, currentTrack, playTrack]);

    // Handle track changes (Video ID resolution)
    useEffect(() => {
        if (!currentTrack) {
            setVideoId(null);
            setIsPlaying(false);
            if (playerRef.current) playerRef.current.stopVideo();
            return;
        }

        const resolveVideo = async () => {
            try {
                let vid = null;
                if (currentTrack.source === 'youtube' && currentTrack.id) {
                    vid = currentTrack.id;
                } else if (currentTrack.source === 'youtube' && currentTrack.preview_url) {
                    const match = currentTrack.preview_url.match(/[?&]v=([^&]+)/);
                    vid = match ? match[1] : null;
                } else {
                    const query = `${currentTrack.name} ${currentTrack.artists?.[0]?.name || ''}`;
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/youtube/resolve?q=${encodeURIComponent(query)}`);
                    if (res.data.url) {
                        const match = res.data.url.match(/[?&]v=([^&]+)/);
                        vid = match ? match[1] : null;
                    }
                }

                if (vid) setVideoId(vid);
                else console.warn('Could not resolve video ID');
            } catch (err) {
                console.error('Failed to resolve video:', err);
            }
        };
        resolveVideo();
    }, [currentTrack]);

    // Ref-based NextTrack for Player Callbacks to avoid stale closures
    const nextTrackRef = useRef(nextTrack);
    useEffect(() => { nextTrackRef.current = nextTrack; }, [nextTrack]);

    // Initialize/Update Player
    useEffect(() => {
        if (!videoId) return;
        let playerInstance = null;
        const createPlayer = () => {
            if (playerRef.current) playerRef.current.destroy();
            if (playerContainerRef.current) playerContainerRef.current.innerHTML = '<div id="youtube-player-instance"></div>';

            playerInstance = new window.YT.Player('youtube-player-instance', {
                videoId: videoId,
                playerVars: {
                    autoplay: 1, controls: 0, disablekb: 1, fs: 0,
                    modestbranding: 1, playsinline: 1, rel: 0, showinfo: 0,
                    iv_load_policy: 3, origin: window.location.origin,
                },
                events: {
                    onReady: (event) => {
                        setPlayerReady(true);
                        playerRef.current = event.target;
                        event.target.setVolume(volume);
                        event.target.playVideo();
                        setIsPlaying(true);
                        startTimeUpdate();
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.PLAYING) {
                            setIsPlaying(true);
                            startTimeUpdate();
                        } else if (event.data === window.YT.PlayerState.PAUSED) {
                            setIsPlaying(false);
                            stopTimeUpdate();
                        } else if (event.data === window.YT.PlayerState.ENDED) {
                            setIsPlaying(false);
                            stopTimeUpdate();
                            if (nextTrackRef.current) nextTrackRef.current();
                        }
                    }
                }
            });
            playerRef.current = playerInstance;
        };

        if (window.YT && window.YT.Player) createPlayer();
        else window.onYouTubeIframeAPIReady = createPlayer;

        return () => {
            if (playerRef.current) {
                try { playerRef.current.destroy(); } catch (e) { }
            }
            stopTimeUpdate();
        };
    }, [videoId]);

    const togglePlay = useCallback(() => {
        if (playerRef.current) {
            isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
        }
    }, [isPlaying]);

    const seek = useCallback((seconds) => {
        if (playerRef.current) playerRef.current.seekTo(seconds, true);
    }, []);

    const setVolume = useCallback((vol) => {
        const volumePercent = vol * 100;
        setVolumeState(volumePercent);
        localStorage.setItem('spotify_volume', volumePercent);
        if (playerRef.current) playerRef.current.setVolume(volumePercent);
        if (volumePercent > 0) setIsMuted(false);
    }, []);

    const [isMuted, setIsMuted] = useState(false);
    const prevVolumeRef = useRef(100);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newState = !prev;
            if (newState) {
                prevVolumeRef.current = volume;
                setVolume(0);
            } else {
                setVolume(prevVolumeRef.current > 0 ? prevVolumeRef.current / 100 : 0.3);
            }
            return newState;
        });
    }, [volume, setVolume]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    seek(Math.min(time.totalTime, time.currentTime + 5));
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    seek(Math.max(0, time.currentTime - 5));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setVolume(Math.min(1, (volume / 100) + 0.05));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setVolume(Math.max(0, (volume / 100) - 0.05));
                    break;
                case 'KeyM':
                    setVolume(volume > 0 ? 0 : 0.5);
                    break;
                case 'KeyN':
                    nextTrack();
                    break;
                case 'KeyP':
                    prevTrack();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, seek, time, volume, setVolume, nextTrack, prevTrack]);

    // Queue Management
    const addToQueue = useCallback((track) => {
        if (!track) return;
        setTracks(prev => [...prev, track]);
        if (shuffle) setShuffledTracks(prev => [...prev, track]);
    }, [shuffle]);

    const playNext = useCallback((track) => {
        if (!track) return;
        setTracks(prev => {
            const newTracks = [...prev];
            // If shuffle is on, this is complex. For now, simplistically inject after current index.
            // But 'prev' might be just 'tracks' or user expects 'activeQueue'.
            // Actually we interact with 'tracks' as the source of truth.
            // But if shuffle is on, we should also inject into 'shuffledTracks'.

            // Logic: Find current index in 'tracks', insert after.
            // Ideally we need to know the current track's index in state to do this perfectly.
            // Using trackIndex.
            const insertIndex = trackIndex + 1;
            newTracks.splice(insertIndex, 0, track);
            return newTracks;
        });

        if (shuffle) {
            setShuffledTracks(prev => {
                const currentId = currentTrack?.id;
                const idx = prev.findIndex(t => t.id === currentId);
                const newShuffled = [...prev];
                newShuffled.splice(idx + 1, 0, track);
                return newShuffled;
            });
        }
    }, [trackIndex, shuffle, currentTrack]);

    return (
        <PlayerContext.Provider value={{
            currentTrack, isPlaying, togglePlay, playTrack, time, seek, setVolume,
            nextTrack, prevTrack, playerReady, isMaximized, toggleMaximize,
            shuffle, repeat, toggleShuffle, toggleRepeat,
            recentTracks,
            tracks: shuffle ? shuffledTracks : tracks,
            queue: shuffle ? shuffledTracks : tracks,
            addToQueue, playNext,
            volume, isMuted, toggleMute, // Exposed for unified slider
        }}>
            {children}
            <div ref={playerContainerRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}></div>
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => useContext(PlayerContext);
