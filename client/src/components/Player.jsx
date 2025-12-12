import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1, Maximize2, Repeat, Repeat1, Shuffle, Cast, Laptop, Smartphone, Speaker, ListMusic, Heart, ChevronUp, Mic2, Layers, Disc } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config/api';

const Player = () => {
    const {
        currentTrack, isPlaying, togglePlay, time, seek, setVolume, nextTrack, prevTrack,
        toggleMaximize, isMaximized, shuffle, repeat, toggleShuffle, toggleRepeat, volume,
        queue, playTrack, toggleMute, isMuted,
        activeDevice, setActiveDevice, requestCast, selectAudioDevice, getAudioDevices
    } = usePlayer();

    const { token } = useAuth();
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);
    const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
    const [availableDevices, setAvailableDevices] = useState([]);
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isHoveringSeek, setIsHoveringSeek] = useState(false);
    const [isHoveringVolume, setIsHoveringVolume] = useState(false);

    const deviceMenuRef = useRef(null);
    const queueMenuRef = useRef(null);
    const progressBarRef = useRef(null);

    // Sync seekValue with currentTime when not seeking
    useEffect(() => {
        if (!isSeeking && time.currentTime) {
            setSeekValue(time.currentTime);
        }
    }, [time.currentTime, isSeeking]);


    const likesCache = useRef(null);
    const likesCacheTime = useRef(0);

    useEffect(() => {
        const checkIfLiked = async () => {
            if (!currentTrack || !token || token === 'guest_token') {
                setIsLiked(false);
                return;
            }

            try {
                // Use cache if less than 30 seconds old
                const now = Date.now();
                if (likesCache.current && (now - likesCacheTime.current) < 30000) {
                    const liked = likesCache.current.some(track => track.id === currentTrack.id);
                    setIsLiked(liked || false);
                    return;
                }

                // Fetch fresh data
                const res = await axios.get(`${API_URL}/user/likes`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                likesCache.current = res.data || [];
                likesCacheTime.current = now;

                const liked = likesCache.current.some(track => track.id === currentTrack.id);
                setIsLiked(liked || false);
            } catch (err) {
                setIsLiked(false);
            }
        };

        checkIfLiked();
    }, [currentTrack, token]);

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!token || token === 'guest_token') return;

        const newLikedState = !isLiked;
        setIsLiked(newLikedState); // Optimistic update

        try {
            if (newLikedState) {
                // Add to likes
                await axios.post(`${API_URL}/user/likes`, {
                    id: currentTrack.id,
                    name: currentTrack.name,
                    artists: currentTrack.artists,
                    album: currentTrack.album,
                    image: currentTrack.image || currentTrack.album?.images?.[0]?.url
                }, { headers: { Authorization: `Bearer ${token}` } });

                // Update cache
                if (likesCache.current) {
                    likesCache.current = [currentTrack, ...likesCache.current];
                }
            } else {
                // Remove from likes
                await axios.delete(`${API_URL}/user/likes/${currentTrack.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Update cache
                if (likesCache.current) {
                    likesCache.current = likesCache.current.filter(t => t.id !== currentTrack.id);
                }
            }
        } catch (err) {
            console.error('Failed to update like:', err);
            setIsLiked(!newLikedState); // Revert on error
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (deviceMenuRef.current && !deviceMenuRef.current.contains(event.target)) setIsDeviceMenuOpen(false);
            if (queueMenuRef.current && !queueMenuRef.current.contains(event.target)) setIsQueueOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleDeviceMenu = async () => {
        if (!isDeviceMenuOpen) {
            const devs = await getAudioDevices();
            setAvailableDevices(devs);
        }
        setIsDeviceMenuOpen(!isDeviceMenuOpen);
    };

    const handleSelectDevice = (id, label) => {
        selectAudioDevice(id, label);
        setIsDeviceMenuOpen(false);
    };

    if (!currentTrack || isMaximized) return null;

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "-:--";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const calculateSeek = (e) => {
        const bar = progressBarRef.current;
        if (!bar) return 0;
        const rect = bar.getBoundingClientRect();
        const currentDuration = time.totalTime > 0 ? time.totalTime : (currentTrack?.duration_ms ? currentTrack.duration_ms / 1000 : 0);
        if (currentDuration <= 0) return 0;
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        return percent * currentDuration;
    };

    const handlePointerDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsSeeking(true);
        setSeekValue(calculateSeek(e));
    };

    const handlePointerMove = (e) => {
        if (isSeeking) setSeekValue(calculateSeek(e));
    };

    const handlePointerUp = (e) => {
        if (isSeeking) {
            setIsSeeking(false);
            seek(calculateSeek(e));
        }
    };

    // Desktop Input Handlers (Compatibility - kept but unused if div slider works)
    const handleSeekCommit = () => { if (isSeeking) { seek(seekValue); setIsSeeking(false); } };
    const handleInputSeekChange = (e) => {
        const val = parseFloat(e.target.value);
        const currentDuration = time.totalTime > 0 ? time.totalTime : (currentTrack?.duration_ms ? currentTrack.duration_ms / 1000 : 0);
        setSeekValue((val / 100) * currentDuration);
    };

    const rawTime = isSeeking ? seekValue : (time.currentTime || 0);
    const duration = time.totalTime > 0 ? time.totalTime : (currentTrack?.duration_ms ? currentTrack.duration_ms / 1000 : 0);
    const displayedTime = duration > 0 ? Math.min(rawTime, duration) : 0;
    const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayedTime / duration) * 100)) : 0;

    // Styles
    const glassPanel = "bg-black/80 backdrop-blur-xl border border-white/10";
    const iconBtn = "p-2 text-white/50 hover:text-white transition-all hover:scale-110 active:scale-95";
    const iconBtnActive = "text-purple-400 relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-purple-400 after:rounded-full shadow-purple-500/50 drop-shadow-sm";

    return (
        <>
            {/* ==============================================
                MOBILE FLOATING DOCK
               ============================================== */}
            <div
                className="md:hidden fixed bottom-[90px] left-3 right-3 z-50 animate-in fade-in slide-in-from-bottom-6 duration-500"
                onClick={toggleMaximize}
            >
                <div className={`${glassPanel} h-[76px] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex items-center pr-3 pl-2 gap-3 overflow-hidden relative`}>

                    {/* Vinyl Record Style Art */}
                    <div className={`relative w-[56px] h-[56px] shrink-0 rounded-full border border-white/10 shadow-lg flex items-center justify-center bg-black ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
                        <img
                            src={currentTrack.album?.images?.[0]?.url || currentTrack.image}
                            className="w-full h-full rounded-full object-cover opacity-90"
                            alt=""
                        />
                        <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(#000_0,#000_1px,transparent_1px,transparent_4px)] opacity-20 pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#111] rounded-full border-2 border-[#333] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-black rounded-full" />
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-white font-bold text-[15px] truncate">{currentTrack.name}</span>
                        </div>
                        <span className="text-white/60 text-[13px] truncate">{currentTrack.artists?.[0]?.name}</span>
                    </div>

                    {/* Quick Controls */}
                    <div className="flex items-center gap-3">
                        <button onClick={handleLike} className="p-2 text-white/50 active:scale-90 transition-transform">
                            <Heart size={26} className={isLiked ? "fill-purple-500 text-purple-500" : ""} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="w-[54px] h-[54px] bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                        >
                            {isPlaying ? <Pause size={34} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
                        </button>
                    </div>

                    {/* Progress Fill (Custom Recoded Slider) */}
                    <div
                        className="absolute bottom-0 left-4 right-4 h-[25px] flex items-end pb-1.5 z-50 cursor-pointer touch-none"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Measurement Ref on Visual Track */}
                        <div ref={progressBarRef} className="w-full h-[3px] bg-white/20 rounded-full overflow-hidden relative pointer-events-none">
                            <div
                                className={`h-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] rounded-full ${isSeeking ? 'transition-none' : 'transition-all duration-300 ease-linear'}`}
                                style={{ width: `${Math.min(100, Math.max(0, progressPercent || 0))}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>


            {/* ==============================================
                DESKTOP "COMMAND CENTER" FOOTER
               ============================================== */}
            <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[1200px] h-[88px] z-[60] animate-in fade-in-up duration-500" onClick={() => isMaximized && toggleMaximize()}>
                <div className={`${glassPanel} w-full h-full rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center justify-between px-6 relative overflow-hidden transition-all hover:border-white/20 group/dock`}>

                    {/* LEFT: Art & Info */}
                    <div className="flex items-center w-[30%] gap-4 z-10">
                        <div className="relative group cursor-pointer" onClick={toggleMaximize}>
                            <div className={`w-14 h-14 rounded-full shadow-lg border border-white/5 flex items-center justify-center bg-black overflow-hidden ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                                <img
                                    src={currentTrack.album?.images?.[0]?.url || currentTrack.image}
                                    className="w-full h-full object-cover"
                                    alt=""
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#222] rounded-full border border-white/10" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                                <Maximize2 size={24} className="text-white drop-shadow-md" />
                            </div>
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden">
                            <div className="text-base font-bold text-white truncate hover:underline cursor-pointer">{currentTrack.name}</div>
                            <div className="text-sm font-medium text-white/50 truncate hover:text-white hover:underline cursor-pointer transition-colors">
                                {currentTrack.artists?.map(a => a.name).join(', ')}
                            </div>
                        </div>
                        <button onClick={handleLike} className={`ml-2 transition-transform hover:scale-110 active:scale-95 ${isLiked ? 'text-purple-500' : 'text-white/30 hover:text-white'}`}>
                            <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                        </button>
                    </div>

                    {/* CENTER: Player Controls & Scrubber */}
                    <div className="flex flex-col items-center justify-center w-[40%] gap-1.5 z-10">
                        <div className="flex items-center gap-6">
                            <button onClick={toggleShuffle} className={shuffle ? iconBtnActive : iconBtn} title="Shuffle"><Shuffle size={20} /></button>
                            <button onClick={prevTrack} className={iconBtn} title="Previous"><SkipBack size={28} fill="currentColor" /></button>
                            <button
                                onClick={togglePlay}
                                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-0.5" />}
                            </button>
                            <button onClick={nextTrack} className={iconBtn} title="Next"><SkipForward size={28} fill="currentColor" /></button>
                            <button onClick={toggleRepeat} className={repeat > 0 ? iconBtnActive : iconBtn} title="Repeat">{repeat === 2 ? <Repeat1 size={20} /> : <Repeat size={20} />}</button>
                        </div>

                        {/* Scrubber (Recoded Custom Desktop Slider) */}
                        <div className="w-full max-w-[420px] flex items-center gap-3 text-[11px] font-medium text-white/40 font-mono">
                            <span className="min-w-[35px] text-right">{formatTime(displayedTime)}</span>
                            <div
                                className="relative flex-1 h-[20px] bg-transparent flex items-center cursor-pointer group touch-none select-none"
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                onMouseEnter={() => setIsHoveringSeek(true)}
                                onMouseLeave={() => setIsHoveringSeek(false)}
                            >
                                <div ref={progressBarRef} className="w-full h-[4px] bg-white/10 rounded-full relative pointer-events-none">
                                    <div
                                        className={`h-full bg-white group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 rounded-full relative`}
                                        style={{ width: `${Math.min(100, Math.max(0, progressPercent || 0))}%` }}
                                    />
                                    <div
                                        className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-lg pointer-events-none transition-transform duration-200 ${isHoveringSeek || isSeeking ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                                        style={{ left: `${Math.min(100, Math.max(0, progressPercent || 0))}%`, transform: 'translate(-50%, -50%)' }}
                                    />
                                </div>
                            </div>
                            <span className="min-w-[35px]">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* RIGHT: Volume & Tools */}
                    <div className="flex items-center justify-end w-[30%] gap-4 z-10">
                        <div className="flex items-center gap-2">
                            <button onClick={toggleMute} className="text-white/50 hover:text-white p-2 hover:bg-white/5 rounded-full transition">
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : volume < 50 ? <Volume1 size={20} /> : <Volume2 size={20} />}
                            </button>
                            <div
                                className="w-24 h-8 flex items-center relative group/vol"
                                onMouseEnter={() => setIsHoveringVolume(true)}
                                onMouseLeave={() => setIsHoveringVolume(false)}
                            >
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[4px] bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-white group-hover/vol:bg-gradient-to-r group-hover/vol:from-purple-500 group-hover/vol:to-pink-500 rounded-full" style={{ width: `${volume}%` }} />
                                </div>
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-lg opacity-0 group-hover/vol:opacity-100 transition-opacity"
                                    style={{ left: `${volume}%`, transform: 'translate(-50%, -50%)' }}
                                />
                                <input
                                    type="range" min="0" max="100" value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value) / 100)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Device Menu Button */}
                        <div className="relative" ref={deviceMenuRef} onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={handleToggleDeviceMenu}
                                className={`p-2 transition-all hover:scale-110 active:scale-95 ${isDeviceMenuOpen || activeDevice !== 'This Device' ? 'text-green-400' : 'text-white/50 hover:text-white'}`}
                                title="Connect to a device"
                            >
                                {activeDevice === 'This Device' ? <Laptop size={20} /> : <Speaker size={20} />}
                            </button>
                            {isDeviceMenuOpen && (
                                <div className="absolute bottom-[140%] right-[-50px] w-[260px] bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl p-2 z-[100] animate-in fade-in slide-in-from-bottom-2 cursor-default">
                                    <div className="px-3 py-2 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Connect to a device</div>
                                    <button onClick={() => handleSelectDevice('default', 'This Device')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeDevice === 'This Device' ? 'bg-white/10 text-green-400' : 'hover:bg-white/5 text-white/80'}`}>
                                        <Laptop size={18} /> <div className="text-left font-medium text-sm">This Computer</div>
                                    </button>
                                    {availableDevices.map(dev => (
                                        <button key={dev.deviceId} onClick={() => handleSelectDevice(dev.deviceId, dev.label)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeDevice === dev.label ? 'bg-white/10 text-green-400' : 'hover:bg-white/5 text-white/80'}`}>
                                            <Speaker size={18} /> <div className="text-left font-medium text-sm truncate">{dev.label || "External Speaker"}</div>
                                        </button>
                                    ))}
                                    <div className="h-[1px] bg-white/10 my-2 mx-2" />
                                    <button onClick={() => { requestCast(); setIsDeviceMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-white/80 transition-colors">
                                        <Cast size={18} /> <div className="text-left font-medium text-sm">Google Cast</div>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="h-8 w-[1px] bg-white/10 mx-1" />

                        <button onClick={toggleMaximize} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white hover:scale-105 active:scale-95 shadow-md">
                            <Maximize2 size={20} />
                        </button>
                    </div>
                </div>
            </div>
            {/* Spacer */}
            <div className="hidden md:block h-[120px]" />
        </>
    );
};

export default Player;
