import express from 'express';
import lyricsFinder from 'lyrics-finder';
import axios from 'axios';

const router = express.Router();

// Helper to normalize text for comparison or logging
const normalize = (str) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

router.get('/', async (req, res) => {
    try {
        const { artist, track } = req.query;
        if (!artist || !track) return res.status(400).json({ error: 'Artist and track required' });

        // Cleaning Logic
        const cleanTrack = track
            .replace(/[\(\[](official video|lyric video|music video|official audio|audio|video|hq|hd|4k|remastered|remaster|live|performance|official|ft\.|feat\.)[\)\]]/gi, '')
            .replace(/[\(\[].*?[\)\]]/g, '') // Remove bits in brackets
            .replace(/\s+/g, ' ')
            .trim();

        const cleanArtist = artist
            .replace(/ - Topic$/, '')
            .split(',')[0] // Take first artist if multiple
            .trim();

        console.log(`Searching lyrics for: ${cleanArtist} - ${cleanTrack}`);

        let lyrics = null;

        // Strategy 1: LrcLib (High quality, open API)
        // We try both exact get and search
        if (!lyrics) {
            try {
                // Try fuzzy search first
                const searchRes = await axios.get('https://lrclib.net/api/search', {
                    params: { q: `${cleanArtist} ${cleanTrack}` }
                });

                if (searchRes.data && searchRes.data.length > 0) {
                    // Find best match? Just take first for now or filter
                    lyrics = searchRes.data[0].plainLyrics || searchRes.data[0].syncedLyrics;
                }
            } catch (e) {
                console.warn('LrcLib search failed:', e.message);
            }
        }

        // Strategy 2: lyrics-finder (Google scraping)
        if (!lyrics) {
            try {
                // Try with cleaned names
                lyrics = await lyricsFinder(cleanArtist, cleanTrack);
            } catch (e) { console.warn('lyrics-finder cleaned failed'); }
        }

        if (!lyrics) {
            try {
                // Try with original names (sometimes cleaning removes too much or weirdly)
                lyrics = await lyricsFinder(artist, track);
            } catch (e) { console.warn('lyrics-finder original failed'); }
        }

        // Strategy 3: lyrics.ovh
        if (!lyrics) {
            try {
                const ovhRes = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTrack)}`);
                if (ovhRes.data.lyrics) lyrics = ovhRes.data.lyrics;
            } catch (e) {
                // Ignore
            }
        }

        if (lyrics) {
            console.log('Lyrics found!');
            res.json({ lyrics });
        } else {
            console.log('No lyrics found.');
            res.json({ lyrics: 'Lyrics not found.' });
        }

    } catch (err) {
        console.error("Lyrics Error:", err);
        res.status(500).json({ error: 'Failed to fetch lyrics' });
    }
});

export default router;
