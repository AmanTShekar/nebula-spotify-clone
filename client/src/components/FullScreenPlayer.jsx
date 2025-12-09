import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX,
    Maximize2, Minimize2, Heart, ListMusic, Mic2, Music2, Share2, Cast,
    MoreHorizontal, ChevronDown, Check, Moon, Laptop, Smartphone, Speaker, Bluetooth,
    Link as LinkIcon, User, Trash2, X
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AddToPlaylistModal from './AddToPlaylistModal';

const FullScreenPlayer = () => {
    const {
        currentTrack, isPlaying, togglePlay, time, seek, setVolume, nextTrack, prevTrack,
        isMaximized, toggleMaximize, shuffle, repeat, toggleShuffle, toggleRepeat, queue, playTrack,
        addToQueue, playNext, volume, removeFromQueue
    } = usePlayer();

    const { token } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [isLiked, setIsLiked] = useState(false);
    const [activeTab, setActiveTab] = useState('art');
    const [lyrics, setLyrics] = useState("");
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [sleepTimer, setSleepTimer] = useState(null);
    const [showDevices, setShowDevices] = useState(false);

    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);

    const [devices, setDevices] = useState([
        { id: 'web', name: 'This Web Browser', type: 'laptop', active: true },
        { id: 'cast', name: 'Google Cast', type: 'speaker', active: false },
    ]);

    // Keyboard Shortcuts
    useEffect(() => {
        if (!isMaximized) return;
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            switch (e.code) {
                case 'Space': e.preventDefault(); togglePlay(); break;
                case 'ArrowRight': if (e.ctrlKey) nextTrack(); else seek(time.currentTime + 5); break;
                case 'ArrowLeft': if (e.ctrlKey) prevTrack(); else seek(time.currentTime - 5); break;
                case 'KeyM': toggleMute(); break;
                case 'Escape': toggleMaximize(); break;
                case 'KeyL': setActiveTab(prev => prev === 'lyrics' ? 'art' : 'lyrics'); break;
                case 'KeyQ': setActiveTab(prev => prev === 'queue' ? 'art' : 'queue'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMaximized, togglePlay, nextTrack, prevTrack, seek, time, toggleMaximize]);

    const isMuted = volume === 0;
    const [prevVolume, setPrevVolume] = useState(1);
    const toggleMute = () => {
        if (isMuted) setVolume(prevVolume || 0.5);
        else { setPrevVolume(volume / 100); setVolume(0); }
    };

    const toggleSleepTimer = () => {
        if (sleepTimer) {
            clearTimeout(sleepTimer);
            setSleepTimer(null);
            showToast("Sleep Timer Off", "info");
        } else {
            const timer = setTimeout(() => {
                if (isPlaying) togglePlay();
                setSleepTimer(null);
            }, 30 * 60 * 1000);
            setSleepTimer(timer);
            showToast("Sleep Timer set for 30 mins", "success");
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard", "success");
    };

    const handleGoToArtist = () => {
        if (currentTrack?.artists?.[0]?.id) {
            navigate(`/artist/${currentTrack.artists[0].id}`);
            toggleMaximize();
        } else {
            navigate(`/search?q=${encodeURIComponent(currentTrack?.artists?.[0]?.name || '')}`);
            toggleMaximize();
        }
    };

    useEffect(() => {
        if (!currentTrack) return;
        setLyrics("");
        setIsLoadingLyrics(true);
        const fetchLyrics = async () => {
            try {
                const artist = currentTrack.artists?.[0]?.name;
                const title = currentTrack.name;
                if (!artist || !title) throw new Error("Missing metadata");
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/lyrics`, { params: { artist, track: title } });
                setLyrics(res.data.lyrics || "Lyrics not found.");
            } catch (err) { setLyrics("Lyrics not found."); }
            finally { setIsLoadingLyrics(false); }
        };
        const timer = setTimeout(fetchLyrics, 500);
        return () => clearTimeout(timer);
    }, [currentTrack]);

    useEffect(() => {
        if (currentTrack && token) setIsLiked(false);
    }, [currentTrack, token]);

    const handleLike = () => {
        if (!token) return showToast("Login to like", "error");
        setIsLiked(!isLiked);
        showToast(isLiked ? "Removed from Liked" : "Added to Liked", "success");
    };

    if (!isMaximized || !currentTrack) return null;

    const formatTime = (seconds) => {
        if (!seconds) return "-:-";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSeekStart = (val) => { setIsSeeking(true); setSeekValue(val); };
    const handleSeekCommit = () => { if (isSeeking) { seek(seekValue); setIsSeeking(false); } };

    const displayedTime = isSeeking ? seekValue : time.currentTime;
    const progressPercent = (displayedTime / (time.totalTime || 1)) * 100;
    const albumArt = currentTrack.album?.images?.[0]?.url || currentTrack.image || 'https://via.placeholder.com/600';

    return (
        <div className="fixed inset-0 z-[60] bg-[#121212] text-white flex flex-col font-sans overflow-hidden animate-fade-in-up selection:bg-green-500/30">

            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[100px] z-10"></div>
                <img src={albumArt} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-[50px] scale-110 animate-pulse-slow" alt="" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#121212]/50 to-[#121212] z-20"></div>
            </div>

            <div className="relative z-30 flex flex-col h-full w-full max-w-[1600px] mx-auto px-6 py-4 md:py-8 md:px-12">

                {/* Header */}
                <div className="flex items-center justify-between shrink-0 mb-4 md:mb-8">
                    <button onClick={toggleMaximize} className="p-3 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white" title="Minimize (Esc)">
                        <ChevronDown size={28} />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] sm:text-xs font-bold tracking-[2px] uppercase text-white/60 mb-1">Now Playing</span>
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-bold truncate max-w-[150px] sm:max-w-[300px]">{currentTrack.album?.name}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleShare} className="p-3 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white" title="Copy Link">
                            <Share2 size={20} />
                        </button>
                        <button onClick={() => setShowPlaylistModal(true)} className="p-3 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white" title="Add to Playlist">
                            <MoreHorizontal size={24} />
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:gap-20 min-h-0">

                    {/* Left: Art & Visuals */}
                    <div className={`w-full lg:w-[45%] shrink-0 flex items-center justify-center h-[40vh] lg:h-auto mb-6 lg:mb-0 relative transition-all duration-500 ${activeTab !== 'art' && 'hidden lg:flex'}`}>
                        <div className="relative w-full aspect-square max-w-[300px] sm:max-w-[400px] lg:max-w-[500px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-[30px] overflow-hidden group">
                            <img src={albumArt} className="w-full h-full object-cover" alt="Art" />
                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button onClick={handleLike} className="p-4 bg-white/10 backdrop-blur-md rounded-full hover:scale-110 transition hover:bg-white/20">
                                    <Heart size={32} className={isLiked ? "fill-green-500 text-green-500" : "text-white"} />
                                </button>
                                <button onClick={handleGoToArtist} className="p-4 bg-white/10 backdrop-blur-md rounded-full hover:scale-110 transition hover:bg-white/20" title="Go to Artist">
                                    <User size={32} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Content (Lyrics/Queue) or Just Controls on Art tab */}
                    <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-500 ${activeTab === 'art' ? 'lg:justify-end' : ''}`}>

                        {/* Tab Content Area */}
                        {(activeTab === 'lyrics' || activeTab === 'queue') && (
                            <div className="flex-1 overflow-hidden flex flex-col bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 p-6 mb-6 animate-fade-in shadow-2xl">
                                {activeTab === 'lyrics' && (
                                    <>
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Mic2 size={24} className="text-green-500" /> Lyrics</h3>
                                        <div className="flex-1 overflow-y-auto w-full text-xl md:text-2xl font-bold leading-relaxed text-white/90 whitespace-pre-wrap text-center mask-image-b custom-scrollbar">
                                            {isLoadingLyrics ?
                                                <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>
                                                : lyrics}
                                        </div>
                                    </>
                                )}
                                {activeTab === 'queue' && (
                                    <>
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><ListMusic size={24} className="text-green-500" /> Up Next</h3>
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {queue.map((t, i) => (
                                                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 transition cursor-pointer group ${currentTrack.id === t.id ? 'bg-white/10 border border-green-500/30' : ''}`} onClick={() => playTrack(t, queue)}>
                                                    <span className={`text-sm font-mono w-6 text-center ${currentTrack.id === t.id ? 'text-green-500' : 'text-white/40'}`}>{currentTrack.id === t.id ? <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-pulse" /> : i + 1}</span>
                                                    <img src={t.album?.images?.[2]?.url || t.image} className="w-12 h-12 rounded-lg shadow-sm" alt="" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-bold text-base truncate ${currentTrack.id === t.id ? 'text-green-500' : 'text-white'}`}>{t.name}</div>
                                                        <div className="text-sm text-white/50 truncate flex items-center gap-2">
                                                            {t.artists?.[0]?.name}
                                                        </div>
                                                    </div>
                                                    {/* Hover Actions */}
                                                    <div className="opacity-100 md:opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeFromQueue && removeFromQueue(t.id); }}
                                                            className="p-2 hover:bg-white/20 rounded-full text-white/60 hover:text-red-400 transition"
                                                            title="Remove from Queue"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Controls Section (Always Visible) */}
                        <div className="flex flex-col justify-end z-20 mt-auto">

                            {/* Track Info (Only if Art tab on Mobile, or always on desktop controls area if needed? Actually simpler to keep top) */}
                            {activeTab !== 'art' && (
                                <div className="flex items-end justify-between mb-4 lg:hidden">
                                    {/* Simplified Mobile Header for Lyrics/Queue view */}
                                    <div className="flex flex-col min-w-0">
                                        <h2 className="text-xl font-bold truncate">{currentTrack.name}</h2>
                                        <span className="text-white/60 truncate">{currentTrack.artists?.[0]?.name}</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'art' && (
                                <div className="flex items-end justify-between mb-2">
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight truncate text-white drop-shadow-2xl">
                                            {currentTrack.name}
                                        </h1>
                                        <span onClick={handleGoToArtist} className="text-xl md:text-3xl text-white/70 font-medium truncate mt-2 hover:text-white hover:underline cursor-pointer transition">
                                            {currentTrack.artists?.map(a => a.name).join(', ')}
                                        </span>
                                    </div>
                                    <button onClick={handleLike} className="shrink-0 p-3 hover:bg-white/10 rounded-full transition hover:scale-110 active:scale-95">
                                        <Heart size={32} className={isLiked ? "fill-green-500 text-green-500 drop-shadow-glow" : "text-white"} />
                                    </button>
                                </div>
                            )}

                            {/* Progress */}
                            <div className="mb-4 group">
                                <div className="relative h-1.5 w-full bg-white/10 rounded-full cursor-pointer flex items-center">
                                    <div
                                        className="absolute h-full bg-white rounded-full group-hover:bg-green-500 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                        style={{ width: `${progressPercent}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity scale-125"></div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max={time.totalTime || 0} step="0.1"
                                        value={displayedTime}
                                        onChange={(e) => handleSeekStart(parseFloat(e.target.value))}
                                        onMouseUp={handleSeekCommit}
                                        onTouchEnd={handleSeekCommit}
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-white/50 font-mono mt-2 font-medium">
                                    <span>{formatTime(displayedTime)}</span>
                                    <span>{formatTime(time.totalTime)}</span>
                                </div>
                            </div>

                            {/* Main Controls */}
                            <div className="flex items-center justify-between md:justify-center md:gap-10 lg:gap-14 mb-6">
                                <button onClick={toggleShuffle} className={`transition p-3 rounded-full hover:bg-white/5 ${shuffle ? 'text-green-500 relative' : 'text-white/60 hover:text-white'}`} title="Shuffle">
                                    <Shuffle size={24} />
                                    {shuffle && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />}
                                </button>
                                <button onClick={prevTrack} className="text-white hover:scale-110 transition p-3 hover:bg-white/5 rounded-full" title="Previous">
                                    <SkipBack size={32} fill="currentColor" />
                                </button>
                                <button onClick={togglePlay} className="bg-white text-black rounded-full p-5 hover:scale-105 active:scale-95 transition shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                    {isPlaying ? <Pause size={36} fill="black" /> : <Play size={36} fill="black" className="ml-1" />}
                                </button>
                                <button onClick={nextTrack} className="text-white hover:scale-110 transition p-3 hover:bg-white/5 rounded-full" title="Next">
                                    <SkipForward size={32} fill="currentColor" />
                                </button>
                                <button onClick={toggleRepeat} className={`transition p-3 rounded-full hover:bg-white/5 ${repeat > 0 ? 'text-green-500 relative' : 'text-white/60 hover:text-white'}`} title="Repeat">
                                    <Repeat size={24} />
                                    {repeat > 0 && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />}
                                    {repeat === 2 && <span className="absolute top-2 right-2 text-[8px] bg-green-500 text-black px-1 rounded-full font-bold">1</span>}
                                </button>
                            </div>

                            {/* Footer Controls / Tabs */}
                            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 md:gap-0">

                                {/* Device, Sleep & Share (Mobile) */}
                                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            className={`p-3 rounded-full transition relative ${showDevices ? 'text-green-500' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                                            onClick={() => setShowDevices(!showDevices)}
                                            title="Devices"
                                        >
                                            <Cast size={20} />
                                            {showDevices && (
                                                <div className="absolute bottom-full left-0 mb-4 w-72 bg-[#1e1e24] p-4 rounded-xl border border-white/10 shadow-2xl animate-fade-in-up z-50">
                                                    <h4 className="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2">Connect to device</h4>
                                                    {devices.map(d => (
                                                        <div key={d.id} className={`flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer text-sm ${d.active ? 'text-green-500 bg-white/5' : 'text-gray-300'}`}>
                                                            {d.type === 'speaker' && <Speaker size={18} />}
                                                            {d.type === 'laptop' && <Laptop size={18} />}
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{d.name}</span>
                                                                {d.active && <span className="text-[10px] uppercase tracking-wider opacity-80">Listening On</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                        <button
                                            onClick={toggleSleepTimer}
                                            className={`p-3 rounded-full transition ${sleepTimer ? 'text-green-500 bg-green-500/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                                            title="Sleep Timer"
                                        >
                                            <Moon size={20} />
                                        </button>
                                    </div>

                                    {/* Mobile View Toggles */}
                                    <div className="flex md:hidden items-center gap-2">
                                        <button onClick={() => setActiveTab(activeTab === 'lyrics' ? 'art' : 'lyrics')} className={`p-3 rounded-full ${activeTab === 'lyrics' ? 'text-green-500 bg-white/10' : 'text-white/60'}`}><Mic2 size={20} /></button>
                                        <button onClick={() => setActiveTab(activeTab === 'queue' ? 'art' : 'queue')} className={`p-3 rounded-full ${activeTab === 'queue' ? 'text-green-500 bg-white/10' : 'text-white/60'}`}><ListMusic size={20} /></button>
                                    </div>
                                </div>

                                {/* View Tabs (Desktop Centered) */}
                                <div className="items-center bg-white/5 rounded-full p-1 border border-white/5 hidden md:flex">
                                    <button onClick={() => setActiveTab('lyrics')} className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${activeTab === 'lyrics' ? 'bg-white/10 text-white shadow-inner font-bold' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                                        <Mic2 size={18} /> <span className="text-xs uppercase tracking-widest hidden lg:block">Lyrics</span>
                                    </button>
                                    <button onClick={() => setActiveTab('art')} className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${activeTab === 'art' ? 'bg-white/10 text-white shadow-inner font-bold' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                                        <Music2 size={18} /> <span className="text-xs uppercase tracking-widest hidden lg:block">Art</span>
                                    </button>
                                    <button onClick={() => setActiveTab('queue')} className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${activeTab === 'queue' ? 'bg-white/10 text-white shadow-inner font-bold' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                                        <ListMusic size={18} /> <span className="text-xs uppercase tracking-widest hidden lg:block">Queue</span>
                                    </button>
                                </div>

                                {/* Volume (Now Visible on Mobile) */}
                                <div className="flex items-center gap-3 w-full md:w-40 group/vol px-4 md:px-0 bg-white/5 md:bg-transparent rounded-xl md:rounded-none py-2 md:py-0">
                                    <button onClick={toggleMute} className="text-white/60 hover:text-white">
                                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>
                                    <div className="h-1.5 flex-1 bg-white/10 rounded-full cursor-pointer relative overflow-hidden">
                                        <div className="absolute h-full bg-white rounded-full group-hover/vol:bg-green-500 transition-colors" style={{ width: `${volume}%` }}></div>
                                        <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>

                            </div>

                            {/* Empty spacer on mobile if needed or just padding */}

                        </div>
                    </div>

                    {showPlaylistModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPlaylistModal(false)}></div>
                            <div className="relative z-10 w-full max-w-md">
                                <AddToPlaylistModal
                                    track={currentTrack}
                                    onClose={() => setShowPlaylistModal(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FullScreenPlayer;
