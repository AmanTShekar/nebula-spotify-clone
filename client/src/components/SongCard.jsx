import { Play, Heart, Pause } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useState, memo } from 'react';

const SongCard = ({ track, context }) => {
    const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
    const { token } = useAuth();
    const [isLiked, setIsLiked] = useState(false); // Ideally check this from user props

    const handlePlay = (e) => {
        e.stopPropagation();
        if (currentTrack?.id === track.id) {
            togglePlay();
        } else {
            playTrack(track, context);
        }
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!token) return alert('Please login to like songs');

        try {
            // Optimistic UI update
            setIsLiked(!isLiked);
            await axios.post(`${import.meta.env.VITE_API_URL}/user/likes`, {
                songId: track.id,
                source: track.source || 'spotify',
                name: track.name,
                artist: track.artists?.[0]?.name || 'Unknown',
                image: track.album?.images?.[0]?.url || track.image || 'https://via.placeholder.com/150'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error(err);
            setIsLiked(!isLiked); // Revert on error
        }
    };

    const isCurrent = currentTrack?.id === track.id;

    return (
        <div
            className="glass-card group p-4 rounded-xl cursor-pointer relative flex flex-col gap-4 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10"
        >
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
                <img
                    src={track.album?.images?.[0]?.url || track.image || 'https://via.placeholder.com/150'}
                    alt={track.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                    className={`w-full h-full object-cover transition-transform duration-500 will-change-transform ${isCurrent ? 'scale-105' : 'group-hover:scale-110'}`}
                />

                {/* Overlay */}
                <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>

                <button
                    onClick={handlePlay}
                    className={`absolute bottom-3 right-3 bg-green-500 text-black rounded-full p-3.5 shadow-xl shadow-black/40 transform transition-all duration-300 hover:scale-110 hover:brightness-110 active:scale-95 z-20 ${isCurrent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'}`}
                >
                    {isCurrent && isPlaying ? <Pause size={20} className="fill-black" /> : <Play size={20} className="fill-black pl-0.5" />}
                </button>
            </div>

            <div className="flex flex-col min-h-[60px]">
                <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-bold truncate mb-1 text-sm flex-1 transition-colors ${isCurrent ? 'text-indigo-400' : 'text-white group-hover:text-indigo-200'}`}>
                        {track.name}
                    </h3>
                    <button onClick={handleLike} className="text-gray-400 hover:text-white transition transform active:scale-90">
                        <Heart size={18} className={isLiked ? "fill-pink-500 text-pink-500" : ""} />
                    </button>
                </div>
                <p className="text-xs text-gray-400 truncate line-clamp-2 group-hover:text-gray-300 transition-colors">
                    {track.artists?.map(a => a.name).join(', ')}
                </p>
            </div>
        </div>
    );
};

export default memo(SongCard);
