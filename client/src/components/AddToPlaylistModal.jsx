import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Music2, Check, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AddToPlaylistModal = ({ track, onClose, token }) => {
    const { showToast } = useToast();
    const [playlists, setPlaylists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mode, setMode] = useState('select'); // 'select' or 'create'
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchPlaylists = async () => {
            if (!token) return;
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/playlists`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPlaylists(res.data);
            } catch (err) {
                console.error("Failed to fetch playlists");
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlaylists();
    }, [token]);

    const handleAddToExisting = async (playlistId, playlistName) => {
        setIsSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/user/playlists/${playlistId}/add`,
                {
                    songId: track.id,
                    name: track.name,
                    artist: track.artists?.[0]?.name || track.artist || 'Unknown',
                    image: track.album?.images?.[0]?.url || track.image,
                    album: track.album?.name || 'Single',
                    duration_ms: track.duration_ms
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast(`Added to "${playlistName}"`, "success");
            console.log(`[USER ACTION] Added '${track.name}' to playlist '${playlistName}'`);
            onClose();
        } catch (err) {
            showToast("Failed to add to playlist", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateAndAdd = async (e) => {
        e.preventDefault();
        if (!newPlaylistName.trim()) return;
        setIsSubmitting(true);
        try {
            // 1. Create
            const createRes = await axios.post(`${import.meta.env.VITE_API_URL}/user/playlists`,
                { name: newPlaylistName, description: `Created from ${track.name}` },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const playlist = createRes.data;

            // 2. Add
            await axios.post(`${import.meta.env.VITE_API_URL}/user/playlists/${playlist._id}/add`,
                {
                    songId: track.id,
                    name: track.name,
                    artist: track.artists?.[0]?.name || track.artist || 'Unknown',
                    image: track.album?.images?.[0]?.url || track.image,
                    album: track.album?.name || 'Single',
                    duration_ms: track.duration_ms
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showToast(`Created "${newPlaylistName}" and added song`, "success");
            console.log(`[USER ACTION] Created playlist '${newPlaylistName}' and added track '${track.name}'`);
            onClose();
        } catch (err) {
            showToast("Failed to create playlist", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-[#1e1e24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Music2 size={20} className="text-indigo-400" />
                        Add to Playlist
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {mode === 'select' ? (
                        <>
                            <button
                                onClick={() => setMode('create')}
                                className="w-full mb-4 p-3 rounded-xl border border-dashed border-white/20 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all flex items-center gap-3 text-white/70 hover:text-indigo-400 group"
                            >
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    <Plus size={20} />
                                </div>
                                <span className="font-semibold">Create New Playlist</span>
                            </button>

                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">My Playlists</h3>

                            {isLoading ? (
                                <div className="text-center py-8 text-gray-500 animate-pulse">Loading playlists...</div>
                            ) : playlists.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No playlists found.</div>
                            ) : (
                                <div className="space-y-1">
                                    {playlists.map(playlist => (
                                        <button
                                            key={playlist._id}
                                            disabled={isSubmitting}
                                            onClick={() => handleAddToExisting(playlist._id, playlist.name)}
                                            className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition flex items-center justify-between group disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-white/50 group-hover:text-white group-hover:scale-105 transition-all">
                                                    <Music2 size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{playlist.name}</div>
                                                    <div className="text-xs text-gray-500">{playlist.songs?.length || 0} songs</div>
                                                </div>
                                            </div>
                                            {isSubmitting && <Loader2 size={16} className="animate-spin text-indigo-400" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <form onSubmit={handleCreateAndAdd} className="flex flex-col h-full justify-center">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Playlist Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="My Awesome Mix"
                                    value={newPlaylistName}
                                    onChange={(e) => setNewPlaylistName(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMode('select')}
                                    className="flex-1 py-3 rounded-xl hover:bg-white/5 text-gray-400 font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newPlaylistName.trim() || isSubmitting}
                                    className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Create & Add'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
