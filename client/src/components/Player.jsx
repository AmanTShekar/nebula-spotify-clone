import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Repeat, Shuffle, Cast, Laptop, Smartphone, Speaker, ListMusic, Heart, ChevronUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Player = () => {
    const {
        currentTrack, isPlaying, togglePlay, time, seek, setVolume, nextTrack, prevTrack,
        toggleMaximize, isMaximized, shuffle, repeat, toggleShuffle, toggleRepeat, volume,
        queue, playTrack
    } = usePlayer();

    const { token } = useAuth();

    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);
    const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const deviceMenuRef = useRef(null);
    const queueMenuRef = useRef(null);

    const isMuted = volume === 0;
    const [prevVolume, setPrevVolume] = useState(1);

    const toggleMute = () => {
        if (isMuted) {
            setVolume(prevVolume || 0.5);
        } else {
            setPrevVolume(volume / 100);
            setVolume(0);
        }
    };

    useEffect(() => {
        if (!currentTrack || !token) {
            setIsLiked(false);
            return;
        }
        setIsLiked(false);
    }, [currentTrack, token]);

    const handleLike = (e) => {
        e.stopPropagation();
        if (!token) return;
        setIsLiked(!isLiked);
    };

    const [devices] = useState([
        { id: 'web', name: 'This Web Browser', type: 'laptop', active: true },
        { id: 'bt', name: 'Bluetooth Speaker', type: 'bluetooth', active: false },
        { id: 'phone', name: 'Smartphone', type: 'smartphone', active: false },
        { id: 'cast', name: 'Google Cast / AirPlay', type: 'speaker', active: false },
    ]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (deviceMenuRef.current && !deviceMenuRef.current.contains(event.target)) {
                setIsDeviceMenuOpen(false);
            }
            if (queueMenuRef.current && !queueMenuRef.current.contains(event.target)) {
                setIsQueueOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentTrack || isMaximized) return null;

    const formatTime = (seconds) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSeekStart = (val) => {
        setIsSeeking(true);
        setSeekValue(val);
    };

    const handleSeekCommit = () => {
        if (isSeeking) {
            seek(seekValue);
            setIsSeeking(false);
        }
    };

    const displayedTime = isSeeking ? seekValue : time.currentTime;
    const progressPercent = (displayedTime / (time.totalTime || 1)) * 100;

    return (
        <>
            {/* ==============================================
                MOBILE MINI PLAYER (Floating Above Nav)
               ============================================== */}
            <div
                onClick={toggleMaximize}
                className="md:hidden fixed bottom-[74px] left-2 right-2 h-14 bg-[#1e1e24] rounded-lg shadow-xl border border-white/5 flex items-center pr-3 z-50 overflow-hidden cursor-pointer"
            >
                {/* Progress Bar (Bottom Line) */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-10">
                    <div
                        className="h-full bg-white rounded-r-full transition-all duration-300 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Art */}
                <img
                    src={currentTrack.album?.images?.[2]?.url || currentTrack.image || 'https://via.placeholder.com/40'}
                    alt="Art"
                    className="h-10 w-10 rounded ml-2 object-cover shrink-0 select-none pointer-events-none bg-neutral-800"
                />

                {/* Info */}
                <div className="flex-1 flex flex-col justify-center min-w-0 mx-3 overflow-hidden">
                    <span className="text-white text-xs font-bold truncate leading-tight">
                        {currentTrack.name}
                    </span>
                    <span className="text-gray-400 text-[10px] truncate leading-tight">
                        {currentTrack.artists?.map(a => a.name).join(', ')}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={handleLike}
                        className="text-gray-400 active:scale-90 transition-transform"
                    >
                        <Heart size={20} className={isLiked ? "fill-green-500 text-green-500" : ""} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                        className="text-white p-1 active:scale-90 transition-transform"
                    >
                        {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                    </button>
                </div>
            </div>


            {/* ==============================================
                DESKTOP FULL WIDTH PLAYER
               ============================================== */}
            <div
                className="hidden md:flex w-full h-[90px] bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 px-6 items-center justify-between z-50 select-none shrink-0 transition-all duration-500"
                onClick={() => { if (!isMaximized) toggleMaximize() }}
            >
                {/* Left: Info */}
                <div className="flex items-center gap-4 w-[30%] min-w-[180px]">
                    <div className="relative group cursor-pointer perspective-3d">
                        <img
                            src={currentTrack.album?.images?.[0]?.url || currentTrack.image || 'https://via.placeholder.com/56'}
                            alt="Album Art"
                            className="h-14 w-14 rounded-lg shadow-lg object-cover group-hover:opacity-80 transition-all duration-300 group-hover:scale-105 bg-neutral-800"
                        />
                        <div className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110">
                            <ChevronUp size={12} className="text-white" />
                        </div>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                        <div className="hover:underline cursor-pointer text-sm font-bold text-white truncate w-full tracking-wide">
                            {currentTrack.name}
                        </div>
                        <div className="hover:underline cursor-pointer text-xs text-gray-400 truncate w-full group-hover:text-white transition-colors">
                            {currentTrack.artists?.map(a => a.name).join(', ')}
                        </div>
                    </div>
                    <button onClick={handleLike} className="ml-2 text-gray-400 hover:text-green-500 hover:scale-110 transition active:scale-90">
                        <Heart size={20} className={isLiked ? "fill-green-500 text-green-500" : ""} />
                    </button>
                </div>

                {/* Center: Controls */}
                <div className="flex flex-col items-center justify-center w-[40%] gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleShuffle}
                            className={`transition hover:scale-110 active:scale-95 ${shuffle ? 'text-green-500 relative' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Shuffle size={18} />
                            {shuffle && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]"></div>}
                        </button>
                        <button
                            onClick={prevTrack}
                            className="text-gray-400 hover:text-white transition hover:scale-110 active:scale-95"
                        >
                            <SkipBack size={24} fill="currentColor" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] group"
                        >
                            {isPlaying ?
                                <Pause size={22} className="text-black fill-black group-hover:scale-90 transition-transform" /> :
                                <Play size={22} className="text-black fill-black ml-0.5 group-hover:scale-110 transition-transform" />
                            }
                        </button>

                        <button
                            onClick={nextTrack}
                            className="text-gray-400 hover:text-white transition hover:scale-110 active:scale-95"
                        >
                            <SkipForward size={24} fill="currentColor" />
                        </button>
                        <button
                            onClick={toggleRepeat}
                            className={`transition hover:scale-110 active:scale-95 ${repeat > 0 ? 'text-green-500 relative' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Repeat size={18} />
                            {repeat === 2 && <span className="absolute -top-1.5 -right-2 text-[8px] font-bold bg-green-500 text-black px-1 rounded-full shadow-sm">1</span>}
                            {repeat > 0 && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]"></div>}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full max-w-lg text-[11px] font-mono font-medium text-gray-400">
                        <span className="min-w-[32px] text-right">{formatTime(displayedTime)}</span>
                        <div
                            className="relative flex-1 h-1 bg-white/10 rounded-full group cursor-pointer"
                        >
                            <div
                                className="absolute inset-y-0 left-0 bg-white rounded-full group-hover:bg-green-500 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                            <input
                                type="range"
                                min="0" max={time.totalTime || 0}
                                value={displayedTime}
                                onChange={(e) => handleSeekStart(parseFloat(e.target.value))}
                                onMouseUp={handleSeekCommit}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <span className="min-w-[32px]">{formatTime(time.totalTime)}</span>
                    </div>
                </div>

                {/* Right: Options */}
                <div className="flex items-center justify-end w-[30%] gap-3 relative" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => setIsQueueOpen(!isQueueOpen)}
                        className={`transition hover:scale-110 active:scale-95 p-2 rounded-full hover:bg-white/5 ${isQueueOpen ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
                        title="Queue"
                    >
                        <ListMusic size={20} />
                    </button>
                    <button
                        onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
                        className={`transition hover:scale-110 active:scale-95 p-2 rounded-full hover:bg-white/5 ${isDeviceMenuOpen ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
                        title="Devices"
                    >
                        <Speaker size={20} />
                    </button>

                    <div className="flex items-center gap-2 w-28 group/vol">
                        <button onClick={toggleMute} className="text-gray-400 hover:text-white p-1">
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <div className="h-1 flex-1 bg-white/10 rounded-full cursor-pointer relative overflow-hidden">
                            <div className="absolute h-full bg-white rounded-full group-hover/vol:bg-green-500 transition-colors" style={{ width: `${volume}%` }}></div>
                            <input
                                type="range"
                                min="0" max="1" step="0.01"
                                value={volume / 100}
                                onChange={(e) => setVolume(parseFloat(e.target.value) * 100)}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <button onClick={toggleMaximize} className="text-gray-400 hover:text-white hover:scale-110 transition ml-2 p-1">
                        <Maximize2 size={20} />
                    </button>

                    {/* Queue Popup */}
                    {isQueueOpen && (
                        <div ref={queueMenuRef} className="absolute bottom-[100px] right-0 w-80 bg-[#1e1e24] shadow-2xl rounded-xl border border-white/5 p-4 max-h-[60vh] overflow-y-auto animate-fade-in-up dark-scrollbar">
                            <h3 className="text-white font-bold mb-3 sticky top-0 bg-[#1e1e24] pb-2 border-b border-white/5 z-10">Queue</h3>
                            {queue.map((t, i) => (
                                <div key={i} className={`flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition ${currentTrack.id === t.id ? 'bg-white/5' : ''}`} onClick={() => { playTrack(t, queue); setIsQueueOpen(false); }}>
                                    <span className={`text-xs ${currentTrack.id === t.id ? 'text-green-500' : 'text-gray-500'}`}>{i + 1}</span>
                                    <img src={t.album?.images?.[2]?.url || t.image} className="w-8 h-8 rounded bg-neutral-800" alt="" />
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className={`text-xs font-semibold truncate ${currentTrack.id === t.id ? 'text-green-500' : 'text-gray-300'}`}>{t.name}</span>
                                        <span className="text-[10px] text-gray-500 truncate">{t.artists?.[0]?.name}</span>
                                    </div>
                                    {currentTrack.id === t.id && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Device Popup */}
                    {isDeviceMenuOpen && (
                        <div ref={deviceMenuRef} className="absolute bottom-[100px] right-20 w-72 bg-[#1e1e24] shadow-2xl rounded-xl border border-white/5 p-4 animate-fade-in-up">
                            <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2 border-b border-white/5 pb-2"><Cast size={14} /> Connect Device</h3>
                            {devices.map(d => (
                                <div key={d.id} className={`p-3 flex items-center gap-3 rounded-lg hover:bg-white/5 cursor-pointer transition ${d.active ? 'bg-white/5' : ''}`}>
                                    {d.type === 'laptop' ? <Laptop size={18} className={d.active ? "text-green-500" : "text-gray-400"} /> : d.type === 'smartphone' ? <Smartphone size={18} className={d.active ? "text-green-500" : "text-gray-400"} /> : <Speaker size={18} className={d.active ? "text-green-500" : "text-gray-400"} />}
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-medium ${d.active ? 'text-green-500' : 'text-gray-200'}`}>{d.name}</span>
                                        {d.active && <span className="text-[10px] text-green-500 uppercase tracking-widest">Active</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Player;
