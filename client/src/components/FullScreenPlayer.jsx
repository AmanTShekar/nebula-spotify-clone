import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Volume1,
    ChevronDown, Heart, ListMusic, Mic2, Share2, MoreHorizontal, Bluetooth,
    Cast, X, MonitorSpeaker, Smartphone, Laptop, Link2, Music2, Album, User, Download, Plus, Loader
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AddToPlaylistModal from './AddToPlaylistModal';

const FullScreenPlayer = () => {
    const navigate = useNavigate();
    const {
        currentTrack, isPlaying, togglePlay, time, seek, setVolume, nextTrack, prevTrack,
        isMaximized, toggleMaximize, shuffle, repeat, toggleShuffle, toggleRepeat, queue, playTrack,
        volume, toggleMute, activeDevice, setActiveDevice, requestCast
    } = usePlayer();

    const { token } = useAuth();
    const { showToast } = useToast();

    // State
    const [view, setView] = useState('main');
    const [lyrics, setLyrics] = useState("");
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
    const [showCastMenu, setShowCastMenu] = useState(false);

    // activeDevice is from context, but we can also have local state for the UI if needed
    // We will use a mixed approach: Real Cast trigger key, plus simulated/system Bluetooth instructions

    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);

    // Fetch Lyrics
    useEffect(() => {
        if (!currentTrack) return;
        setIsLiked(false);
        setLyrics("");
        setIsLoadingLyrics(true);

        const fetchLyrics = async () => {
            try {
                // Ensure we use the updated backend route
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/lyrics`, {
                    params: { artist: currentTrack?.artists?.[0]?.name, track: currentTrack?.name }
                });
                setLyrics(res.data.lyrics || "");
            } catch {
                setLyrics("");
            } finally {
                setIsLoadingLyrics(false);
            }
        };

        // Debounce to prevent rapid requests on skip
        const timer = setTimeout(fetchLyrics, 500);
        return () => { clearTimeout(timer); setIsLoadingLyrics(false); };
    }, [currentTrack]);

    const handleLike = () => {
        if (!token) return showToast("Login to like", "error");
        setIsLiked(!isLiked);
        showToast(isLiked ? "💔 Removed from Liked Songs" : "💚 Added to Liked Songs", "success");
    };

    const handleShare = () => {
        const link = `https://nebula.music/track/${currentTrack.id}`;
        navigator.clipboard.writeText(link);
        showToast("🔗 Nebula Link Copied!", "success");
        setShowOptions(false);
    };

    const handleCastSelect = (device) => {
        if (device.name === activeDevice) return;

        setIsCasting(true);
        showToast(`Connecting to ${device.name}...`, "info");

        setTimeout(() => {
            setActiveDevice(device.name);
            setIsCasting(false);
            // setShowCastMenu(false); // Keep open to show "Connected" state briefly? Or close. Let's keep open for a moment or close.
            // Better UX: Close it
            setShowCastMenu(false);
            showToast(`✓ Connected to ${device.name}`, "success");
        }, 2000);
    };

    const handleDisconnect = () => {
        setIsCasting(true);
        setTimeout(() => {
            setActiveDevice('This Device');
            setIsCasting(false);
            setShowCastMenu(false);
            showToast("Disconnected", "info");
        }, 1000);
    };

    const handleViewAlbum = () => {
        if (currentTrack?.album?.id) {
            setShowOptions(false);
            toggleMaximize();
            navigate(`/album/${currentTrack.album.id}`);
        } else {
            showToast("Album not available", "error");
        }
    };

    const handleViewArtist = () => {
        if (currentTrack?.artists?.[0]?.id) {
            setShowOptions(false);
            toggleMaximize();
            navigate(`/artist/${currentTrack.artists[0].id}`);
        } else {
            showToast("Artist not available", "error");
        }
    };

    const handleSeekStart = () => setIsSeeking(true);
    const handleSeekChange = (e) => setSeekValue(parseFloat(e.target.value));
    const handleSeekEnd = () => {
        seek(seekValue);
        setTimeout(() => setIsSeeking(false), 50);
    };

    useEffect(() => {
        if (!isSeeking && time.currentTime) setSeekValue(time.currentTime);
    }, [time.currentTime, isSeeking]);

    const handleVolumeChange = (e) => {
        try {
            const newVolume = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
            const volumeDecimal = newVolume / 100;
            console.log('Volume slider changed:', newVolume, 'Converting to:', volumeDecimal);
            if (setVolume && typeof setVolume === 'function') {
                setVolume(volumeDecimal);
            } else {
                console.error('setVolume is not available or not a function');
            }
        } catch (error) {
            console.error('Error in handleVolumeChange:', error);
        }
    };



    if (!isMaximized || !currentTrack) return null;

    const duration = time.totalTime > 0 ? time.totalTime : (currentTrack?.duration_ms ? currentTrack.duration_ms / 1000 : 0);
    const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (seekValue / duration) * 100)) : 0;
    const artUrl = currentTrack.album?.images?.[0]?.url || currentTrack.image;
    const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
    const safeVolume = Math.round(Math.min(100, Math.max(0, volume)));

    console.log('FullScreenPlayer render - volume:', volume, 'safeVolume:', safeVolume);

    const formatTime = (s) => {
        if (!s && s !== 0) return "-:--";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#0a0a0a] text-white font-sans overflow-hidden">

            {/* Premium Ambient Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
                <img
                    src={artUrl}
                    className="absolute inset-0 w-full h-full object-cover opacity-[0.15] blur-[120px] scale-125 saturate-150"
                    alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />
            </div>

            {/* Main Container */}
            <div className="relative z-10 h-full flex flex-col safe-area-inset">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 md:px-12 md:py-8 shrink-0">
                    <button
                        onClick={toggleMaximize}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 transition-all hover:scale-105 active:scale-95"
                    >
                        <ChevronDown size={22} className="text-white/90" />
                    </button>

                    <div className="hidden md:flex items-center gap-2 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full p-1.5">
                        {['main', 'lyrics', 'queue'].map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${view === v
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {v === 'main' ? 'Player' : v}
                            </button>
                        ))}
                    </div>

                    {/* Mobile: Now Playing Text */}
                    <div className="md:hidden flex flex-col items-center">
                        <span className="text-[9px] uppercase tracking-[2px] text-white/40 font-bold">Now Playing</span>
                    </div>

                    <button
                        onClick={() => setShowOptions(true)}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 transition-all hover:scale-105 active:scale-95"
                    >
                        <MoreHorizontal size={22} className="text-white/90" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-6 pb-6 md:px-12 md:pb-12 overflow-y-auto custom-scrollbar -mt-10 md:-mt-16">

                    {/* Album Art */}
                    <div className={`relative transition-all duration-700 aspect-square w-full max-w-[320px] md:max-w-[360px] lg:max-w-[480px] ${view !== 'main' ? 'hidden lg:block' : ''}`}>
                        <div className="relative w-full h-full group">
                            {/* Animated Glow Effect */}
                            <div className="absolute -inset-4 md:-inset-6 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-[40px] blur-3xl opacity-60 group-hover:opacity-90 transition-all duration-700 animate-pulse-slow" />

                            {/* Art Container */}
                            <div className="relative w-full h-full rounded-[28px] md:rounded-[32px] overflow-hidden shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)] border border-white/20 bg-neutral-900 transform group-hover:scale-[1.02] transition-transform duration-500">
                                <img
                                    src={artUrl}
                                    className="w-full h-full object-cover"
                                    alt="Album Art"
                                />
                                {/* Shine overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-40" />
                            </div>
                        </div>
                    </div>

                    {/* Controls Section */}
                    <div className="w-full max-w-[600px] flex flex-col justify-center gap-6 md:gap-8 relative">

                        {/* Lyrics/Queue View Overlay */}
                        {view !== 'main' && (
                            <div className="absolute inset-0 z-20 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 ease-out min-h-[520px]">

                                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[28px] md:rounded-[32px] p-6 md:p-8 shadow-2xl min-h-[300px] md:min-h-[400px] max-h-[500px] md:max-h-[600px] overflow-y-auto custom-scrollbar">
                                    <div className="flex items-center justify-between mb-6 lg:hidden">
                                        <h3 className="text-lg md:text-xl font-bold capitalize bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{view}</h3>
                                        <button onClick={() => setView('main')} className="p-3 hover:bg-white/10 rounded-full transition">
                                            <X size={32} />
                                        </button>
                                    </div>

                                    {view === 'lyrics' ? (
                                        isLoadingLyrics ? (
                                            <div className="flex flex-col items-center justify-center h-full gap-4 min-h-[200px]">
                                                <Loader size={48} className="text-purple-500 animate-spin" />
                                                <p className="text-white/50 text-base font-medium animate-pulse">Searching for lyrics...</p>
                                            </div>
                                        ) : (lyrics && lyrics !== 'Lyrics not found.') ? (
                                            <p className="whitespace-pre-wrap text-xl md:text-2xl lg:text-3xl font-bold leading-relaxed text-white/90 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                {lyrics}
                                            </p>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4 min-h-[200px]">
                                                <Mic2 size={64} strokeWidth={1.5} />
                                                <p className="text-base md:text-lg font-medium">No lyrics available</p>
                                                <button
                                                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(currentTrack.name + ' ' + currentTrack.artists?.[0]?.name + ' lyrics')}`, '_blank')}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-bold text-white transition-all hover:scale-105"
                                                >
                                                    Search on Google
                                                </button>
                                            </div>
                                        )
                                    ) : (
                                        <div className="space-y-1">
                                            {/* Sticky Header */}
                                            <div className="sticky top-0 z-10 bg-white/5 backdrop-blur-xl -mx-4 -mt-2 px-4 py-3 mb-4 rounded-b-2xl flex items-center justify-between border-b border-white/5 shadow-lg">
                                                <div className="flex items-center gap-2 text-xs font-bold text-white/90 uppercase tracking-widest pl-1">
                                                    <ListMusic size={16} className="text-purple-400" /> Next in Queue
                                                </div>
                                                <span className="text-[10px] font-bold bg-white/10 px-2.5 py-1 rounded-full text-white/60 shadow-inner">{queue.length}</span>
                                            </div>

                                            {/* List */}
                                            <div className="space-y-2">
                                                {queue.map((t, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => playTrack(t, queue)}
                                                        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 group relative overflow-hidden ${t.id === currentTrack.id
                                                            ? 'bg-white/10 border border-purple-500/30'
                                                            : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                                                            }`}
                                                    >
                                                        {/* Active Indicator Gradient */}
                                                        {t.id === currentTrack.id && (
                                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse-slow" />
                                                        )}

                                                        <div className="relative shrink-0 z-10">
                                                            <img src={t.album?.images?.[2]?.url} className={`w-12 h-12 rounded-lg shadow-lg ${t.id === currentTrack.id ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : 'group-hover:scale-105 transition-transform'}`} alt="" />
                                                            {t.id === currentTrack.id && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg backdrop-blur-[1px]">
                                                                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce shadow-[0_0_10px_#a855f7]" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0 z-10">
                                                            <div className={`font-bold truncate text-base ${t.id === currentTrack.id ? 'text-purple-300' : 'text-white group-hover:text-white'}`}>
                                                                {t.name}
                                                            </div>
                                                            <div className="text-sm text-white/50 truncate group-hover:text-white/70 transition-colors">{t.artists?.[0]?.name}</div>
                                                        </div>

                                                        <div className="text-xs text-white/30 font-mono shrink-0 z-10 tabular-nums">{formatTime(t.duration_ms / 1000)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Main Player View */}
                        <div className={`flex flex-col gap-6 md:gap-8 transition-all duration-500 ease-out transform-gpu ${view !== 'main' ? 'opacity-0 scale-95 pointer-events-none blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
                            {/* Track Info */}
                            <div className="flex items-start justify-between gap-3 md:gap-4">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight mb-2 md:mb-3 line-clamp-2 drop-shadow-lg">
                                        {currentTrack.name}
                                    </h1>
                                    <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-white/60 hover:text-white transition-colors cursor-pointer truncate">
                                        {currentTrack.artists?.[0]?.name}
                                    </h2>
                                </div>
                                <button
                                    onClick={handleLike}
                                    className={`p-4 rounded-full backdrop-blur-xl border transition-all hover:scale-110 active:scale-95 shrink-0 ${isLiked
                                        ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/20'
                                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Heart size={28} fill={isLiked ? "currentColor" : "none"} strokeWidth={2} />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2 md:space-y-3">
                                <div className="relative h-1.5 md:h-2 group cursor-pointer">
                                    <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 transition-all shadow-lg shadow-purple-500/30"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-xl border-2 border-purple-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110"
                                        style={{ left: `${progressPercent}%`, marginLeft: '-10px' }}
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 1}
                                        step="0.5"
                                        value={seekValue}
                                        onMouseDown={handleSeekStart}
                                        onTouchStart={handleSeekStart}
                                        onChange={handleSeekChange}
                                        onMouseUp={handleSeekEnd}
                                        onTouchEnd={handleSeekEnd}
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                        style={{ height: '44px', top: '-20px' }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] md:text-xs font-bold text-white/40 font-mono">
                                    <span>{formatTime(seekValue)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Transport Controls */}
                            <div className="flex items-center justify-between px-2 md:px-0">
                                <button
                                    onClick={toggleShuffle}
                                    className={`p-3 rounded-full transition-all active:scale-90 hover:bg-white/10 relative ${shuffle ? 'text-purple-400 bg-purple-400/10' : 'text-white/40 hover:text-white'
                                        }`}
                                >
                                    <Shuffle size={36} />
                                    {shuffle && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50" />}
                                </button>

                                <div className="flex items-center gap-4 md:gap-6 lg:gap-10">
                                    <button
                                        onClick={prevTrack}
                                        className="text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <SkipBack size={44} fill="currentColor" />
                                    </button>

                                    <button
                                        onClick={togglePlay}
                                        className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_rgba(168,85,247,0.7)]"
                                    >
                                        {isPlaying ? (
                                            <Pause size={44} fill="white" />
                                        ) : (
                                            <Play size={44} fill="white" className="ml-1" />
                                        )}
                                    </button>

                                    <button
                                        onClick={nextTrack}
                                        className="text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <SkipForward size={44} fill="currentColor" />
                                    </button>
                                </div>

                                <button
                                    onClick={toggleRepeat}
                                    className={`p-3 rounded-full transition-all active:scale-90 hover:bg-white/10 relative ${repeat > 0 ? 'text-purple-400 bg-purple-400/10' : 'text-white/40 hover:text-white'
                                        }`}
                                >
                                    <Repeat size={36} />
                                    {repeat === 2 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-purple-400 to-pink-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                                            1
                                        </span>
                                    )}
                                    {repeat > 0 && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50" />}
                                </button>
                            </div>

                            {/* Bottom Controls */}
                            <div className="flex flex-col gap-4">
                                {/* Top Row: Cast + Mobile Actions + Desktop Volume */}
                                <div className="flex items-center justify-between">
                                    {/* Cast Button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowCastMenu(!showCastMenu)}
                                            className={`p-3 rounded-full transition-all active:scale-90 relative ${showCastMenu || activeDevice !== 'This Device'
                                                ? 'text-purple-400 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 shadow-lg shadow-purple-500/20'
                                                : 'text-white/40 hover:text-white hover:bg-white/10 border border-transparent'
                                                }`}
                                        >
                                            <Cast size={36} />
                                            {activeDevice !== 'This Device' && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full border-2 border-black animate-pulse" />
                                            )}
                                        </button>

                                        {showCastMenu && (
                                            <div className="absolute bottom-16 left-0 w-80 bg-[#1e1e1e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 z-[300] shadow-black/50">
                                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                        <Cast size={16} /> Connect to a device
                                                    </h3>
                                                    <button onClick={() => setShowCastMenu(false)} className="p-1 hover:bg-white/10 rounded-full transition">
                                                        <X size={18} className="text-white/50" />
                                                    </button>
                                                </div>

                                                <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    <div className="px-2 py-1 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Current Device</div>

                                                    <button
                                                        onClick={() => { setActiveDevice('This Device'); setShowCastMenu(false); }}
                                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${activeDevice === 'This Device' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'hover:bg-white/5 text-white'}`}
                                                    >
                                                        <Smartphone size={20} />
                                                        <div className="flex-1 text-left font-bold text-sm">This Device</div>
                                                        {activeDevice === 'This Device' && <div className="text-[10px] font-bold bg-purple-500 text-black px-2 py-0.5 rounded-full">ACTIVE</div>}
                                                    </button>

                                                    <div className="px-2 py-1 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 mt-4">Select a Device</div>

                                                    {/* Google Cast Trigger */}
                                                    <button
                                                        onClick={() => { requestCast(); setShowCastMenu(false); }}
                                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 text-white transition-all text-left group"
                                                    >
                                                        <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                                                            <Cast size={18} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-sm">Google Cast</div>
                                                            <div className="text-xs text-white/40">Chromecast, Nest Audio, TV</div>
                                                        </div>
                                                    </button>

                                                    {/* Bluetooth Placeholder */}
                                                    <button
                                                        onClick={() => showToast("Use your system settings to connect Bluetooth", "info")}
                                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 text-white transition-all text-left group"
                                                    >
                                                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-full group-hover:bg-blue-500/20 transition-colors">
                                                            <Bluetooth size={18} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-sm">Bluetooth</div>
                                                            <div className="text-xs text-white/40">Headphones, Speakers</div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile View Toggles */}
                                    <div className="flex lg:hidden gap-4">
                                        <button
                                            onClick={() => setView('lyrics')}
                                            className="p-3 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                        >
                                            <Mic2 size={36} />
                                        </button>
                                        <button
                                            onClick={() => setView('queue')}
                                            className="p-3 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                        >
                                            <ListMusic size={36} />
                                        </button>
                                    </div>

                                    {/* Desktop Volume Control */}
                                    <div className="hidden lg:flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition-all group">
                                        <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors shrink-0">
                                            <VolumeIcon size={36} />
                                        </button>
                                        <div className="w-32 relative h-2 cursor-pointer">
                                            <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all shadow-lg shadow-purple-500/20 pointer-events-none"
                                                    style={{ width: `${safeVolume}%` }}
                                                />
                                            </div>
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-xl border-2 border-purple-400 transition-all group-hover:scale-125 pointer-events-none"
                                                style={{ left: `${safeVolume}%`, marginLeft: '-10px' }}
                                            />
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={safeVolume}
                                                onChange={handleVolumeChange}
                                                className="absolute w-full opacity-0 cursor-pointer z-10"
                                                style={{ height: '40px', top: '-16px', left: 0 }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-white/40 font-mono w-8 text-right shrink-0">{safeVolume}</span>
                                    </div>
                                </div>

                                {/* Mobile Volume Slider - Below other controls */}
                                <div className="lg:hidden flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3.5 hover:bg-white/10 transition-all">
                                    <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors shrink-0">
                                        <VolumeIcon size={36} />
                                    </button>
                                    <div className="flex-1 relative h-4 cursor-pointer">
                                        <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all shadow-lg shadow-purple-500/20 pointer-events-none"
                                                style={{ width: `${safeVolume}%` }}
                                            />
                                        </div>
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-xl border-3 border-purple-400 transition-all pointer-events-none"
                                            style={{ left: `${safeVolume}%`, marginLeft: '-12px' }}
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={safeVolume}
                                            onChange={handleVolumeChange}
                                            className="absolute w-full opacity-0 cursor-pointer z-10"
                                            style={{ height: '48px', top: '-20px', left: 0 }}
                                        />
                                    </div>
                                    <span className="text-lg font-bold text-white/70 font-mono w-12 text-right shrink-0">{safeVolume}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Options Modal */}
            {showOptions && (
                <div
                    className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setShowOptions(false)}
                >
                    <div
                        className="w-full max-w-md bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header with Album Art */}
                        <div className="relative p-6 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                    <img src={artUrl} className="w-20 h-20 rounded-2xl shadow-lg" alt="" />
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-lg line-clamp-1 mb-1">{currentTrack.name}</h3>
                                    <p className="text-sm text-white/50 truncate">{currentTrack.artists?.[0]?.name}</p>
                                    <p className="text-xs text-white/30 mt-1 truncate">{currentTrack.album?.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Options */}
                        <div className="p-3 space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">

                            <button
                                onClick={() => { setShowOptions(false); setShowAddToPlaylist(true); }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-white/90 font-medium transition-all active:scale-[0.98] group"
                            >
                                <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                    <Plus size={28} />
                                </div>
                                <span className="text-base">Add to Playlist</span>
                            </button>

                            <button
                                onClick={() => { setView('lyrics'); setShowOptions(false); }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-white/90 font-medium transition-all active:scale-[0.98] group"
                            >
                                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                    <Mic2 size={28} />
                                </div>
                                <span className="text-base">View Lyrics</span>
                            </button>

                            <button
                                onClick={() => { setView('queue'); setShowOptions(false); }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-white/90 font-medium transition-all active:scale-[0.98] group"
                            >
                                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                    <ListMusic size={28} />
                                </div>
                                <span className="text-base">View Queue</span>
                            </button>

                            <button
                                onClick={handleShare}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-white/90 font-medium transition-all active:scale-[0.98] group"
                            >
                                <div className="p-3 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors">
                                    <Link2 size={28} />
                                </div>
                                <span className="text-base">Copy Nebula Link</span>
                            </button>

                            <button
                                onClick={handleViewAlbum}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-white/90 font-medium transition-all active:scale-[0.98] group"
                            >
                                <div className="p-3 rounded-lg bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                                    <Album size={28} />
                                </div>
                                <span className="text-base">Go to Album</span>
                            </button>

                            <button
                                onClick={handleViewArtist}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-white/90 font-medium transition-all active:scale-[0.98] group"
                            >
                                <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                                    <User size={28} />
                                </div>
                                <span className="text-base">Go to Artist</span>
                            </button>

                            <button
                                onClick={() => showToast("Download feature coming soon!", "info")}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-white/90 font-medium transition-all active:scale-[0.98] group"
                            >
                                <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                                    <Download size={28} />
                                </div>
                                <span className="text-base">Download</span>
                            </button>
                        </div>

                        {/* Close Button */}
                        <div className="p-4 border-t border-white/10">
                            <button
                                onClick={() => setShowOptions(false)}
                                className="w-full py-4 font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 text-base"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add to Playlist Modal */}
            {showAddToPlaylist && (
                <AddToPlaylistModal
                    track={currentTrack}
                    token={token}
                    onClose={() => setShowAddToPlaylist(false)}
                />
            )}
        </div>
    );
};

export default FullScreenPlayer;
