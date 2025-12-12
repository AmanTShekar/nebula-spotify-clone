import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import authRoutes from './routes/auth.js';
import spotifyRoutes from './routes/spotify.js';
import youtubeRoutes from './routes/youtube.js';
import userRoutes from './routes/user.js';
import lyricsRoutes from './routes/lyrics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Override console.log and error to capture in memory
import { addLog } from './utils/logger.js';
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
    addLog('log', args);
    originalLog.apply(console, args);
};

console.error = (...args) => {
    addLog('error', args);
    originalError.apply(console, args);
};

// Middleware
app.use(cors({ origin: '*' }));
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});
app.use(express.json());

// Database Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/spotify-clone-v4';
mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/lyrics', lyricsRoutes);

app.get('/', (req, res) => {
    res.send('Spotify Clone API is running');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'active', timestamp: new Date() });
});

// Alias for UptimeRobot / external monitors
app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server Updated: Routes Reloaded at ${new Date().toISOString()}`);

    // Self-Healing Health Check (Prevent Render Spin-Down)
    // Pings the public URL if available to register as active traffic
    const HEALTH_CHECK_INTERVAL = 14 * 60 * 1000; // 14 minutes
    setInterval(async () => {
        try {
            // Use Render's external URL if available, otherwise localhost
            const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
            const healthUrl = `${baseUrl}/health`;

            await axios.get(healthUrl, {
                headers: { 'User-Agent': 'Nebula-Self-Health-Check/1.0' }
            });
            // console.log(`[Health-Check] System active calling ${healthUrl}`);
        } catch (err) {
            // console.error('[Health-Check] Failed:', err.message);
        }
    }, HEALTH_CHECK_INTERVAL);
});
