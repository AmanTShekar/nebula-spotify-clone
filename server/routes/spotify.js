import express from 'express';
import axios from 'axios';
import { getSpotifyToken } from '../services/spotify.js';
import { MOCK_NEW_RELEASES } from '../data/mockData.js';

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
    try {
        const { q, type = 'track,artist,album' } = req.query;
        if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

        const response = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
            params: { q, type, limit: 20 },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Spotify Search Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Spotify API Error' });
    }
});

// New Releases (Home Page)
router.get('/new-releases', withSpotifyToken, async (req, res) => {
    try {
        if (req.mockMode) {
            return res.json(MOCK_NEW_RELEASES);
        }

        const response = await axios.get(`https://api.spotify.com/v1/browse/new-releases`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
            params: { limit: 20, country: 'US' },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Spotify New Releases Error:', error.response?.data || error.message);
        // Fallback to mock on API error too
        res.json(MOCK_NEW_RELEASES);
    }
});

// Get Track Details
router.get('/track/:id', withSpotifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
        });
        res.json(response.data);
    } catch (error) {
        console.error('Spotify Track Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Spotify API Error' });
    }
});

// Get Recommendations
router.get('/recommendations', withSpotifyToken, async (req, res) => {
    try {
        const { seed_tracks, seed_artists, limit = 10 } = req.query;
        if (!seed_tracks && !seed_artists) return res.status(400).json({ error: 'Seed tracks or artists required' });

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
        res.status(error.response?.status || 500).json({ error: 'Spotify API Error' });
    }
});

// Get Artist Details
router.get('/artist/:id', withSpotifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://api.spotify.com/v1/artists/${id}`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
        });
        res.json(response.data);
    } catch (error) {
        console.error('Spotify Artist Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Spotify API Error' });
    }
});

// Get Artist Top Tracks
router.get('/artist/:id/top-tracks', withSpotifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://api.spotify.com/v1/artists/${id}/top-tracks`, {
            headers: { Authorization: `Bearer ${req.spotifyToken}` },
            params: { market: 'US' } // Market is required for top tracks
        });
        res.json(response.data);
    } catch (error) {
        console.error('Spotify Artist Top Tracks Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Spotify API Error' });
    }
});

export default router;
