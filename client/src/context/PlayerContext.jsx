import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { API_URL } from '../config/api';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const { token } = useAuth();
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [time, setTime] = useState({ currentTime: 0, totalTime: 0 });
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
    const [activeDevice, setActiveDevice] = useState("This Device");
    const [recentTracks, setRecentTracks] = useState([]);

    const playerRef = useRef(null);
    const timeUpdateInterval = useRef(null);

    const toggleMaximize = () => setIsMaximized(prev => !prev);

    // Fetch recent tracks from server for logged-in users
    useEffect(() => {
        const fetchRecentTracks = async () => {
            if (token && token !== 'guest_token') {
                try {
                    const res = await axios.get(`${API_URL}/user/history`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data && Array.isArray(res.data)) {
                        // Transform server history to match track format
                        const tracks = res.data.map(item => ({
                            id: item.trackId || item.id,
                            name: item.name,
                            artists: [{ name: item.artist }],
                            image: item.image,
                            album: { images: [{ url: item.image }] }
                        }));
                        setRecentTracks(tracks);
                    }
                } catch (err) {
                    console.warn('Could not fetch recent tracks:', err);
                    // Fallback to localStorage for this session
                    try {
                        const saved = localStorage.getItem('spotify_recent');
                        if (saved) setRecentTracks(JSON.parse(saved));
                    } catch (e) { }
                }
            } else {
                // Guest user - use localStorage
                try {
                    const saved = localStorage.getItem('spotify_recent');
                    if (saved) setRecentTracks(JSON.parse(saved));
                } catch (e) { }
            }
        };

        fetchRecentTracks();
    }, [token]);

    // Persist to localStorage only for guest users
    useEffect(() => {
        if (!token || token === 'guest_token') {
            try {
                localStorage.setItem('spotify_recent', JSON.stringify(recentTracks));
            } catch (e) { }
        }
    }, [recentTracks, token]);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // Time update interval
    const startTimeUpdate = useCallback(() => {
        if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
        timeUpdateInterval.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const currentTime = playerRef.current.getCurrentTime();
                setTime(prev => ({ ...prev, currentTime }));
            }
        }, 100);
    }, []);

    const stopTimeUpdate = useCallback(() => {
        if (timeUpdateInterval.current) {
            clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = null;
        }
    }, []);

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
                setShuffledTracks([current, ...others]);
            } else {
                setShuffledTracks([]);
            }
            return newShuffleState;
        });
    }, [tracks, trackIndex]);

    const toggleRepeat = () => setRepeat(prev => (prev + 1) % 3);

    // Playback Navigation
    const playTrack = useCallback((track, allTracks = [], isInternalNavigation = false) => {
        setCurrentTrack(track);

        // Only update local recent tracks for guest users
        // For logged-in users, server history handles this
        if (track && (!token || token === 'guest_token')) {
            setRecentTracks(prev => {
                const filtered = prev.filter(t => t.id !== track.id);
                return [track, ...filtered].slice(0, 20);
            });
        }

        if (!isInternalNavigation) {
            if (allTracks.length > 0) {
                setTracks(allTracks);
                setTrackIndex(allTracks.findIndex(t => t.id === track.id));
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

    const [autoplay, setAutoplay] = useState(true);
    const playedSongsRef = useRef(new Set()); // Track played songs to avoid duplicates

    // Clear played songs cache every 30 minutes to allow re-recommendations
    useEffect(() => {
        const interval = setInterval(() => {
            playedSongsRef.current.clear();
        }, 30 * 60 * 1000); // 30 minutes

        return () => clearInterval(interval);
    }, []);

    const nextTrack = useCallback(async () => {
        const activeQueue = shuffle ? shuffledTracks : tracks;
        let currentIndex = -1;
        if (shuffle) currentIndex = activeQueue.findIndex(t => t.id === currentTrack?.id);
        else currentIndex = trackIndex;

        if (repeat === 2) { // Repeat One
            if (playerRef.current && playerRef.current.seekTo) {
                playerRef.current.seekTo(0, true);
                playerRef.current.playVideo();
            }
            return;
        }

        if (currentIndex < activeQueue.length - 1) {
            playTrack(activeQueue[currentIndex + 1], tracks, true);
        } else if (repeat === 1) { // Repeat All
            playTrack(activeQueue[0], tracks, true);
        } else if (autoplay && currentTrack) {
            // Smart Autoplay Logic with prediction algorithm
            try {
                // Build seed tracks from recent history and current track
                const seedTracks = [];

                // Add current track
                if (currentTrack.id) seedTracks.push(currentTrack.id);

                // Add recently played tracks (max 3)
                const recentIds = recentTracks
                    .slice(0, 3)
                    .map(t => t.id)
                    .filter(id => id && id !== currentTrack.id);
                seedTracks.push(...recentIds);

                // Get recommendations based on multiple seeds
                const seedParam = seedTracks.slice(0, 5).join(',');

                // Fetch recommendations with user's listening patterns
                const res = await axios.get(`${API_URL}/spotify/recommendations`, {
                    params: {
                        seed_tracks: seedParam,
                        limit: 10,
                        // Add variety based on current track
                        target_energy: 0.5,
                        target_danceability: 0.5,
                        target_valence: 0.5
                    }
                });

                let newTracks = res.data.tracks || [];

                // Filter out already played songs and current queue
                const existingIds = new Set([
                    ...tracks.map(t => t.id),
                    ...Array.from(playedSongsRef.current)
                ]);

                newTracks = newTracks.filter(track => !existingIds.has(track.id));

                if (newTracks.length > 0) {
                    // Add to queue
                    setTracks(prev => [...prev, ...newTracks]);
                    if (shuffle) setShuffledTracks(prev => [...prev, ...newTracks]);

                    // Play first recommended track
                    const nextSong = newTracks[0];
                    playedSongsRef.current.add(nextSong.id);
                    playTrack(nextSong, tracks, true);
                } else {
                    // Fallback: get fresh recommendations without filters
                    const fallbackRes = await axios.get(`${API_URL}/spotify/recommendations`, {
                        params: {
                            seed_tracks: currentTrack.id,
                            limit: 5
                        }
                    });
                    const fallbackTracks = fallbackRes.data.tracks || [];
                    if (fallbackTracks.length > 0) {
                        setTracks(prev => [...prev, ...fallbackTracks]);
                        if (shuffle) setShuffledTracks(prev => [...prev, ...fallbackTracks]);
                        playTrack(fallbackTracks[0], tracks, true);
                    }
                }
            } catch (err) {
                console.error("Autoplay failed", err);
            }
        }
    }, [trackIndex, tracks, shuffledTracks, shuffle, repeat, currentTrack, playTrack, autoplay, recentTracks]);

    const prevTrack = useCallback(() => {
        if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getCurrentTime() > 5) {
            playerRef.current.seekTo(0, true);
            return;
        }

        const activeQueue = shuffle ? shuffledTracks : tracks;
        let currentIndex = -1;
        if (shuffle) currentIndex = activeQueue.findIndex(t => t.id === currentTrack?.id);
        else currentIndex = trackIndex;

        if (currentIndex > 0) {
            playTrack(activeQueue[currentIndex - 1], tracks, true);
        } else {
            if (playerRef.current && playerRef.current.seekTo) {
                playerRef.current.seekTo(0, true);
            }
        }
    }, [trackIndex, tracks, shuffledTracks, shuffle, currentTrack, playTrack]);

    const nextTrackRef = useRef(nextTrack);
    useEffect(() => { nextTrackRef.current = nextTrack; }, [nextTrack]);

    // Google Cast Logic
    useEffect(() => {
        window['__onGCastApiAvailable'] = (isAvailable) => {
            if (isAvailable && window.cast) {
                try {
                    window.cast.framework.CastContext.getInstance().setOptions({
                        receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
                        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
                    });
                } catch (e) { }
            }
        };
    }, []);

    const requestCast = useCallback(() => {
        if (window.cast && window.cast.framework) {
            const context = window.cast.framework.CastContext.getInstance();
            try { context.setOptions({ receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID, autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED }); } catch (e) { }
            context.requestSession().catch((e) => { if (e !== 'cancel') console.error('Cast Error', e); });
        } else {
            alert('Google Cast is not available.');
        }
    }, []);

    // Track Resolution & Metadata with caching
    const videoIdCache = useRef(new Map()); // Cache resolved video IDs

    useEffect(() => {
        if (!currentTrack) {
            setVideoId(null);
            setIsPlaying(false);
            if (playerRef.current && playerRef.current.stopVideo) {
                playerRef.current.stopVideo();
            }
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "none";
            return;
        }

        const addToHistory = async () => {
            try {
                // Skip for guest users
                if (token && token !== 'guest_token') {
                    await axios.post(`${API_URL}/user/history`, {
                        trackId: currentTrack.id,
                        name: currentTrack.name,
                        artist: currentTrack.artists?.[0]?.name || 'Unknown',
                        image: currentTrack.image || currentTrack.album?.images?.[0]?.url
                    }, { headers: { Authorization: `Bearer ${token}` } });
                }
            } catch (e) { }
        };
        addToHistory();

        const resolve = async () => {
            try {
                let vid = null;

                // Check cache first
                const cacheKey = currentTrack.id || currentTrack.name;
                if (videoIdCache.current.has(cacheKey)) {
                    vid = videoIdCache.current.get(cacheKey);
                    setVideoId(vid);
                    return;
                }

                if (currentTrack.source === 'youtube' && currentTrack.id) {
                    vid = currentTrack.id;
                } else if (currentTrack.preview_url && currentTrack.preview_url.includes('v=')) {
                    const match = currentTrack.preview_url.match(/[?&]v=([^&]+)/);
                    vid = match ? match[1] : null;
                } else {
                    const query = `${currentTrack.name} ${currentTrack.artists?.[0]?.name || ''}`;
                    const res = await axios.get(`${API_URL}/youtube/resolve?q=${encodeURIComponent(query)}`);
                    if (res.data.url) {
                        const match = res.data.url.match(/[?&]v=([^&]+)/);
                        vid = match ? match[1] : null;
                    }
                }

                if (vid) {
                    // Cache the video ID
                    videoIdCache.current.set(cacheKey, vid);
                    setVideoId(vid);
                }
            } catch (e) { console.error(e); }
        };
        resolve();

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.name,
                artist: currentTrack.artists?.map(a => a.name).join(', '),
                album: currentTrack.album?.name || 'Single',
                artwork: [{ src: currentTrack.image || currentTrack.album?.images?.[0]?.url || '', sizes: '512x512', type: 'image/jpeg' }]
            });
            navigator.mediaSession.setActionHandler('play', () => togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => togglePlay());
            navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
            navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
        }
    }, [currentTrack, token]);

    // Initialize or update YouTube player when videoId changes
    useEffect(() => {
        if (!videoId) return;

        const initPlayer = () => {
            if (playerRef.current && playerRef.current.loadVideoById) {
                // Player exists, just load new video
                playerRef.current.loadVideoById(videoId);
                playerRef.current.setVolume(volume);
                playerRef.current.playVideo();
            } else if (window.YT && window.YT.Player) {
                // Create new player
                playerRef.current = new window.YT.Player('youtube-player', {
                    videoId: videoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        modestbranding: 1,
                        playsinline: 1,
                        rel: 0, // Don't show related videos
                        showinfo: 0,
                        iv_load_policy: 3,
                        enablejsapi: 1,
                        origin: window.location.origin
                    },
                    events: {
                        onReady: (event) => {
                            console.log('YouTube Player ready');
                            setPlayerReady(true);
                            event.target.setVolume(volume);
                            event.target.playVideo();
                            setIsPlaying(true);
                            startTimeUpdate();
                        },
                        onStateChange: (event) => {
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                setIsPlaying(true);
                                startTimeUpdate();
                                const duration = event.target.getDuration();
                                setTime(prev => ({ ...prev, totalTime: duration }));
                            } else if (event.data === window.YT.PlayerState.PAUSED) {
                                setIsPlaying(false);
                                stopTimeUpdate();
                            } else if (event.data === window.YT.PlayerState.ENDED) {
                                setIsPlaying(false);
                                stopTimeUpdate();
                                // Debounce to prevent double-firing
                                setTimeout(() => {
                                    if (nextTrackRef.current) nextTrackRef.current();
                                }, 100);
                            }
                        },
                        onError: (event) => {
                            console.error('YouTube player error:', event.data);
                            // Auto-skip on error
                            if (nextTrackRef.current) nextTrackRef.current();
                        }
                    }
                });
            }
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = initPlayer;
        }

        return () => {
            stopTimeUpdate();
        };
    }, [videoId, startTimeUpdate, stopTimeUpdate]);

    // Update volume without reinitializing player
    useEffect(() => {
        if (playerRef.current && playerRef.current.setVolume && playerReady) {
            playerRef.current.setVolume(volume);
        }
    }, [volume, playerReady]);

    const togglePlay = useCallback(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    }, [isPlaying]);

    const seek = useCallback((seconds) => {
        if (playerRef.current && playerRef.current.seekTo) {
            playerRef.current.seekTo(seconds, true);
        }
    }, []);

    const setVolume = useCallback((vol) => {
        const volumePercent = vol * 100;
        setVolumeState(volumePercent);
        localStorage.setItem('spotify_volume', volumePercent);
        if (playerRef.current && playerRef.current.setVolume) {
            playerRef.current.setVolume(Math.max(0, Math.min(100, vol > 1 ? vol : volumePercent)));
        }
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
                case 'Space': e.preventDefault(); togglePlay(); break;
                case 'ArrowRight': e.preventDefault(); seek(Math.min(time.totalTime, time.currentTime + 5)); break;
                case 'ArrowLeft': e.preventDefault(); seek(Math.max(0, time.currentTime - 5)); break;
                case 'ArrowUp': e.preventDefault(); setVolume(Math.min(1, (volume / 100) + 0.05)); break;
                case 'ArrowDown': e.preventDefault(); setVolume(Math.max(0, (volume / 100) - 0.05)); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, seek, time, volume, setVolume]);

    // Queue Helpers
    const addToQueue = useCallback((track) => {
        if (!track) return;
        setTracks(prev => [...prev, track]);
        if (shuffle) setShuffledTracks(prev => [...prev, track]);
    }, [shuffle]);

    const playNext = useCallback((track) => {
        if (!track) return;
        setTracks(prev => {
            const newTracks = [...prev];
            newTracks.splice(trackIndex + 1, 0, track);
            return newTracks;
        });
        if (shuffle) {
            setShuffledTracks(prev => {
                const idx = prev.findIndex(t => t.id === currentTrack?.id);
                const newShuffled = [...prev];
                newShuffled.splice(idx + 1, 0, track);
                return newShuffled;
            });
        }
    }, [trackIndex, shuffle, currentTrack]);

    // Audio Device Selection (Note: YouTube IFrame doesn't support setSinkId)
    const getAudioDevices = useCallback(async () => {
        try {
            // Request microphone permission first (required to enumerate devices)
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
            return audioOutputs.map(device => ({
                deviceId: device.deviceId,
                label: device.label || `Speaker ${device.deviceId.slice(0, 5)}`
            }));
        } catch (err) {
            console.warn('Could not enumerate audio devices:', err);
            return [];
        }
    }, []);

    const selectAudioDevice = useCallback((deviceId, label) => {
        setActiveDevice(label);
        // Note: YouTube IFrame API doesn't support setSinkId for audio output
        // The user will need to change audio output in their browser/OS settings
        console.log('Selected device:', label, deviceId);
        // Show a toast or notification that device selection isn't supported with YouTube player
    }, []);

    return (
        <PlayerContext.Provider value={{
            currentTrack, isPlaying, togglePlay, playTrack, time, seek, setVolume,
            nextTrack, prevTrack, playerReady, isMaximized, toggleMaximize,
            shuffle, repeat, toggleShuffle, toggleRepeat, recentTracks,
            tracks: shuffle ? shuffledTracks : tracks,
            queue: shuffle ? shuffledTracks : tracks,
            addToQueue, playNext, volume, isMuted, toggleMute,
            activeDevice, setActiveDevice, requestCast, getAudioDevices, selectAudioDevice
        }}>
            {children}
            {/* Hidden YouTube player */}
            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px' }}>
                <div id="youtube-player"></div>
            </div>
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => useContext(PlayerContext);
