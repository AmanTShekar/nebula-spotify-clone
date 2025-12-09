import express from 'express';
import yts from 'yt-search';
import ytdl from '@distube/ytdl-core';

const router = express.Router();

// Helper to format YouTube Music response
const formatVideo = (video) => ({
    id: video.videoId,
    name: video.title,
    artists: [{ name: video.author.name }],
    album: {
        images: [{ url: video.thumbnail }]
    },
    duration_ms: video.seconds * 1000,
    preview_url: `https://www.youtube.com/watch?v=${video.videoId}`,
    source: 'youtube'
});

// Search YouTube
router.get('/search', async (req, res) => {
    try {
        const { q, type } = req.query;
        if (!q) return res.status(400).json({ message: 'Query is required' });

        const r = await yts(q);
        const videos = r.videos.slice(0, 20).map(formatVideo);

        res.json({ tracks: { items: videos } });

    } catch (err) {
        console.error("YouTube Search Error:", err);
        res.status(500).json({ error: err.message });
    }
});



// Resolve track
router.get('/resolve', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: 'Query is required' });

        const r = await yts(q);
        const song = r.videos[0]; // Get first video result

        if (!song) {
            return res.status(404).json({ message: 'Not found' });
        }

        res.json({
            id: song.videoId,
            song: formatVideo(song),
            url: `https://www.youtube.com/watch?v=${song.videoId}`
        });

    } catch (err) {
        console.error("Resolve Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get audio stream URL
// Note: In a production environment, you should use a robust library like ytdl-core or similar.
// Since we removed ytmusic-api, we switched to ytdl-core.

router.get('/audio', async (req, res) => {
    try {
        const { videoId } = req.query;
        if (!videoId) return res.status(400).json({ message: 'Video ID is required' });

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        const info = await ytdl.getInfo(videoUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

        if (!format) {
            return res.status(404).json({ message: 'No audio format found' });
        }

        res.json({
            audioUrl: format.url,
            duration: parseInt(info.videoDetails.lengthSeconds),
            title: info.videoDetails.title
        });

    } catch (err) {
        console.error("Audio Stream Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get search suggestions
router.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: 'Query is required' });

        // yt-search doesn't have direct suggestions, fallback to search which is close enough for simple usage or just return empty
        // Or implement a simple suggestion using google suggest API if critical
        // For now, return empty to avoid errors
        res.json({ suggestions: [] });


    } catch (err) {
        console.error("Suggestions Error:", err);
        // Don't fail hard, just return empty
        res.json({ suggestions: [] });
    }
});

export default router;
