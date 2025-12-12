import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Clock, User, Music2, AlertCircle } from 'lucide-react';

const Artist = () => {
    const { id } = useParams();
    const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

    const [artist, setArtist] = useState(null);
    const [topTracks, setTopTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArtistData = async () => {
            setLoading(true);
            try {
                const [artistRes, tracksRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/spotify/artist/${id}`),
                    axios.get(`${import.meta.env.VITE_API_URL}/spotify/artist/${id}/top-tracks`)
                ]);

                setArtist(artistRes.data);
                setTopTracks(tracksRes.data.tracks);
            } catch (err) {
                console.error("Failed to fetch artist data", err);
                setError("Artist not found or API error");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchArtistData();
    }, [id]);

    const handlePlayTopTracks = () => {
        if (topTracks.length > 0) {
            playTrack(topTracks[0], topTracks);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full text-white">
            <div className="w-10 h-10 border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
            <AlertCircle size={48} />
            <p className="text-xl font-bold">{error}</p>
        </div>
    );

    if (!artist) return null;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f0f16] text-white pb-24 md:pb-32">
            {/* Header */}
            <div className="relative w-full h-64 md:h-80 lg:h-96 min-h-[250px] flex items-end p-4 md:p-8 overflow-hidden">
                {/* Background Image with Gradient Overlay */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${artist.images?.[0]?.url})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f16] via-[#0f0f16]/40 to-transparent"></div>
                </div>

                <div className="relative z-10 flex flex-col gap-4 animate-fade-in-up">
                    <span className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-white/80">
                        <div className="p-1 bg-purple-500 rounded-full"><User size={12} fill="currentColor" /></div>
                        Verified Artist
                    </span>
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter drop-shadow-2xl">{artist.name}</h1>
                    <p className="text-lg text-white/80 font-medium">
                        {artist.followers?.total?.toLocaleString()} followers
                    </p>
                </div>
            </div>

            <div className="px-4 md:px-8 py-4 md:py-8 max-w-7xl mx-auto">
                {/* Actions */}
                <div className="flex items-center gap-6 mb-10">
                    <button
                        onClick={handlePlayTopTracks}
                        className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)] group"
                    >
                        <Play size={28} className="fill-white ml-1 group-hover:scale-110 transition-transform" />
                    </button>
                    <button className="px-6 py-2 border border-white/20 rounded-full text-sm font-bold tracking-widest uppercase hover:border-white hover:bg-white/5 transition-all">
                        Follow
                    </button>
                </div>

                {/* Top Tracks */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Popular</h2>
                    <div className="flex flex-col">
                        {topTracks.slice(0, 5).map((track, idx) => (
                            <div
                                key={track.id}
                                onClick={() => playTrack(track, topTracks)}
                                className="group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <div className="w-6 text-center text-gray-400 group-hover:text-white font-mono text-sm">
                                    {idx + 1}
                                </div>

                                <img
                                    src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url}
                                    alt=""
                                    className="w-12 h-12 rounded bg-gray-800 object-cover shadow-sm"
                                />

                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>
                                        {track.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate group-hover:text-gray-400">
                                        {track.album?.name}
                                    </div>
                                </div>

                                <div className="text-sm text-gray-400 font-mono">
                                    {Math.floor(track.duration_ms / 1000 / 60)}:{String(Math.floor((track.duration_ms / 1000) % 60)).padStart(2, '0')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Artist;
