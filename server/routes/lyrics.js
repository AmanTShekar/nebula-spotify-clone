import express from 'express';
import lyricsFinder from 'lyrics-finder';
import axios from 'axios';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { artist, track } = req.query;
        if (!artist || !track) return res.status(400).json({ error: 'Artist and track required' });

        // 1. Try lyrics-finder (Google scraping)
        let lyrics = await lyricsFinder(artist, track);

        // 2. Fallback to lyrics.ovh
        if (!lyrics) {
            try {
                const ovhRes = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`);
                if (ovhRes.data.lyrics) lyrics = ovhRes.data.lyrics;
            } catch (e) {
                // Ignore ovh error
            }
        }

        res.json({ lyrics: lyrics || 'Lyrics not found.' });
    } catch (err) {
        console.error("Lyrics Error:", err);
        res.status(500).json({ error: 'Failed to fetch lyrics' });
    }
});

export default router;
