import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SongCard from '../components/SongCard';
import { Library as LibraryIcon, Heart, ListMusic, Play } from 'lucide-react';
import { API_URL } from '../config/api';

const Library = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('likes'); // 'likes' or 'playlists'
    const [likedSongs, setLikedSongs] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'likes') {
                    const res = await axios.get(`${API_URL}/user/likes`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Map stored data to SongCard format
                    const mappedSongs = res.data.map(item => {
                        if (typeof item === 'string') return null;
                        return {
                            id: item.id,
                            name: item.name,
                            artists: [{ name: item.artist }],
                            album: { images: [{ url: item.image }] },
                            source: item.source
                        };
                    }).filter(Boolean);

                    setLikedSongs(mappedSongs);

                } else {
                    const res = await axios.get(`${API_URL}/user/playlists`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setPlaylists(Array.isArray(res.data) ? res.data : []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, activeTab]);

    if (!token) return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
            <LibraryIcon size={64} className="mb-4 opacity-20" />
            <h2 className="text-2xl font-bold mb-2">Library Locked</h2>
            <p>Please log in to access your personal collection.</p>
        </div>
    );

    return (
        <div className="px-4 md:px-8 pb-24 md:pb-32 h-full">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-6 md:mb-8">
                <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-2 md:gap-3">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">Your Library</span>
                </h1>

                <div className="bg-white/5 p-1 rounded-full flex items-center border border-white/10 backdrop-blur-md w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('likes')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 rounded-full font-bold text-xs md:text-sm transition-all duration-300 ${activeTab === 'likes' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Heart size={14} className={`md:w-4 md:h-4 ${activeTab === 'likes' ? 'fill-white' : ''}`} /> <span className="hidden sm:inline">Liked</span> Songs
                    </button>
                    <button
                        onClick={() => setActiveTab('playlists')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 rounded-full font-bold text-xs md:text-sm transition-all duration-300 ${activeTab === 'playlists' ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <ListMusic size={14} className="md:w-4 md:h-4" /> Playlists
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {activeTab === 'likes' && (
                        <>
                            {likedSongs.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                                    {likedSongs.map(track => (
                                        <SongCard key={track.id} track={track} context={likedSongs} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <Heart size={64} className="mb-4 opacity-20" />
                                    <p className="text-lg">No liked songs yet.</p>
                                    <p className="text-sm opacity-60">Go explore and find something you love!</p>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'playlists' && (
                        <>
                            {playlists.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                                    {playlists.map(playlist => (
                                        <Link to={`/playlist/${playlist._id}`} key={playlist._id} className="glass p-3 md:p-5 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative overflow-hidden border border-white/5 block">
                                            <div className="aspect-square rounded-lg md:rounded-xl mb-3 md:mb-4 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl group-hover:shadow-2xl transition-shadow relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                <ListMusic size={32} className="md:w-12 md:h-12 text-gray-600 group-hover:text-white transition-colors duration-300 transform group-hover:scale-110" />

                                                <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                                    <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full p-2 md:p-3 shadow-lg hover:scale-105 transition-transform">
                                                        <Play size={16} className="md:w-5 md:h-5 fill-white text-white ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-white truncate text-sm md:text-lg mb-1">{playlist.name}</h3>
                                            <p className="text-xs md:text-sm text-gray-400 font-medium truncate">By {playlist.user}</p>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <ListMusic size={64} className="mb-4 opacity-20" />
                                    <p className="text-lg">No playlists yet.</p>
                                    <p className="text-sm opacity-60">Create one from the sidebar!</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Library;
