import { createContext, useContext, useState, useRef, useEffect } from 'react';
import axios from 'axios';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio());
    const [time, setTime] = useState({
        currentTime: 0,
        totalTime: 0
    });

    const [tracks, setTracks] = useState([]);
    const [trackIndex, setTrackIndex] = useState(-1);

    useEffect(() => {
        if (!currentTrack) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        const resolveUrl = async () => {
            let audioSrc = null;
            console.log('Resolving URL for track:', currentTrack);

            // For YouTube tracks, try to get a direct audio stream
            if (currentTrack.source === 'youtube') {
                console.log('YouTube track detected, ID:', currentTrack.id);
                // Try using a YouTube audio proxy or direct stream
                audioSrc = `${import.meta.env.VITE_API_URL}/youtube/stream/${currentTrack.id}`;
                console.log('Using stream URL:', audioSrc);
            } else if (currentTrack.preview_url) {
                audioSrc = currentTrack.preview_url;
                console.log('Spotify preview URL:', audioSrc);
            } else {
                // Try to resolve to YouTube
                try {
                    const query = `${currentTrack.name} ${currentTrack.artists?.[0]?.name || ''} audio`;
                    console.log('Resolving to YouTube with query:', query);
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/youtube/resolve?q=${encodeURIComponent(query)}`);
                    if (res.data.id) {
                        audioSrc = `${import.meta.env.VITE_API_URL}/youtube/stream/${res.data.id}`;
                        console.log('Resolved to stream URL:', audioSrc);
                    }
                } catch (err) {
                    console.error("Failed to resolve track to YouTube:", err);
                }
            }

            if (audioSrc) {
                console.log('Setting audio source:', audioSrc);
                audioRef.current.src = audioSrc;
                audioRef.current.volume = 1.0;
                audioRef.current.play()
                    .then(() => {
                        console.log('Audio started playing successfully');
                        setIsPlaying(true);
                    })
                    .catch(err => {
                        console.error("Playback error:", err);
                        console.error("Error name:", err.name);
                        console.error("Error message:", err.message);
                    });
            } else {
                console.warn("No audio source available for this track");
                setIsPlaying(false);
            }
        };

        resolveUrl();

        audioRef.current.ontimeupdate = () => {
            setTime({
                currentTime: audioRef.current.currentTime,
                totalTime: audioRef.current.duration || 0
            });
        };

        audioRef.current.onended = () => {
            nextTrack();
        };

        audioRef.current.onerror = (e) => {
            console.error('Audio element error:', e);
            console.error('Audio error code:', audioRef.current.error?.code);
            console.error('Audio error message:', audioRef.current.error?.message);
        };

    }, [currentTrack]);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(err => console.error("Playback error:", err));
        }
    };

    const seek = (time) => {
        audioRef.current.currentTime = time;
    };

    const setVolume = (volume) => {
        audioRef.current.volume = volume;
    };

    const setOutputDevice = async (deviceId) => {
        if (audioRef.current.setSinkId) {
            try {
                await audioRef.current.setSinkId(deviceId);
                console.log(`Audio output set to device: ${deviceId}`);
                return true;
            } catch (err) {
                console.error('Error setting audio output device:', err);
                return false;
            }
        } else {
            console.warn('setSinkId not supported in this browser');
            return false;
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

    const nextTrack = () => {
        if (trackIndex < tracks.length - 1) {
            setTrackIndex(prev => prev + 1);
            setCurrentTrack(tracks[trackIndex + 1]);
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
            prevTrack,
            nextTrack,
            prevTrack,
            setOutputDevice, // Expose for device menu
            audioRef
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => useContext(PlayerContext);
