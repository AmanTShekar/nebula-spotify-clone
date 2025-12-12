import { useAuth } from '../context/AuthContext';
import { User, Music, Clock, Settings, Play, Heart, ListMusic, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';

const Profile = () => {
    const { user, updateUserProfile } = useAuth();
    const { playTrack } = usePlayer();
    const navigate = useNavigate();

    const [stats, setStats] = useState({ likedSongsCount: 0, playlistsCount: 0 });
    const [likedSongsList, setLikedSongsList] = useState([]);
    const [playlistsList, setPlaylistsList] = useState([]);
    const [activeTab, setActiveTab] = useState('liked'); // 'liked' | 'playlists'

    const [isEditing, setIsEditing] = useState(false);
    const [pendingUser, setPendingUser] = useState({ name: '', email: '', image: '' });
    const [error, setError] = useState('');
    const [imgError, setImgError] = useState(false);

    // Predefined generic avatars
    const avatars = [
        "https://api.dicebear.com/9.x/notionists/svg?seed=Felix",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Zoey",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Jack",
        "https://api.dicebear.com/9.x/lorelei/svg?seed=Oliver",
        "https://api.dicebear.com/9.x/open-peeps/svg?seed=Leo",
        "https://api.dicebear.com/9.x/micah/svg?seed=Milo",
        "https://api.dicebear.com/9.x/bottts/svg?seed=Cyber",
    ];

    useEffect(() => {
        if (user) {
            setPendingUser({ name: user.name, email: user.email, image: user.image || '' });
        }
    }, [user, isEditing]);

    // Force reset imgError when user.image changes to retry loading
    useEffect(() => {
        setImgError(false);
    }, [user?.image]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [likesRes, playlistsRes] = await Promise.all([
                    axios.get(`${API_URL}/user/likes`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                    axios.get(`${API_URL}/user/playlists`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    })
                ]);

                const likes = likesRes.data || [];
                const playlists = playlistsRes.data || [];

                setStats({
                    likedSongsCount: likes.length,
                    playlistsCount: playlists.length
                });
                setLikedSongsList(likes);
                setPlaylistsList(playlists);
            } catch (err) {
                console.error("Error fetching profile stats", err);
            }
        };
        fetchStats();
    }, []);

    if (!user) return <div className="flex h-screen items-center justify-center"><div className="loader"></div></div>;

    return (
        <div className="px-4 md:px-8 py-6 md:py-12 pb-24 md:pb-32 text-white max-w-5xl mx-auto animate-fade-in-up">

            {/* 1. Mobile-First Hero Section */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 mb-10 md:mb-16">
                {/* Avatar with Glow */}
                <div className="relative group shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full bg-[#18181b] p-1.5 flex items-center justify-center overflow-hidden shadow-2xl">
                        {user.image && !imgError ? (
                            <img
                                src={user.image}
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover"
                                onError={() => setImgError(true)}
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl md:text-6xl font-black text-white">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* User Info - Centered on Mobile */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 min-w-0 w-full">
                    <div className="flex flex-col mb-4 md:mb-6">
                        <span className="text-indigo-400 font-bold tracking-widest text-[10px] md:text-xs uppercase mb-1">Profile</span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight truncate w-full max-w-[300px] md:max-w-none">
                            {user.name}
                        </h1>
                        <p className="text-gray-400 font-medium text-sm md:text-base mt-2">{user.email}</p>
                    </div>

                    {/* Meta Badge & Join Date */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center mb-6">
                        {(user.role === 'admin' || user.role === 'super-admin') && (
                            <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                <Settings size={12} /> {user.role === 'super-admin' ? 'Super Admin' : 'Admin'}
                            </span>
                        )}
                        <span className="text-xs text-gray-500 font-medium bg-white/5 px-3 py-1 rounded-full">
                            Joined {new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </span>
                    </div>

                    {/* Actions - Full Width on Mobile */}
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full md:w-auto px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 uppercase tracking-wider text-sm"
                    >
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* 2. Stats & Library */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Col: Stats */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                        <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-4">Library Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`bg-black/20 p-4 rounded-xl text-center cursor-pointer transition-colors ${activeTab === 'liked' ? 'bg-white/10' : 'hover:bg-white/5'}`} onClick={() => setActiveTab('liked')}>
                                <span className="text-3xl font-black text-white block mb-1">{stats.likedSongsCount}</span>
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Liked</span>
                            </div>
                            <div className={`bg-black/20 p-4 rounded-xl text-center cursor-pointer transition-colors ${activeTab === 'playlists' ? 'bg-white/10' : 'hover:bg-white/5'}`} onClick={() => setActiveTab('playlists')}>
                                <span className="text-3xl font-black text-white block mb-1">{stats.playlistsCount}</span>
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Playlists</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Tabs & Content */}
                <div className="md:col-span-2">
                    {/* Tabs */}
                    <div className="flex items-center gap-8 border-b border-white/10 mb-8 px-2">
                        <button
                            onClick={() => setActiveTab('liked')}
                            className={`pb-4 text-base font-bold transition-all border-b-2 ${activeTab === 'liked' ? 'border-green-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            Liked Songs
                        </button>
                        <button
                            onClick={() => setActiveTab('playlists')}
                            className={`pb-4 text-base font-bold transition-all border-b-2 ${activeTab === 'playlists' ? 'border-green-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            Playlists
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[300px]">
                        {activeTab === 'liked' && (
                            <div className="space-y-2 animate-fade-in">
                                {likedSongsList && likedSongsList.length > 0 ? (
                                    likedSongsList.map((track, i) => (
                                        <div key={i} onClick={() => playTrack(track)} className="flex items-center gap-4 p-3 hover:bg-white/10 rounded-xl cursor-pointer group transition-all duration-300 border border-transparent hover:border-white/5">
                                            <div className="w-12 h-12 rounded-lg bg-gray-800 shrink-0 overflow-hidden relative shadow-lg">
                                                <img src={track.image || track.album?.images?.[0]?.url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center backdrop-blur-[1px]">
                                                    <Play size={24} className="fill-white text-white drop-shadow-lg" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-base text-white truncate group-hover:text-green-400 transition-colors">{track.name}</p>
                                                <p className="text-sm text-gray-400 truncate">{track.artist || track.artists?.[0]?.name}</p>
                                            </div>
                                            <div className="active:scale-95 transition-transform text-green-500 p-2 hover:bg-white/10 rounded-full">
                                                <Heart size={20} className="fill-green-500" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-white/10 rounded-3xl bg-white/5">
                                        <Heart size={64} className="mb-6 opacity-20" />
                                        <p className="text-lg font-medium text-gray-400">No liked songs yet</p>
                                        <button onClick={() => navigate('/search')} className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition">Find Songs</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'playlists' && (
                            <div className="animate-fade-in">
                                {playlistsList && playlistsList.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                        {playlistsList.map((playlist, i) => (
                                            <div key={i} onClick={() => navigate(`/library`)} className="bg-[#18181b] hover:bg-[#282828] p-4 rounded-xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-2xl hover:shadow-black/50 border border-white/5">
                                                <div className="aspect-square w-full rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 mb-4 overflow-hidden relative shadow-inner flex items-center justify-center">
                                                    {playlist.image ? (
                                                        <img src={playlist.image} alt={playlist.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Music size={48} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                                    )}
                                                    <div className="absolute right-2 bottom-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl shadow-black/40">
                                                        <Play size={20} className="fill-black text-black ml-1" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white truncate mb-1">{playlist.name}</p>
                                                    <p className="text-xs text-gray-400 truncate font-medium">By {user.name}</p>
                                                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider">{playlist.songs?.length || 0} Songs</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-white/10 rounded-3xl bg-white/5">
                                        <ListMusic size={64} className="mb-6 opacity-20" />
                                        <p className="text-lg font-medium text-gray-400">No playlists created</p>
                                        <button onClick={() => navigate('/library')} className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition">Create Playlist</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal (Mobile Optimized) */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={(e) => {
                    // Click outside to close (robust)
                    if (e.target === e.currentTarget) setIsEditing(false);
                }}>
                    <div className="bg-[#18181b] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl relative flex flex-col max-h-[85vh]">
                        <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar">
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-8 text-center text-white">Edit Profile</h2>
                            {error && <div className="bg-red-500/10 text-red-500 text-xs font-bold p-3 rounded-xl mb-6 text-center">{error}</div>}

                            <div className="space-y-4 md:space-y-8">
                                {/* Avatar Select - Horizontal Scroll */}
                                <div className="flex flex-col gap-3 items-center">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Avatar</label>
                                    <div className="flex justify-center gap-4 w-full overflow-x-auto pb-4 no-scrollbar">
                                        {avatars.map((ava, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setPendingUser({ ...pendingUser, image: ava })}
                                                className={`relative cursor-pointer transition-all hover:scale-110 active:scale-95 shrink-0`}
                                            >
                                                <img
                                                    src={ava}
                                                    className={`w-16 h-16 rounded-full border-4 bg-white/5 ${pendingUser.image === ava ? 'border-white shadow-xl scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                    alt="avatar"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="w-full">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1 text-center">Or Paste Image URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://example.com/image.png"
                                            value={pendingUser.image}
                                            onChange={(e) => setPendingUser({ ...pendingUser, image: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-white/40 outline-none text-center"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Display Name</label>
                                        <input
                                            type="text"
                                            value={pendingUser.name}
                                            onChange={(e) => setPendingUser({ ...pendingUser, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-white/40 focus:bg-white/10 outline-none transition-all font-bold"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Email</label>
                                        <input
                                            type="email"
                                            value={pendingUser.email}
                                            onChange={(e) => setPendingUser({ ...pendingUser, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-white/40 focus:bg-white/10 outline-none transition-all font-bold"
                                            placeholder="Your Email"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 py-4 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors text-sm uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setError('');
                                            const res = await updateUserProfile(pendingUser);
                                            if (res.success) {
                                                setIsEditing(false);
                                            } else {
                                                setError(res.message);
                                            }
                                        }}
                                        className="flex-1 py-4 rounded-2xl font-bold bg-white text-black hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-wider shadow-xl"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
