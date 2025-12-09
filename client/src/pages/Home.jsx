import { useEffect, useState } from 'react';
import axios from 'axios';
import SongCard from '../components/SongCard';
import Loader from '../components/Loader';
import { Play, History } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const Home = () => {
    const [newReleases, setNewReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const { recentTracks, playTrack } = usePlayer();

    useEffect(() => {
        const fetchNewReleases = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/spotify/new-releases`);
                setNewReleases(res.data.albums.items);
            } catch (err) {
                console.error(err);
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

    const [category, setCategory] = useState("All");
    const [personalizedMixes, setPersonalizedMixes] = useState([]);

    // Expanded Categories
    const categories = ["All", "English", "Hindi", "Malayalam", "Tamil", "Podcasts"];

    useEffect(() => {
        // Reset state on category change (optional, but good for UX)
    }, [category]);

    const displayContent = () => {
        if (category === "All") return newReleases;
        // Basic filtered (Simulated for New Releases based on locale - in real app, query API)
        // For this implementation, we will actually fetch if category != All in a new effect?
        // Let's do it simply: We will render "New Releases" always but maybe filter? 
        // Actually, user wants "Language Categories" to work.
        return newReleases;
    };

    // Fetch Category Content
    const [categoryContent, setCategoryContent] = useState([]);
    useEffect(() => {
        const fetchCategoryContent = async () => {
            if (category === "All" || category === "Podcasts") {
                setCategoryContent([]); // Use default
                return;
            }
            try {
                // Search for playlists/tracks in that language
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/spotify/search`, {
                    params: { q: `${category} songs`, type: 'album,playlist' }
                });
                if (res.data.albums) setCategoryContent(res.data.albums.items);
                else if (res.data.playlists) setCategoryContent(res.data.playlists.items);
            } catch (err) {
                console.error("Category fetch failed", err);
            }
        };
        fetchCategoryContent();
    }, [category]);

    // Generate Personalization (Discover Weekly & Artist Mixes)
    useEffect(() => {
        const generateMixes = async () => {
            const mixes = [];

            // 1. Artist Mixes (Existing)
            if (recentTracks && recentTracks.length > 0) {
                const uniqueArtists = [...new Set(recentTracks.map(t => t.artists?.[0]?.name).filter(Boolean))].slice(0, 5);

                for (const artist of uniqueArtists.slice(0, 3)) {
                    try {
                        const res = await axios.get(`${import.meta.env.VITE_API_URL}/spotify/search`, {
                            params: { q: `artist:${artist}`, type: 'track', limit: 10 }
                        });
                        if (res.data.tracks?.items?.length > 0) {
                            mixes.push({
                                title: `${artist} Mix`,
                                subtitle: `Hits by ${artist} and more`,
                                tracks: res.data.tracks.items,
                                image: res.data.tracks.items[0].album.images[0].url,
                                type: 'artist'
                            });
                        }
                    } catch (e) { }
                }
            }

            // 2. Discover Weekly (Algorithm based on recent history or seeds)
            try {
                let seed_tracks = "";
                let seed_artists = "";

                if (recentTracks && recentTracks.length > 0) {
                    // Use up to 3 recent track IDs as seeds
                    seed_tracks = recentTracks.slice(0, 3).map(t => t.id).join(',');
                    // If seeds are not valid spotify IDs (e.g. youtube), fallback to search or new releases seeds
                }

                // Fallback seeds from new releases if history is empty or invalid seeds
                if (!seed_tracks && newReleases.length > 0) {
                    seed_tracks = newReleases.slice(0, 2).map(a => a.id).join(','); // Note: Album IDs might not work for track seeds, but let's try or use artists
                    seed_artists = newReleases.slice(0, 2).map(a => a.artists[0].id).join(',');
                }

                if (seed_tracks || seed_artists) {
                    const recRes = await axios.get(`${import.meta.env.VITE_API_URL}/spotify/recommendations`, {
                        params: {
                            seed_tracks: seed_tracks || undefined,
                            seed_artists: seed_artists || undefined,
                            limit: 20
                        }
                    });

                    if (recRes.data.tracks?.length > 0) {
                        mixes.unshift({
                            title: "Discover Weekly",
                            subtitle: "New music updated for you",
                            tracks: recRes.data.tracks,
                            image: "https://misc.scdn.co/liked-songs/liked-songs-300.png", // Or dynamic image
                            type: 'discover'
                        });
                    }
                }
            } catch (e) {
                console.error("Discover seed failed", e);
            }

            setPersonalizedMixes(mixes);
        };

        if (newReleases.length > 0) {
            generateMixes();
        }
    }, [recentTracks, newReleases]);

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
        <div className="min-h-full pb-20 md:pb-32">
            {/* Category Pills */}
            <div className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md px-4 md:px-8 py-3 md:py-4 flex gap-2 md:gap-3 transition-all duration-300 overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 whitespace-nowrap ${category === cat ? 'bg-white text-black scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Hero Section - Only on All */}
            {category === "All" && featuredAlbum && (
                <div className="relative h-[400px] w-full p-4 md:p-8 flex items-end overflow-hidden group animate-fade-in">
                    <div className="absolute inset-0">
                        <img src={featuredAlbum.images[0].url} className="w-full h-full object-cover blur-3xl opacity-50 scale-110 group-hover:scale-100 transition-transform duration-[2s]" alt="Hero Background" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f16] via-[#0f0f16]/40 to-transparent"></div>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-end w-full max-w-7xl mx-auto">
                        <img src={featuredAlbum.images[0].url} className="w-32 h-32 md:w-64 md:h-64 shadow-2xl rounded-xl md:rounded-2xl rotate-0 group-hover:rotate-3 transition-all duration-500 ease-out" alt="Featured Album" />
                        <div className="mb-2 md:mb-4 flex-1">
                            <span className="inline-block px-2 md:px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] md:text-xs font-bold tracking-widest mb-2 md:mb-4 border border-white/20 text-indigo-300">FEATURED RELEASE</span>
                            <h1 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-2 md:mb-4 text-white drop-shadow-2xl line-clamp-2 leading-tight">{featuredAlbum.name}</h1>
                            <p className="text-sm md:text-xl lg:text-2xl text-gray-200 mb-4 md:mb-8 font-medium">{featuredAlbum.artists.map(a => a.name).join(', ')}</p>
                            <div className="flex flex-wrap gap-2 md:gap-4">
                                <button
                                    onClick={handlePlayFeatured}
                                    className="bg-white text-black font-bold py-2 px-6 md:py-3 md:px-8 lg:py-4 lg:px-10 rounded-full hover:scale-105 transition shadow-xl shadow-white/10 flex items-center gap-2 text-sm md:text-base"
                                >
                                    <Play fill="black" size={20} className="md:w-6 md:h-6" /> Play Now
                                </button>
                                <button className="hidden md:flex bg-white/5 text-white font-bold py-3 px-8 lg:py-4 lg:px-10 rounded-full hover:bg-white/10 transition border border-white/10 backdrop-blur-md">
                                    Save to Library
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 md:p-8 max-w-8xl mx-auto space-y-8 md:space-y-12">
                {category === "All" && <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white/90">{greeting()}</h2>}
                {category !== "All" && <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white/90">{category}</h2>}

                {/* Recently Played Section */}
                {category === "All" && recentTracks && recentTracks.length > 0 && (
                    <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-white/80 border-l-4 border-pink-500 pl-3 md:pl-4 flex items-center gap-2">
                            <History size={24} className="md:w-7 md:h-7" /> Recently Played
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                            {recentTracks.slice(0, 5).map(track => (
                                <SongCard key={`recent-${track.id}`} track={track} context={recentTracks} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Made For You - Personalization */}
                {category === "All" && personalizedMixes.length > 0 && (
                    <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-white/80 border-l-4 border-emerald-500 pl-3 md:pl-4">Made For You</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                            {personalizedMixes.map((mix, i) => (
                                <div onClick={() => playMix(mix)} key={i} className="glass-card p-3 md:p-4 rounded-xl group cursor-pointer relative hover:-translate-y-2 transition-transform">
                                    <div className="relative shadow-lg mb-3 md:mb-4 rounded-lg overflow-hidden aspect-square bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                                        {mix.image ? (
                                            <img src={mix.image} alt={mix.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : <span className="text-2xl md:text-4xl font-black text-white/20 italic tracking-tighter">MIX {i + 1}</span>}
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                        <button className="absolute bottom-2 right-2 bg-green-500 text-black rounded-full p-2 md:p-3 shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-20">
                                            <Play fill="black" size={16} className="md:w-5 md:h-5 ml-0.5" />
                                        </button>
                                    </div>
                                    <h3 className="text-white font-bold truncate mb-1 text-sm md:text-base">{mix.title}</h3>
                                    <p className="text-gray-400 text-xs md:text-sm line-clamp-2">{mix.subtitle}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fallback Made For You if empty logic could go here */}

                {/* Content Sections */}
                {category === "All" ? (
                    <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-white/80 border-l-4 border-indigo-500 pl-3 md:pl-4">New Releases</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                            {newReleases.slice(1, 11).map(album => {
                                const trackData = {
                                    id: album.id,
                                    name: album.name,
                                    album: album,
                                    artists: album.artists,
                                    preview_url: null,
                                    source: 'spotify'
                                };
                                const context = newReleases.slice(1, 11).map(a => ({
                                    id: a.id,
                                    name: a.name,
                                    album: a,
                                    artists: a.artists,
                                    preview_url: null,
                                    source: 'spotify'
                                }));

                                return (
                                    <SongCard key={album.id} track={trackData} context={context} />
                                );
                            })}
                        </div>
                    </div>
                ) : categoryContent.length > 0 ? (
                    <div className="animate-fade-in-up">
                        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-white/80 pl-3 md:pl-4">{category} Hits</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                            {categoryContent.map(album => {
                                const trackData = {
                                    id: album.id,
                                    name: album.name,
                                    album: album,
                                    artists: album.artists,
                                    preview_url: null,
                                    source: 'spotify'
                                };
                                const context = categoryContent.map(a => ({
                                    id: a.id,
                                    name: a.name,
                                    album: a,
                                    artists: a.artists,
                                    preview_url: null,
                                    source: 'spotify'
                                }));
                                return <SongCard key={album.id} track={trackData} context={context} />;
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        {category === "Podcasts" ? "Coming Soon..." : "Loading content..."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
