import express from 'express';
import yts from 'yt-search';
import { MOCK_NEW_RELEASES, MOCK_RECOMMENDATIONS } from '../data/mockData.js';

const router = express.Router();

// Search using YouTube
router.get('/search', async (req, res) => {
    const { q, type } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

    try {
        console.log(`Searching YouTube for: ${q} [Type: ${type || 'all'}]`);
        const r = await yts(q);

        const response = {};

        // Handle Playlists
        if (type === 'playlist' || !type) {
            const playlists = (r.playlists || r.lists || []).slice(0, 20).map(p => ({
                id: p.listId,
                name: p.title,
                images: [{ url: p.thumbnail }],
                description: `By ${p.author?.name || 'Unknown'} • ${p.videoCount} songs`,
                owner: { display_name: p.author?.name },
                tracks: { total: p.videoCount },
                type: 'playlist',
                source: 'youtube'
            }));
            response.playlists = { items: playlists };
        }

        // Handle Tracks (Videos)
        if (type === 'video' || type === 'track' || !type) {
            const videos = r.videos.slice(0, 20).map(v => ({
                id: v.videoId,
                name: v.title,
                artists: [{ name: v.author?.name || 'Unknown', id: v.author?.url }],
                album: { images: [{ url: v.thumbnail }] }, // Use video thumbnail as 'album art'
                duration_ms: v.seconds * 1000,
                source: 'youtube',
                type: 'track'
            }));
            response.tracks = { items: videos };
        }

        // Handle Artists (Channels)
        if (type === 'artist') {
            const artists = (r.channels || []).slice(0, 10).map(c => ({
                id: c.name, // YouTube doesn't give clean IDs always, use name or url
                name: c.name,
                images: [{ url: c.image }],
                followers: { total: c.subscribers },
                type: 'artist',
                source: 'youtube'
            }));
            response.artists = { items: artists };
        }

        res.json(response);
    } catch (e) {
        console.error("YouTube Search Failed", e);
        res.json({ tracks: { items: [] }, playlists: { items: [] } });
    }
});

// New Releases (Home Page) using YouTube
router.get('/new-releases', async (req, res) => {
    try {
        console.log("Fetching new releases from YouTube");
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

        // Fallback to static content if search returns nothing
        if (items.length === 0) {
            items = [
                { id: '39gjn8I97uk', name: 'Billie Eilish - CHIHIRO', artists: [{ name: 'Billie Eilish' }], images: [{ url: 'https://i.ytimg.com/vi/39gjn8I97uk/hqdefault.jpg' }], source: 'youtube', album_type: 'single' },
                { id: '2Vv-BfVoq4g', name: 'Ed Sheeran - Perfect', artists: [{ name: 'Ed Sheeran' }], images: [{ url: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg' }], source: 'youtube', album_type: 'single' },
                { id: 'JGwWNGJdvx8', name: 'Ed Sheeran - Shape of You', artists: [{ name: 'Ed Sheeran' }], images: [{ url: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' }], source: 'youtube', album_type: 'single' }
            ];
        }

        res.json({ albums: { items } });
    } catch (e) {
        console.error("YouTube Fallback Failed:", e);
        // Emergency Static List
        const items = [
            { id: '39gjn8I97uk', name: 'Billie Eilish - CHIHIRO', artists: [{ name: 'Billie Eilish' }], images: [{ url: 'https://i.ytimg.com/vi/39gjn8I97uk/hqdefault.jpg' }], source: 'youtube', album_type: 'single' },
            { id: '2Vv-BfVoq4g', name: 'Ed Sheeran - Perfect', artists: [{ name: 'Ed Sheeran' }], images: [{ url: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg' }], source: 'youtube', album_type: 'single' }
        ];
        res.json({ albums: { items } });
    }
});

// Get Track Details
router.get('/track/:id', async (req, res) => {
    try {
        // Search YouTube for the track
        const r = await yts({ videoId: req.params.id });
        if (r) {
            const track = {
                id: r.videoId,
                name: r.title,
                artists: [{ name: r.author.name }],
                album: { images: [{ url: r.thumbnail }] },
                duration_ms: r.seconds * 1000,
                source: 'youtube'
            };
            return res.json(track);
        }
    } catch (error) {
        console.error('YouTube Track Error:', error.message);
    }

    // Fallback to mock data
    const track = MOCK_RECOMMENDATIONS.tracks.find(t => t.id === req.params.id) || MOCK_RECOMMENDATIONS.tracks[0];
    res.json(track);
});

// Get Recommendations (Algorithmic)
router.get('/recommendations', async (req, res) => {
    try {
        const { seed_artists, seed_tracks, seed_genres } = req.query;
        let query = 'trending music 2024';

        if (seed_tracks) {
            query = `${seed_tracks} song mix similar`;
        } else if (seed_artists) {
            query = `${seed_artists} artist mix similar`;
        } else if (seed_genres) {
            query = `${seed_genres} music mix`;
        }

        console.log(`Generating recommendations for query: ${query}`);

        // Use YouTube to find a mix or similar songs
        const r = await yts({ query, category: 'music' });

        // Filter out playlists/channels, keep videos
        const validVideos = r.videos.filter(v => v.seconds > 60).slice(0, 15);

        const tracks = validVideos.map(v => ({
            id: v.videoId,
            name: v.title,
            artists: [{ name: v.author.name, id: v.author.url }],
            album: { images: [{ url: v.thumbnail }] },
            duration_ms: v.seconds * 1000,
            source: 'youtube',
            is_recommendation: true // Flag for UI
        }));

        res.json({ tracks });
    } catch (error) {
        console.error('YouTube Recommendations Error:', error.message);
        res.json(MOCK_RECOMMENDATIONS);
    }
});

// Get Artist Details
router.get('/artist/:id', async (req, res) => {
    try {
        // Search for artist on YouTube
        const r = await yts(req.params.id);
        if (r.channels && r.channels.length > 0) {
            const channel = r.channels[0];
            return res.json({
                name: channel.name,
                images: [{ url: channel.image }],
                followers: { total: channel.subscribers }
            });
        }
    } catch (error) {
        console.error('YouTube Artist Error:', error.message);
    }

    res.json({ name: 'Artist', images: [] });
});

// Get Artist Top Tracks
router.get('/artist/:id/top-tracks', async (req, res) => {
    try {
        // Search for artist's popular songs
        const r = await yts(req.params.id + ' popular songs');
        const tracks = r.videos.slice(0, 10).map(v => ({
            id: v.videoId,
            name: v.title,
            artists: [{ name: v.author.name }],
            album: { images: [{ url: v.thumbnail }] },
            duration_ms: v.seconds * 1000,
            source: 'youtube'
        }));
        res.json({ tracks });
    } catch (error) {
        console.error('YouTube Artist Top Tracks Error:', error.message);
        res.json(MOCK_RECOMMENDATIONS);
    }
});

export default router;
