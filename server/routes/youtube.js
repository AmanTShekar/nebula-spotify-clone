import express from 'express';
import yts from 'yt-search';
import ytdl from '@distube/ytdl-core';
import axios from 'axios';

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

        // Configure ytdl with agent to bypass 403 errors
        const agent = ytdl.createAgent(undefined, {
            localAddress: undefined
        });

        const info = await ytdl.getInfo(videoUrl, {
            agent,
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            }
        });

        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

        if (!format) return res.status(404).json({ message: 'No audio format found' });

        const mimeType = format.mimeType || 'audio/mp3';
        const streamUrl = format.url;

        // Proxy using Axios with headers to mimic browser
        try {
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.youtube.com/',
                'Accept': '*/*',
            };

            // Forward Range header if present
            if (req.headers.range) {
                headers['Range'] = req.headers.range;
            }

            const response = await axios({
                method: 'get',
                url: streamUrl,
                headers: headers,
                responseType: 'stream',
                validateStatus: status => status >= 200 && status < 300 || status === 206 // parsing behavior
            });

            res.setHeader('Content-Type', response.headers['content-type'] || mimeType);
            res.setHeader('Accept-Ranges', 'bytes');

            if (response.headers['content-length']) {
                res.setHeader('Content-Length', response.headers['content-length']);
            }
            if (response.headers['content-range']) {
                res.setHeader('Content-Range', response.headers['content-range']);
                res.status(206);
            }

            console.log(`Proxying ${videoId} [${response.status}] ${response.headers['content-type']}`);

            response.data.pipe(res);

        } catch (proxyError) {
            console.error('Proxy Error:', proxyError.message);
            console.error('Proxy Error Status:', proxyError.response?.status);
            if (!res.headersSent) {
                res.status(502).json({
                    error: 'Audio Proxy Failed',
                    message: proxyError.message,
                    status: proxyError.response?.status
                });
            }
        }

    } catch (err) {
        console.error("Audio Route Error:", err.message);
        console.error("Error stack:", err.stack);
        if (!res.headersSent) {
            res.status(500).json({
                error: err.message,
                type: err.name,
                stack: err.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines only
            });
        }
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
