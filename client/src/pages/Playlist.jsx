import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Clock, Calendar, Music2, MoreHorizontal, Trash2, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Playlist = () => {
    const { id } = useParams();
    const { token, user } = useAuth();
    const { playTrack } = usePlayer();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/playlists/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPlaylist(res.data);
            } catch (err) {
                console.error(err);
                setError("Playlist not found");
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchPlaylist();
    }, [id, token]);

    const handlePlayPlaylist = () => {
        if (playlist?.songs?.length > 0) {
            // Need to map songs to correct format if they aren't already
            playTrack(playlist.songs[0], playlist.songs);
        } else {
            showToast("Playlist is empty", "info");
        }
    };

    const handleDeletePlaylist = async () => {
        if (!window.confirm("Are you sure you want to delete this playlist?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/user/playlists/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast("Playlist deleted", "success");
            navigate('/library');
        } catch (err) {
            showToast("Failed to delete playlist", "error");
        }
    };

    const handleRemoveSong = async (songId) => {
        if (!confirm("Remove this song from playlist?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/user/playlists/${id}/songs/${songId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Optimistic update
            setPlaylist(prev => ({
                ...prev,
                songs: prev.songs.filter(s => (s.id || s) !== songId)
            }));
            showToast("Song removed", "success");
        } catch (err) {
            console.error(err);
            showToast("Failed to remove song", "error");
        }
    };

    if (loading) return <div className="p-8 text-white flex justify-center"><div className="w-10 h-10 border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div></div>;
    if (error) return <div className="p-8 text-red-400 font-bold text-center text-xl">{error}</div>;

    return (
        <div className="px-4 md:px-8 py-4 md:py-8 pb-24 md:pb-32 animate-fade-in text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8 mb-6 md:mb-10">
                <div className="w-48 h-48 md:w-52 md:h-52 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] shadow-2xl flex items-center justify-center relative overflow-hidden group shrink-0 mx-auto md:mx-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-pink-500/20"></div>
                    <Music2 size={60} className="text-gray-600 group-hover:scale-110 transition-transform duration-500 md:w-20 md:h-20" />
                </div>

                <div className="flex flex-col gap-2 md:gap-4 w-full text-center md:text-left">
                    <span className="uppercase text-[10px] md:text-xs font-bold tracking-widest text-indigo-400">Playlist</span>
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        {playlist.name}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-xs md:text-sm font-medium text-gray-400 mt-1 md:mt-2">
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                            {playlist.user?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-white hover:underline cursor-pointer">{playlist.user}</span>
                        <span>•</span>
                        <span>{playlist.songs?.length || 0} songs</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePlayPlaylist}
                        className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
                    >
                        <Play size={24} className="fill-black text-black ml-1" />
                    </button>
                    {(user?.id === playlist.user || user?._id === playlist.user) && (
                        <button
                            onClick={handleDeletePlaylist}
                            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all"
                            title="Delete Playlist"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Songs List */}
            <div className="flex flex-col">
                <div className="grid grid-cols-[16px_1fr_auto_40px] md:grid-cols-[16px_4fr_3fr_minmax(120px,1fr)_40px] gap-2 md:gap-4 px-2 md:px-4 py-2 border-b border-white/5 text-gray-400 text-xs md:text-sm font-medium uppercase tracking-wider mb-2 sticky top-0 bg-[#0f0f16]/95 backdrop-blur-xl z-10">
                    <div className="text-center">#</div>
                    <div>Title</div>
                    <div className="hidden md:block">Album</div>
                    <div className="text-right flex justify-end md:pr-8 pr-2"><Clock size={16} /></div>
                    <div></div>
                </div>

                {playlist.songs?.map((song, idx) => {
                    const isObject = typeof song === 'object' && song !== null;
                    const songName = isObject ? song.name : `Track ${song}`;
                    const artistName = isObject ? (song.artists?.[0]?.name || song.artist) : 'Unknown Artist';
                    const albumName = isObject ? (song.album?.name || 'Single') : '-';
                    const image = isObject ? (song.image || song.album?.images?.[0]?.url) : null;

                    return (
                        <div
                            key={idx}
                            onClick={() => playTrack(isObject ? song : { id: song, name: `Track ${song}`, artists: [{ name: 'Unknown' }] }, playlist.songs)}
                            className="grid grid-cols-[16px_1fr_auto_40px] md:grid-cols-[16px_4fr_3fr_minmax(120px,1fr)_40px] gap-2 md:gap-4 px-2 md:px-4 py-2 md:py-3 rounded-xl hover:bg-white/5 group cursor-pointer transition-colors items-center relative"
                        >
                            <div className="flex items-center justify-center text-gray-500 text-sm font-medium group-hover:text-white">
                                <span className="group-hover:hidden">{idx + 1}</span>
                                <Play size={12} className="hidden group-hover:block fill-white ml-0.5" />
                            </div>

                            <div className="flex items-center gap-4 overflow-hidden">
                                <img src={image || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover shadow-sm bg-gray-800" />
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-white truncate text-[15px] group-hover:text-indigo-300 transition-colors">{songName}</span>
                                    <span className="text-gray-400 text-xs truncate group-hover:text-white transition-colors">{artistName}</span>
                                </div>
                            </div>

                            <div className="hidden md:block text-gray-400 text-sm truncate hover:text-white transition-colors">{albumName}</div>

                            <div className="flex items-center justify-end md:pr-4 pr-2 text-gray-500 text-xs md:text-sm font-mono group-hover:text-white tabular-nums">
                                {isObject && song.duration_ms ? `${Math.floor(song.duration_ms / 1000 / 60)}:${String(Math.floor((song.duration_ms / 1000) % 60)).padStart(2, '0')}` : '--:--'}
                            </div>

                            <div className="flex justify-center">
                                {(user?.id === playlist.user || user?._id === playlist.user) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveSong(isObject ? song.id : song);
                                        }}
                                        className="opacity-50 hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded-full transition-all"
                                        title="Remove from playlist"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {(!playlist.songs || playlist.songs.length === 0) && (
                    <div className="text-center py-20 text-gray-500">
                        <p>This playlist is empty.</p>
                        <p className="text-sm mt-2">Find songs and add them!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Playlist;
