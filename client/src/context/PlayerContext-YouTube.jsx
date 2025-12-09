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
    const [volume, setVolumeState] = useState(100);
    const [tracks, setTracks] = useState([]);
    const [trackIndex, setTrackIndex] = useState(-1);
    const [videoId, setVideoId] = useState(null);

    const playerRef = useRef(null);
    const timeUpdateInterval = useRef(null);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // Define helper functions with useCallback
    const startTimeUpdate = useCallback(() => {
        if (timeUpdateInterval.current) {
            clearInterval(timeUpdateInterval.current);
        }
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

    const nextTrack = useCallback(() => {
        if (trackIndex < tracks.length - 1) {
            setTrackIndex(prev => prev + 1);
            setCurrentTrack(tracks[trackIndex + 1]);
        }
    }, [trackIndex, tracks]);

    // Handle track changes
    useEffect(() => {
        if (!currentTrack) {
            setVideoId(null);
            setIsPlaying(false);
            if (playerRef.current && playerRef.current.stopVideo) {
                playerRef.current.stopVideo();
            }
            return;
        }

        const resolveVideo = async () => {
            try {
                let youtubeUrl;
                let vid;

                // If it's already a YouTube track with an ID
                if (currentTrack.source === 'youtube' && currentTrack.id) {
                    vid = currentTrack.id;
                } else if (currentTrack.source === 'youtube' && currentTrack.preview_url) {
                    const match = currentTrack.preview_url.match(/[?&]v=([^&]+)/);
                    vid = match ? match[1] : null;
                } else {
                    // Resolve from Spotify track to YouTube
                    const query = `${currentTrack.name} ${currentTrack.artists?.[0]?.name || ''}`;
                    console.log('Resolving to YouTube:', query);
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/youtube/resolve?q=${encodeURIComponent(query)}`);
                    youtubeUrl = res.data.url;
                    const match = youtubeUrl.match(/[?&]v=([^&]+)/);
                    vid = match ? match[1] : null;
                }

                if (vid) {
                    console.log('Loading video ID:', vid);
                    setVideoId(vid);
                } else {
                    console.error('Could not resolve video ID');
                }
            } catch (err) {
                console.error('Failed to resolve video:', err);
            }
        };

        resolveVideo();
    }, [currentTrack]);

    // Initialize or update player when videoId changes
    useEffect(() => {
        if (!videoId) return;

        const initPlayer = () => {
            if (playerRef.current && playerRef.current.loadVideoById) {
                // Player exists, just load new video
                playerRef.current.loadVideoById(videoId);
                playerRef.current.setVolume(volume);
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
                        rel: 0,
                        showinfo: 0,
                        iv_load_policy: 3,
                    },
                    events: {
                        onReady: (event) => {
                            console.log('Player ready');
                            event.target.setVolume(volume);
                            event.target.playVideo();
                            setIsPlaying(true);
                            startTimeUpdate();
                        },
                        onStateChange: (event) => {
                            console.log('Player state:', event.data);
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
                                nextTrack();
                            }
                        },
                        onError: (event) => {
                            console.error('YouTube player error:', event.data);
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
    }, [videoId, volume, startTimeUpdate, stopTimeUpdate, nextTrack]);

    const togglePlay = () => {
        if (!playerRef.current) return;

        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const seek = (seconds) => {
        if (playerRef.current && playerRef.current.seekTo) {
            playerRef.current.seekTo(seconds, true);
        }
    };

    const setVolume = (vol) => {
        const volumePercent = vol * 100;
        setVolumeState(volumePercent);
        if (playerRef.current && playerRef.current.setVolume) {
            playerRef.current.setVolume(volumePercent);
        }
    };

    const playTrack = (track, allTracks = []) => {
        console.log('playTrack called with:', track);
        setCurrentTrack(track);
        if (allTracks.length > 0) {
            setTracks(allTracks);
            const index = allTracks.findIndex(t => t.id === track.id);
            setTrackIndex(index);
        } else {
            setTracks([track]);
            setTrackIndex(0);
        }
    };

    const prevTrack = () => {
        if (trackIndex > 0) {
            setTrackIndex(prev => prev - 1);
            setCurrentTrack(tracks[trackIndex - 1]);
        }
    };

    return (
        <PlayerContext.Provider value={{
            currentTrack,
            isPlaying,
            togglePlay,
            playTrack,
            time,
            seek,
            setVolume,
            nextTrack,
            prevTrack
        }}>
            {children}
            {/* Hidden YouTube player */}
            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
                <div id="youtube-player"></div>
            </div>
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => useContext(PlayerContext);
