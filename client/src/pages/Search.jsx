import { useState, useEffect } from 'react';
import axios from 'axios';
import SongCard from '../components/SongCard';
import Loader from '../components/Loader';
import { Search as SearchIcon, X, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const SkeletonCard = () => (
    <div className="bg-white/5 p-4 rounded-xl flex flex-col gap-3 animate-pulse border border-white/5">
        <div className="w-full aspect-square bg-white/10 rounded-lg"></div>
        <div className="flex flex-col gap-2">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
    </div>
);

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('song');

    const [history, setHistory] = useState([]);
    const { token } = useAuth();

    // Fetch Search History
    useEffect(() => {
        if (token) {
            axios.get(`${import.meta.env.VITE_API_URL}/user/history`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => setHistory(res.data)).catch(err => {
                if (err.response && err.response.status !== 400) console.error(err);
            });
        }
    }, [token]);

    // Handle Suggestions
    useEffect(() => {
        const fetchSuggestions = setTimeout(async () => {
            if (query && query.length > 1 && showSuggestions) {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/youtube/suggestions`, {
                        params: { q: query }
                    });
                    setSuggestions(res.data.suggestions || []);
                } catch (err) {
                    console.error(err);
                }
            } else {
                setSuggestions([]);
            }
        }, 200);

        return () => clearTimeout(fetchSuggestions);
    }, [query, showSuggestions]);

    // Main Search (Debounced)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query) {
                setLoading(true);
                if (token && query.length > 2) {
                    axios.post(`${import.meta.env.VITE_API_URL}/user/history`, { query }, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(res => setHistory(res.data)).catch(err => {
                        if (err.response && err.response.status !== 400) console.error(err);
                    });
                }

                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/youtube/search`, {
                        params: { q: query, type: activeFilter }
                    });
                    setResults(res.data.tracks.items.map(t => ({ ...t, source: 'youtube' })));
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, activeFilter, token]);

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        setShowSuggestions(false);
    };

    const categories = [
        { name: 'Pop', color: 'from-purple-600 to-blue-600', img: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=400&q=80' },
        { name: 'Hip-Hop', color: 'from-orange-500 to-red-600', img: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&q=80' },
        { name: 'Rock', color: 'from-red-600 to-pink-700', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80' },
        { name: 'Indie', color: 'from-green-500 to-emerald-700', img: 'https://images.unsplash.com/photo-1459749411177-0473ef71607b?w=400&q=80' },
        { name: 'Chill', color: 'from-blue-400 to-cyan-600', img: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&q=80' },
        { name: 'Jazz', color: 'from-yellow-500 to-amber-700', img: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&q=80' },
        { name: 'Electronic', color: 'from-pink-500 to-purple-600', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80' },
        { name: 'Classical', color: 'from-indigo-500 to-violet-700', img: 'https://images.unsplash.com/photo-1507838153414-b4b713384ebd?w=400&q=80' },
    ];

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'song', label: 'Songs' },
        { id: 'video', label: 'Videos' },
    ];

    return (
        <div className="px-4 md:px-8 pb-20 md:pb-32">
            <div className="sticky top-0 bg-[#0f0f16]/80 backdrop-blur-xl pt-3 md:pt-6 pb-3 md:pb-6 z-30 -mx-4 md:-mx-8 px-4 md:px-8 mb-4 md:mb-6 border-b border-white/5 shadow-2xl">
                <div className="relative max-w-2xl mx-auto">
                    <div className="absolute inset-y-0 left-3 md:left-4 flex items-center pointer-events-none">
                        <SearchIcon className="text-gray-400" size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="What do you want to listen to?"
                        className="w-full py-3 md:py-4 pl-10 md:pl-12 pr-10 md:pr-12 rounded-full bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/15 transition-all shadow-inner border border-white/5 backdrop-blur-md text-sm md:text-base"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        autoComplete="off"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors active:scale-95">
                            <X size={18} />
                        </button>
                    )}

                    {/* Search Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full mt-2 md:mt-4 left-0 right-0 glass-card bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-fade-in-down max-h-[60vh] overflow-y-auto">
                            <div className="p-1 md:p-2">
                                {suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleSuggestionClick(s)}
                                        className="px-3 md:px-4 py-2 md:py-3 hover:bg-white/10 rounded-xl cursor-pointer flex items-center gap-3 md:gap-4 transition-colors group active:scale-95"
                                    >
                                        <Sparkles size={14} className="text-indigo-400 group-hover:text-pink-400 transition-colors md:w-4 md:h-4" />
                                        <span className="text-gray-200 text-xs md:text-sm font-bold group-hover:text-white">{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {query && (
                    <div className="flex justify-center gap-2 md:gap-3 mt-4 md:mt-6 overflow-x-auto pb-2 no-scrollbar">
                        {filters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id)}
                                className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 border whitespace-nowrap ${activeFilter === f.id
                                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {query ? (
                <div className="animate-fade-in">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-white flex items-center gap-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">Search Results</span>
                    </h2>
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                            {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                            {results.length > 0 ? results.map(track => (
                                <SongCard key={track.id} track={track} context={results} />
                            )) : (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500">
                                    <SearchIcon size={40} className="mb-4 opacity-50 md:w-12 md:h-12" />
                                    <p className="text-sm md:text-lg font-medium">No results found for "{query}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-fade-in">
                    {history.length > 0 && (
                        <div className="mb-8 md:mb-12">
                            <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-white/90 flex items-center gap-2">
                                <TrendingUp size={18} className="text-indigo-400 md:w-5 md:h-5" /> Recent Searches
                            </h2>
                            <div className="flex gap-2 md:gap-4 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
                                {history.map((h, i) => (
                                    <div key={i} onClick={() => setQuery(h.query)} className="glass px-4 md:px-6 py-2 md:py-3 rounded-full hover:bg-white/10 cursor-pointer transition whitespace-nowrap group hover:border-white/20 border border-transparent active:scale-95">
                                        <span className="font-semibold text-gray-200 group-hover:text-white text-xs md:text-sm">{h.query}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-8 text-white">Browse Categories</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {categories.map((cat) => (
                            <div key={cat.name} onClick={() => setQuery(cat.name)} className={`relative h-32 md:h-48 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-500 group border border-white/5 active:scale-95`}>
                                <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 group-hover:rotate-2 transition-transform duration-700" />
                                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-60 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-70`} />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
                                <span className="absolute bottom-2 md:bottom-4 left-2 md:left-4 font-black text-xl md:text-3xl text-white tracking-tighter drop-shadow-lg transform translation-all duration-300 group-hover:translate-x-1 md:group-hover:translate-x-2 group-hover:-translate-y-1 md:group-hover:-translate-y-2">{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
