import { useEffect, useState } from 'react';
import axios from 'axios';
import SongCard from '../components/SongCard';
import Loader from '../components/Loader';
import { Play, History } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const Home = () => {
    const [newReleases, setNewReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("All");
    const [personalizedMixes, setPersonalizedMixes] = useState([]);
    const { recentTracks, playTrack } = usePlayer();
    const { token, loading: authLoading, isLoggingOut, user } = useAuth();

    useEffect(() => {
        const fetchNewReleases = async () => {
            try {
                let items = [];
                try {
                    const res = await axios.get(`${API_URL}/spotify/new-releases`);
                    items = res.data?.albums?.items || res.data?.tracks?.items || [];
                } catch (e) {
                    console.warn("API unreachable, using local fallback");
                }

                // If items is still empty, we depend on the server or show simple empty state
                if (!items.length) {
                    // Do nothing, let it be empty or server handled
                }
                setNewReleases(items);
            } catch (err) {
                console.error("Home Fetch Error:", err);
                // Minimal Fallback to prevent white screen/retry loop if server completely fails
                setNewReleases([
                    { id: 'error-fallback', name: 'Unable to connect to server', artists: [{ name: 'Please check terminal' }], images: [{ url: 'https://via.placeholder.com/300?text=Offline' }], album_type: 'error' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchNewReleases();
    }, []);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Spotify-style Categories
    const categories = [
        "All",
        "Music",
        "Songs",
        "Podcasts",
        "Romance",
        "Feel Good",
        "Party",
        "Relax",
        "Workout",
        "Commute"
    ];

    useEffect(() => {
        // Reset state on category change (optional, but good for UX)
    }, [category]);

    // Fetch Category Content
    const [categoryContent, setCategoryContent] = useState([]);
    useEffect(() => {
        const fetchCategoryContent = async () => {
            if (category === "All") {
                setCategoryContent([]);
                return;
            }
            if (category === "Music") {
                // For "Music", we might just show standard recommendations or "Hits"
                const res = await axios.get(`${API_URL}/spotify/search`, {
                    params: { q: 'Global Hits', type: 'playlist', limit: 10 }
                });
                if (res.data.playlists) setCategoryContent(res.data.playlists.items);
                return;
            }
            if (category === "Songs") {
                // Fetch Top Songs specifically
                const res = await axios.get(`${API_URL}/spotify/search`, {
                    params: { q: 'top global songs', type: 'video', limit: 20 }
                });
                if (res.data.tracks) setCategoryContent(res.data.tracks.items);
                return;
            }
            if (category === "Podcasts") {
                // Mock podcasts or search
                setCategoryContent([]);
                return;
            }

            try {
                // Search for playlists/tracks in that Mood/Genre
                const res = await axios.get(`${API_URL}/spotify/search`, {
                    params: { q: `${category} Mix`, type: 'playlist', limit: 20 }
                });
                if (res.data.playlists) setCategoryContent(res.data.playlists.items);
            } catch (err) {
                console.error("Category fetch failed", err);
            }
        };
        fetchCategoryContent();
    }, [category]);

    // Personalization: Deep Personalization State
    const [timeBasedContent, setTimeBasedContent] = useState([]);
    const [similarToArtistContent, setSimilarToArtistContent] = useState(null);

    // 1. Time-Based Recommendations (Soundtrack for your Morning/Afternoon/Evening)
    useEffect(() => {
        const fetchTimeBased = async () => {
            const hour = new Date().getHours();
            let query = "Pop Hits"; // Default
            let title = "Today's Hits";

            if (hour >= 5 && hour < 12) {
                query = "Morning Acoustic Chill Coffee";
                title = "Soundtrack for your Morning";
            } else if (hour >= 12 && hour < 17) {
                query = "Upbeat Work Focus";
                title = "Soundtrack for your Afternoon";
            } else if (hour >= 17 && hour < 22) {
                query = "Party Dance Evening";
                title = "Soundtrack for your Evening";
            } else {
                query = "Sleep Lo-Fi Chill";
                title = "Late Night Vibes";
            }

            try {
                const res = await axios.get(`${API_URL}/spotify/search`, {
                    params: { q: query, type: 'playlist', limit: 10 }
                });
                if (res.data.playlists) {
                    setTimeBasedContent({ title, items: res.data.playlists.items });
                }
            } catch (e) { console.error("Time Based Fetch Error", e); }
        };
        fetchTimeBased();
    }, []);

    // 2. Personalization: History & "More Like..."
    const [serverHistory, setServerHistory] = useState([]);
    useEffect(() => {
        // Don't fetch if auth is still loading or logging out
        if (authLoading || isLoggingOut?.current) return;

        // Double-check: ensure token exists in localStorage (prevents race conditions)
        const storedToken = localStorage.getItem('token');

        const fetchPersonalization = async () => {
            try {
                // Fetch History if logged in (skip for guest users)
                let history = [];
                // Skip if guest token OR guest role
                if (token && storedToken && token !== 'guest_token' && user?.role !== 'guest') {
                    try {
                        const historyRes = await axios.get(`${API_URL}/user/history`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        history = historyRes.data || [];
                        setServerHistory(history);
                    } catch (e) { /* ignore auth error */ }
                }

                // If no server history, try local
                if (history.length === 0 && recentTracks.length > 0) {
                    history = recentTracks;
                }

                // Generate Mixes & "More Like" based on history
                if (history.length > 0) {
                    const seedTrack = history[0];
                    const seedArtist = history.find(t => t.artist !== seedTrack.artist)?.artist || seedTrack.artist; // Try to get a variation

                    // Concurrent Fetches
                    const [mix1, mix2, similarArtistRes] = await Promise.all([
                        axios.get(`${API_URL}/spotify/recommendations`, { params: { seed_tracks: seedTrack.name } }),
                        axios.get(`${API_URL}/spotify/recommendations`, { params: { seed_artists: seedTrack.artist } }),
                        axios.get(`${API_URL}/spotify/search`, { params: { q: `${seedArtist} type music`, type: 'playlist', limit: 10 } }) // More like artist playlists
                    ]);

                    setPersonalizedMixes([
                        {
                            title: `${seedTrack.name} Mix`,
                            subtitle: `Based on your recent listening`,
                            image: seedTrack.image,
                            tracks: mix1.data.tracks
                        },
                        {
                            title: `${seedTrack.artist} Mix`,
                            subtitle: `More like ${seedTrack.artist}`,
                            image: mix2.data.tracks[0]?.album?.images?.[0]?.url,
                            tracks: mix2.data.tracks
                        }
                    ]);

                    if (similarArtistRes.data.playlists) {
                        setSimilarToArtistContent({
                            title: `More like ${seedArtist}`,
                            items: similarArtistRes.data.playlists.items
                        });
                    }
                }
            } catch (e) {
                console.error("Personalization Data Error", e);
            }
        };

        fetchPersonalization();
    }, [recentTracks, token, authLoading, isLoggingOut, user]); // Re-run if local recent tracks change (e.g., guest mode)

    // Error handling with retry logic
    if (loading) return <Loader />;

    if (!newReleases.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
                <p className="text-xl font-bold mb-4">Unable to load content</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition"
                >
                    Retry connection
                </button>
            </div>
        );
    }

    // ... (logic kept same)

    const featuredAlbum = newReleases[0];

    const handlePlayFeatured = () => {
        if (!featuredAlbum) return;
        const track = {
            id: featuredAlbum.id,
            name: featuredAlbum.name,
            album: featuredAlbum,
            artists: featuredAlbum.artists,
            preview_url: null,
            source: 'spotify'
        };
        playTrack(track);
    };

    // Logic to play a mix
    const playMix = (mix) => {
        if (mix.tracks.length > 0) {
            const track1 = mix.tracks[0];
            const queue = mix.tracks.map(t => ({
                id: t.id,
                name: t.name,
                album: t.album,
                artists: t.artists,
                preview_url: t.preview_url,
                source: 'spotify'
            }));
            playTrack(track1, queue);
        }
    };

    return (
        <div className="min-h-screen pb-24 md:pb-32 relative bg-[#0f0f16] max-w-full overflow-x-hidden">

            {/* 1. Mobile-First Category Header (Fixed Top) */}
            <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0f16] via-[#0f0f16]/95 to-transparent pt-3 pb-4">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-4 pb-2 md:px-8 snap-x">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`
                                flex-shrink-0 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300 border border-white/5
                                ${category === cat
                                    ? 'bg-white text-black scale-100 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                    : 'bg-white/5 text-white/90 hover:bg-white/10 active:scale-95'}
                            `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Main Content */}
            <div className="relative z-10 px-4 md:px-8 space-y-8 md:space-y-12">

                {/* Hero Section - Immersive Mobile & Desktop */}
                {category === "All" && featuredAlbum && (
                    <div className="relative w-full rounded-2xl md:rounded-[2rem] overflow-hidden group shadow-2xl">
                        {/* Mobile Portrait Height / Desktop Height */}
                        <div className="relative h-[280px] sm:h-[350px] md:h-[450px] w-full">

                            {/* Background Image */}
                            <img src={featuredAlbum.images[0].url} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" alt="Hero" />

                            {/* Gradient Overlay for Text Visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f16] via-[#0f0f16]/60 to-transparent"></div>

                            {/* Content Overlay */}
                            <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 flex items-end">
                                <div className="w-full">
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] items-center bg-black/60 text-[#1ed760] font-bold tracking-wider mb-2 border border-[#1ed760]/20 backdrop-blur-md">
                                        NEW RELEASE
                                    </span>
                                    <h1 className="text-2xl md:text-5xl lg:text-7xl font-black text-white leading-tight mb-1 md:mb-3 drop-shadow-lg line-clamp-2">
                                        {featuredAlbum.name}
                                    </h1>
                                    <p className="text-gray-300 text-xs md:text-xl font-medium mb-4 md:mb-6 line-clamp-1">
                                        {featuredAlbum.artists.map(a => a.name).join(', ')}
                                    </p>

                                    <div className="flex gap-3 md:gap-4">
                                        <button
                                            onClick={handlePlayFeatured}
                                            className="bg-[#1ed760] text-black font-extrabold py-3 px-8 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(30,215,96,0.3)] flex items-center gap-2 text-sm md:text-base"
                                        >
                                            <Play fill="black" size={18} className="md:w-5 md:h-5" />
                                            LISTEN
                                        </button>
                                        <button className="hidden md:flex bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold py-3 px-6 rounded-full hover:bg-white/10 transition text-sm">
                                            Save +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Greeting (Desktop Only mostly, or subtle) */}
                {category === "All" && (
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{greeting()}</h2>
                )}
                {category !== "All" && (
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{category} Mixes</h2>
                )}

                {/* Recently Played */}
                {(() => {
                    // Combine and dedupe history
                    const rawHistory = [...serverHistory, ...recentTracks];
                    const seen = new Set();
                    const validHistory = rawHistory.filter(t => {
                        const id = t.trackId || t.id;
                        if (!id || !t.name || t.name === 'undefined' || seen.has(id)) return false;
                        seen.add(id);
                        return true;
                    });

                    if (category === "All" && validHistory.length > 0) {
                        return (
                            <div className="animate-fade-in-up">
                                <div className="flex items-center gap-2 mb-4 text-white/60 text-sm font-bold tracking-widest uppercase">
                                    <History size={14} /> Recently Played
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                                    {validHistory.slice(0, 5).map((track, i) => {
                                        const trackData = {
                                            id: track.trackId || track.id,
                                            name: track.name,
                                            artists: typeof track.artist === 'string' ? [{ name: track.artist }] : track.artists || [],
                                            album: { images: [{ url: track.image || track.album?.images?.[0]?.url }] },
                                            source: 'spotify'
                                        };
                                        if (!trackData.artists.length && track.artist) trackData.artists = [{ name: track.artist }];
                                        return <SongCard key={i} track={trackData} context={[]} />;
                                    })}
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Made For You (Mixes) - Always show something */}
                {category === "All" && (
                    <div className="animate-fade-in-up delay-100">
                        <div className="flex items-center gap-2 mb-4 text-white/60 text-sm font-bold tracking-widest uppercase">
                            Made For You
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                            {(personalizedMixes.length > 0 ? personalizedMixes : [
                                // Fallback Mixes if no history
                                { title: "Daily Mix 1", subtitle: "Just for you", image: newReleases[0]?.images[0]?.url, tracks: newReleases.slice(0, 10) },
                                { title: "Discover Weekly", subtitle: "New music updated every Monday", image: newReleases[1]?.images[0]?.url, tracks: newReleases.slice(5, 15) },
                                { title: "On Repeat", subtitle: "songs you love right now", image: newReleases[2]?.images[0]?.url, tracks: newReleases.slice(2, 12) },
                                { title: "Release Radar", subtitle: "Catch up on the latest releases", image: newReleases[3]?.images[0]?.url, tracks: newReleases.slice(0, 5) }
                            ]).slice(0, 4).map((mix, i) => (
                                <div onClick={() => playMix(mix)} key={i} className="group relative cursor-pointer">
                                    <div className="aspect-square rounded-lg md:rounded-xl overflow-hidden shadow-lg mb-3 relative bg-[#18181b]">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                        {mix.image && <img src={mix.image} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay group-hover:scale-110 transition-transform duration-700" alt={mix.title} />}

                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            <span className="font-black text-white text-xl md:text-3xl text-center leading-none drop-shadow-lg uppercase break-words w-full">
                                                {mix.title?.replace('Mix', '') || 'Daily'}<br /><span className="text-white/60 text-base md:text-xl">MIX</span>
                                            </span>
                                        </div>

                                        {/* Play Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex justify-end bg-gradient-to-t from-black/60 to-transparent">
                                            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform">
                                                <Play fill="white" size={20} className="ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-white font-bold text-sm truncate">{mix.title}</h3>
                                    <p className="text-gray-400 text-xs line-clamp-1">{mix.subtitle}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Time-Based Recommendations */}
                {category === "All" && timeBasedContent.items && (
                    <div className="animate-fade-in-up delay-150">
                        <div className="flex items-center gap-2 mb-4 text-white/60 text-sm font-bold tracking-widest uppercase">
                            {timeBasedContent.title}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                            {timeBasedContent.items.map(album => {
                                // Normalize for SongCard (Playlists)
                                const trackData = {
                                    id: album.id,
                                    name: album.name,
                                    artists: [{ name: 'Playlist' }],
                                    album: album,
                                    image: album.images[0]?.url,
                                    source: 'spotify'
                                };
                                return <SongCard key={album.id} track={trackData} context={[]} />;
                            })}
                        </div>
                    </div>
                )}

                {/* More Like [Artist] Playlist/Section */}
                {category === "All" && similarToArtistContent && (
                    <div className="animate-fade-in-up delay-200">
                        <div className="flex items-center gap-2 mb-4 text-white/60 text-sm font-bold tracking-widest uppercase">
                            {similarToArtistContent.title}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                            {similarToArtistContent.items.map(album => {
                                const trackData = {
                                    id: album.id,
                                    name: album.name,
                                    artists: [{ name: 'Similar' }],
                                    album: album,
                                    image: album.images[0]?.url,
                                    source: 'spotify'
                                };
                                return <SongCard key={album.id} track={trackData} context={[]} />;
                            })}
                        </div>
                    </div>
                )}

                {/* New Releases / Category Content */}
                <div className="animate-fade-in-up delay-200">
                    <div className="flex items-center gap-2 mb-4 text-white/60 text-sm font-bold tracking-widest uppercase">
                        {category === "All" ? "New Releases" : (category === "Songs" ? "Top Songs" : "Top Picks")}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                        {(category === "All" ? newReleases.slice(0, 10) : categoryContent).map(album => {
                            const trackData = {
                                id: album.id,
                                name: album.name,
                                album: album,
                                artists: album.artists,
                                preview_url: null,
                                source: 'spotify'
                            };
                            return <SongCard key={album.id} track={trackData} context={[]} />;
                        })}
                    </div>
                </div>

                {/* Bottom Spacer for Mobile Nav/Player */}
                <div className="h-24 md:h-0"></div>
            </div>
        </div>
    );
};

export default Home;
