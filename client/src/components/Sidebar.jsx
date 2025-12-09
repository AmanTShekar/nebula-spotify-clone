import { Home, Search, Library, Plus, Heart, Globe, ListMusic, Hexagon, Music2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';
import { API_URL } from '../config/api';

const SidebarItem = ({ icon: Icon, label, to, active, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-4 transition-all duration-300 cursor-pointer group py-3 px-4 rounded-xl flex-1 relative overflow-hidden ${active ? 'bg-white/10 text-white shadow-lg shadow-black/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
    >
        {active && (
            <>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full shadow-[0_0_15px_rgba(129,140,248,0.5)]"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none"></div>
            </>
        )}
        <Icon size={22} className={`transition-transform duration-300 z-10 ${active ? 'text-indigo-400 scale-100 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]' : 'group-hover:scale-110 group-hover:text-gray-200'}`} />
        <span className={`font-medium tracking-wide text-sm z-10 transition-colors ${active ? 'font-bold text-white' : ''}`}>{label}</span>
    </Link>
);

const Sidebar = ({ isMobile, onClose }) => {
    const location = useLocation();
    const { token, user } = useAuth();
    const [playlists, setPlaylists] = useState([]);
    const [likedSongsCount, setLikedSongsCount] = useState(0);

    // New Playlist Modal State
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                try {
                    const [likesRes, playlistsRes] = await Promise.all([
                        axios.get(`${API_URL}/user/likes`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }),
                        axios.get(`${API_URL}/user/playlists`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                    ]);
                    setLikedSongsCount(likesRes.data.length);
                    if (Array.isArray(playlistsRes.data)) {
                        setPlaylists(playlistsRes.data);
                    } else {
                        console.error("Playlists API returned non-array:", playlistsRes.data);
                        setPlaylists([]);
                    }
                } catch (err) {
                    console.error("Failed to fetch sidebar data", err);
                }
            };
            fetchData();
        }
    }, [token, location.pathname]); // Update on navigation too just in case

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        if (!newPlaylistName.trim()) return;

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/user/playlists`, { name: newPlaylistName }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlaylists([...playlists, res.data]);
            setNewPlaylistName("");
            setIsCreating(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        if (!token) return alert("Login to create playlists");
        setIsCreating(true);
        setTimeout(() => document.getElementById('playlist-input')?.focus(), 100);
    }

    return (
        <div className={`${isMobile ? 'flex w-full h-full bg-transparent' : 'hidden md:flex w-[280px] h-full glass rounded-xl'} flex-col p-6 gap-6 z-20 relative transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/5`}>
            {/* Header */}
            <div className="flex items-center gap-3 px-2 mb-6 mt-2 group">
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-2.5 rounded-xl shadow-[0_4px_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_4px_30px_rgba(99,102,241,0.6)] transition-all duration-500 transform group-hover:rotate-12">
                    <Hexagon size={22} className="text-white fill-white/20" />
                </div>
                <div>
                    <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 group-hover:to-white transition-all">
                        Nebula
                    </span>
                    <div className="text-[10px] font-bold tracking-[0.2em] text-indigo-400 uppercase leading-none opacity-80 pl-0.5">Stream Music</div>
                </div>
            </div>

            {/* Main Nav */}
            <div className="flex flex-col gap-2">
                <SidebarItem icon={Home} label="Home" to="/" active={location.pathname === '/'} onClick={onClose} />
                <SidebarItem icon={Search} label="Search" to="/search" active={location.pathname === '/search'} onClick={onClose} />
            </div>

            <div className="h-[1px] bg-white/5 w-full my-1"></div>

            {/* Library Section */}
            <div className="flex-1 flex flex-col overflow-hidden gap-4">
                <div className="flex items-center justify-between text-gray-400 px-2">
                    <Link to="/library" onClick={onClose} className="flex items-center gap-2 hover:text-white transition cursor-pointer">
                        <Library size={20} />
                        <span className="font-bold text-sm uppercase tracking-wider">Library</span>
                    </Link>
                    <button onClick={openCreateModal} className="hover:bg-white/10 p-1.5 rounded-full cursor-pointer transition text-white/70 hover:text-white">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="flex gap-2 px-1">
                    <span className="bg-white/5 border border-white/5 text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-white/10 hover:border-white/10 transition text-gray-300">Playlists</span>
                    <span className="bg-white/5 border border-white/5 text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-white/10 hover:border-white/10 transition text-gray-300">Artists</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
                    <Link to="/likes" onClick={onClose} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group mb-2 transition-colors">
                        <div className="bg-gradient-to-br from-indigo-600 to-emerald-400 w-12 h-12 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                            <Heart size={20} className="text-white fill-white shadow-sm" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm group-hover:text-indigo-300 transition-colors">Liked Songs</p>
                            <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Playlist • {likedSongsCount} songs</p>
                        </div>
                    </Link>

                    {(user?.role === 'admin' || user?.role === 'super-admin') && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                            <Link to="/admin" onClick={onClose} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group">
                                <div className="bg-red-500/20 border border-red-500/50 w-8 h-8 rounded-full flex items-center justify-center">
                                    <Globe size={16} className="text-red-400" />
                                </div>
                                <p className="text-red-400/80 font-semibold text-sm">Admin Panel</p>
                            </Link>
                        </div>
                    )}

                    {playlists.map(pl => (
                        <Link to={`/playlist/${pl._id}`} onClick={onClose} key={pl._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 w-10 h-10 rounded-lg flex items-center justify-center group-hover:from-gray-700 group-hover:to-gray-800 transition-colors border border-white/5">
                                {pl.songs?.length > 0 && pl.songs[0].image ? (
                                    <img src={pl.songs[0].image} alt="" className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <Music2 size={18} className="text-gray-500 group-hover:text-gray-300" />
                                )}
                            </div>
                            <div>
                                <p className="text-gray-300 font-medium text-sm group-hover:text-white truncate max-w-[140px]">{pl.name}</p>
                                <p className="text-gray-600 text-xs truncate max-w-[140px]">{pl.user}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Create Playlist Modal */}
            {/* Create Playlist Modal - Portal to Body for Z-Index Safety */}
            {isCreating && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="glass p-8 rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl relative">
                        <h3 className="text-2xl font-black text-white mb-6 text-center">New Playlist</h3>
                        <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-5">
                            <div className="group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Playlist Name</label>
                                <input
                                    id="playlist-input"
                                    type="text"
                                    value={newPlaylistName}
                                    onChange={(e) => setNewPlaylistName(e.target.value)}
                                    placeholder="My Awesome Playlist"
                                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 outline-none transition-all focus:bg-white/10 text-white placeholder-gray-600 text-sm font-semibold"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-6 py-3 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newPlaylistName.trim() || isLoading}
                                    className="px-8 py-3 text-xs font-bold bg-white text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 uppercase tracking-wider shadow-lg shadow-white/10"
                                >
                                    {isLoading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Sidebar;
