import express from 'express';
import axios from 'axios';
import yts from 'yt-search';
import { getSpotifyToken } from '../services/spotify.js';
import { MOCK_NEW_RELEASES, MOCK_RECOMMENDATIONS } from '../data/mockData.js';

const router = express.Router();

// Middleware to add Spotify Token (with Soft Fail)
const withSpotifyToken = async (req, res, next) => {
    try {
        const token = await getSpotifyToken();
        req.spotifyToken = token;
        req.mockMode = false;
        next();
    } catch (error) {
        console.warn("Spotify Token Failed - Switching to Mock Mode");
        req.mockMode = true; // Flag to use mock data
        next();
    }
};

// Search
router.get('/search', withSpotifyToken, async (req, res) => {
    const { q, type = 'track,artist,album' } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

    const fetchYouTubeSearch = async (query) => {
        try {
            console.log(`Searching YouTube for: ${query}`);
            const r = await yts(query);
            const videos = r.videos.slice(0, 20).map(v => ({
                id: v.videoId,
                name: v.title,
                artists: [{ name: v.author.name, id: v.author.url }],
                album: { images: [{ url: v.thumbnail }] },
                duration_ms: v.seconds * 1000,
                source: 'youtube'
            }));
            return { tracks: { items: videos } };
        } catch (e) {
            console.error("YT Search Failed", e);
            return { tracks: { items: [] } };
        }
    };

    if (req.mockMode) {
        const data = await fetchYouTubeSearch(q);
        return res.json(data);
    }

    try {
        const response = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
            params: { q, type, limit: 20 },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Spotify Search Error:', error.response?.data || error.message);
        // Fallback to YouTube
        const data = await fetchYouTubeSearch(q);
        res.json(data);
    }
});

// New Releases (Home Page)
router.get('/new-releases', withSpotifyToken, async (req, res) => {
    const fetchYouTubeFallback = async () => {
        try {
            const r = await yts({ query: 'latest hit songs 2024 music', category: 'music' });
            let items = r.videos.slice(0, 20).map(v => ({
                id: v.videoId,
                name: v.title,
                artists: [{ name: v.author.name, id: v.author.url }],
                images: [{ url: v.thumbnail }],
                album_type: 'single',
                total_tracks: 1,
                release_date: v.ago,
                source: 'youtube'
            }));

            // Force static YouTube content if search returns nothing (Safety Net)
            if (items.length === 0) {
                items = [
                    { id: '39gjn8I97uk', name: 'Billie Eilish - CHIHIRO', artists: [{ name: 'Billie Eilish' }], images: [{ url: 'https://i.ytimg.com/vi/39gjn8I97uk/hqdefault.jpg' }], source: 'youtube', album_type: 'single' },
                    { id: '2Vv-BfVoq4g', name: 'Ed Sheeran - Perfect', artists: [{ name: 'Ed Sheeran' }], images: [{ url: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg' }], source: 'youtube', album_type: 'single' },
                    { id: 'JGwWNGJdvx8', name: 'Ed Sheeran - Shape of You', artists: [{ name: 'Ed Sheeran' }], images: [{ url: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' }], source: 'youtube', album_type: 'single' }
                ];
            }

            return { albums: { items } };
        } catch (e) {
            console.error("YouTube Fallback Failed:", e);
            // Emergency Static List
            const items = [
                { id: '39gjn8I97uk', name: 'Billie Eilish - CHIHIRO', artists: [{ name: 'Billie Eilish' }], images: [{ url: 'https://i.ytimg.com/vi/39gjn8I97uk/hqdefault.jpg' }], source: 'youtube', album_type: 'single' },
                { id: '2Vv-BfVoq4g', name: 'Ed Sheeran - Perfect', artists: [{ name: 'Ed Sheeran' }], images: [{ url: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg' }], source: 'youtube', album_type: 'single' }
            ];
            return { albums: { items } };
        }
    };

    try {
        if (req.mockMode) {
            console.log("Serving YouTube Fallback for New Releases");
            const data = await fetchYouTubeFallback();
            return res.json(data);
        }

        const response = await axios.get(`https://api.spotify.com/v1/browse/new-releases`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
            params: { limit: 20, country: 'US' },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Spotify New Releases Error:', error.response?.data || error.message);
        console.log("Serving YouTube Fallback (API Error)");
        const data = await fetchYouTubeFallback();
        res.json(data);
    }
});

// Get Track Details
router.get('/track/:id', withSpotifyToken, async (req, res) => {
    if (req.mockMode) {
        // Return 1st mock track details with ID matched if possible, else random
        const track = MOCK_RECOMMENDATIONS.tracks.find(t => t.id === req.params.id) || MOCK_RECOMMENDATIONS.tracks[0];
        return res.json(track);
    }
    try {
        const { id } = req.params;
        const response = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
        });
        res.json(response.data);
    } catch (error) {
        console.error('Spotify Track Error:', error.response?.data || error.message);
        // Fallback
        const track = MOCK_RECOMMENDATIONS.tracks.find(t => t.id === req.params.id) || MOCK_RECOMMENDATIONS.tracks[0];
        res.json(track);
    }
});

// Get Recommendations
router.get('/recommendations', withSpotifyToken, async (req, res) => {
    if (req.mockMode) {
        return res.json(MOCK_RECOMMENDATIONS);
    }
    try {
        const { seed_tracks, seed_artists, limit = 10 } = req.query;
        // if (!seed_tracks && !seed_artists) return res.status(400).json({ error: 'Seed tracks or artists required' });

        const response = await axios.get(`https://api.spotify.com/v1/recommendations`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
            params: {
                seed_tracks,
                seed_artists,
                limit,
                min_popularity: 30
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Spotify Recommendations Error:', error.response?.data || error.message);
        // FALLBACK
        res.json(MOCK_RECOMMENDATIONS);
    }
});

// Get Artist Details
router.get('/artist/:id', withSpotifyToken, async (req, res) => {
    if (req.mockMode) {
        return res.json({ name: 'Mock Artist', images: [] });
    }
    try {
        const { id } = req.params;
        const response = await axios.get(`https://api.spotify.com/v1/artists/${id}`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
        });
        res.json(response.data);
    } catch (error) {
        console.error('Spotify Artist Error:', error.response?.data || error.message);
        res.json({ name: 'Mock Artist', images: [] });
    }
});

// Get Artist Top Tracks
router.get('/artist/:id/top-tracks', withSpotifyToken, async (req, res) => {
    if (req.mockMode) {
        return res.json(MOCK_RECOMMENDATIONS);
    }
    try {
        const { id } = req.params;
        const response = await axios.get(`https://api.spotify.com/v1/artists/${id}/top-tracks`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
            params: { market: 'US' } // Market is required for top tracks
        });
        res.json(response.data);
    } catch (error) {
        console.error('Spotify Artist Top Tracks Error:', error.response?.data || error.message);
        res.json(MOCK_RECOMMENDATIONS);
    }
});

export default router;
