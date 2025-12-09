import { useAuth } from '../context/AuthContext';
import { User, Music, Clock, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
    const { user, updateUserProfile } = useAuth();
    const [stats, setStats] = useState({ likedSongs: 0, playlists: 0 });
    const [isEditing, setIsEditing] = useState(false);
    const [pendingUser, setPendingUser] = useState({ name: '', email: '', image: '' });
    const [error, setError] = useState('');

    // Predefined generic avatars
    // Unified "Micah" Avatars
    const avatars = [
        "https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=e0e7ff&baseColor=f9c9b6",
        "https://api.dicebear.com/7.x/micah/svg?seed=Willow&backgroundColor=ffdfbf&baseColor=ac6651",
        "https://api.dicebear.com/7.x/micah/svg?seed=Milo&backgroundColor=cffafe&baseColor=f9c9b6",
        "https://api.dicebear.com/7.x/micah/svg?seed=Oscar&backgroundColor=fce7f3&baseColor=ac6651",
        "https://api.dicebear.com/7.x/micah/svg?seed=Aneka&backgroundColor=ffdfbf&baseColor=f9c9b6",
    ];

    useEffect(() => {
        if (user) {
            setPendingUser({ name: user.name, email: user.email, image: user.image || '' });
        }
    }, [user, isEditing]); // Reset when opening modal

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [likesRes, playlistsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/user/likes`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/user/playlists`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    })
                ]);
                setStats({
                    likedSongs: likesRes.data.length,
                    playlists: playlistsRes.data.length
                });
            } catch (err) {
                console.error("Error fetching profile stats", err);
            }
        };
        fetchStats();
    }, []);

    if (!user) return <div className="px-4 md:px-8 py-4 md:py-8 text-white">Loading...</div>;

    return (
        <div className="px-4 md:px-8 py-4 md:py-8 pb-24 md:pb-32 text-white max-w-5xl mx-auto animate-fade-in-up">
            {/* Header / Hero */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-8 md:mb-12">
                <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-2 shadow-2xl shrink-0">
                    <div className="w-full h-full rounded-full bg-black/20 flex items-center justify-center backdrop-blur-sm overflow-hidden">
                        {user.image ? (
                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl md:text-5xl lg:text-6xl font-black text-white/90">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <span className="uppercase tracking-widest text-xs font-bold mb-2">Profile</span>
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black mb-2 md:mb-4 tracking-tighter">{user.name}</h1>
                    <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                        {user.role === 'super-admin' && (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                Super Admin
                            </span>
                        )}
                        {user.role === 'admin' && (
                            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                Admin
                            </span>
                        )}
                        <span>•</span>
                        <span>{user.email}</span>
                        <span>•</span>
                        <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="ml-2 md:ml-4 px-3 md:px-4 py-1 md:py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/10 transition-colors"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="glass p-4 md:p-8 rounded-2xl md:rounded-3xl w-full max-w-lg border border-white/10 relative shadow-2xl">
                        <h2 className="text-xl md:text-2xl font-black mb-6 text-center text-white">Edit Profile</h2>
                        {error && <div className="bg-red-500/10 text-red-500 text-xs font-bold p-3 rounded-xl mb-4 text-center border border-red-500/20">{error}</div>}

                        <div className="space-y-6">
                            {/* Avatar Select */}
                            <div className="flex flex-col gap-3 items-center">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Avatar</label>
                                <div className="flex justify-center gap-4">
                                    {avatars.map((ava, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setPendingUser({ ...pendingUser, image: ava })}
                                            className={`relative cursor-pointer transition-all hover:scale-105 active:scale-95 group`}
                                        >
                                            <img
                                                src={ava}
                                                className={`w-14 h-14 rounded-full border-2 bg-white/5 ${pendingUser.image === ava ? 'border-indigo-500 shadow-lg shadow-indigo-500/30' : 'border-transparent opacity-60 group-hover:opacity-100 group-hover:border-white/20'}`}
                                                alt="avatar"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 md:mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={pendingUser.name}
                                        onChange={(e) => setPendingUser({ ...pendingUser, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-white focus:border-indigo-500/50 outline-none transition-colors text-sm md:text-base font-semibold placeholder-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 md:mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={pendingUser.email}
                                        onChange={(e) => setPendingUser({ ...pendingUser, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-white focus:border-indigo-500/50 outline-none transition-colors text-sm md:text-base font-semibold placeholder-gray-600"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-2 md:py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors text-xs md:text-sm uppercase tracking-wider"
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
                                    className="flex-1 py-2 md:py-3 rounded-xl font-bold bg-white text-black hover:scale-[1.02] active:scale-[0.98] transition-all text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-white/10"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Content Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group cursor-default">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-green-500/20 p-3 rounded-full text-green-500 group-hover:scale-110 transition-transform">
                            <Music size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Your Music Taste</h2>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium text-gray-300 mt-4">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-bold text-white">{stats.likedSongs}</span>
                            <span className="text-gray-400 text-xs uppercase tracking-wider">Liked Songs</span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/10"></div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-bold text-white">{stats.playlists}</span>
                            <span className="text-gray-400 text-xs uppercase tracking-wider">Playlists</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group cursor-default">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-purple-500/20 p-3 rounded-full text-purple-500 group-hover:scale-110 transition-transform">
                            <Clock size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Recent Activity</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Logged in just now
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                            Updated profile settings
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
