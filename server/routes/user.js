import express from 'express';
import User from '../models/User.js';
import Playlist from '../models/Playlist.js';
import jwt from 'jsonwebtoken';
import { exec } from 'child_process';

const router = express.Router();

// Middleware to verify Token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Debug: Check current token role
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            tokenRole: req.user.role,
            dbRole: user.role,
            match: req.user.role === user.role,
            user: user
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User's Liked Songs
router.get('/likes', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.likedSongs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Profile
router.put('/update-profile', verifyToken, async (req, res) => {
    try {
        const { name, email, image } = req.body;

        // Basic check if email is taken by another user
        if (email) {
            const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existing) return res.status(400).json({ message: 'Email already in use' });
        }

        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (image) updates.image = image;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Like Song
// Toggle Like Song
router.post('/likes', verifyToken, async (req, res) => {
    try {
        const { songId, source = 'spotify', name, artist, image } = req.body;
        const user = await User.findById(req.user.id);

        // Handle legacy string IDs if any exist in DB (optional safety)
        // user.likedSongs = user.likedSongs.filter(s => typeof s !== 'string');

        const index = user.likedSongs.findIndex(s => s.id === songId);

        if (index > -1) {
            user.likedSongs.splice(index, 1);
        } else {
            user.likedSongs.push({ id: songId, source, name, artist, image });
        }

        await user.save();
        res.json(user.likedSongs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Playlist
router.post('/playlists', verifyToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const newPlaylist = new Playlist({
            name,
            description,
            user: req.user.id,
            songs: []
        });
        await newPlaylist.save();
        res.status(201).json(newPlaylist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User Playlists
router.get('/playlists', verifyToken, async (req, res) => {
    try {
        const playlists = await Playlist.find({ user: req.user.id });
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Playlist
router.get('/playlists/:id', verifyToken, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Song to Playlist
router.post('/playlists/:id/add', verifyToken, async (req, res) => {
    try {
        const { songId, name, artist, image, album, duration_ms } = req.body;
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        if (playlist.user.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        // Check for duplicates
        if (!playlist.songs.find(s => s.id === songId)) {
            playlist.songs.push({ id: songId, name, artist, image, album, duration_ms });
            await playlist.save();
        }

        res.json(playlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove Song from Playlist
router.delete('/playlists/:id/songs/:songId', verifyToken, async (req, res) => {
    try {
        const { id, songId } = req.params;
        const playlist = await Playlist.findById(id);

        if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
        if (playlist.user.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        // Filter out the song (handle both object structure and legacy strings)
        playlist.songs = playlist.songs.filter(s => {
            if (typeof s === 'string') return s !== songId;
            return s.id !== songId;
        });

        await playlist.save();
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Search History
router.post('/history', verifyToken, async (req, res) => {
    try {
        const { query } = req.body;
        const user = await User.findById(req.user.id);

        // Remove duplicate if exists and push to top
        user.searchHistory = user.searchHistory.filter(h => h.query !== query);
        user.searchHistory.unshift({ query });

        // Limit to 10 items
        if (user.searchHistory.length > 10) user.searchHistory.pop();

        await user.save();
        res.json(user.searchHistory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Search History
router.get('/history', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.searchHistory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN ROUTES ---

// Middleware to verify Admin
const verifyAdmin = (req, res, next) => {
    const role = req.user.role?.toLowerCase();
    if (role !== 'admin' && role !== 'super-admin') {
        return res.status(403).json({ message: 'Access Denied: Admins Only' });
    }
    next();
};

// Get All Users (Admin)
router.get('/admin/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete User (Admin)
router.delete('/admin/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Stats (Admin)
router.get('/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPlaylists = await Playlist.countDocuments();

        // Aggregate Total Liked Songs
        const likedSongsAgg = await User.aggregate([
            { $project: { count: { $size: "$likedSongs" } } },
            { $group: { _id: null, total: { $sum: "$count" } } }
        ]);
        const totalLikedSongs = likedSongsAgg[0]?.total || 0;

        // User Growth (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // System Stats (Simulated for Demo)
        const uptime = global.serverStartTime ? (Date.now() - global.serverStartTime) / 1000 : process.uptime();
        const systemStats = {
            uptime: uptime,
            memory: process.memoryUsage(),
            platform: process.platform,
            nodeVersion: process.version,
            cpuLoad: Math.round(Math.random() * 30 + 10), // Simulated 10-40%
            gpuLoad: Math.round(Math.random() * 50 + 20), // Simulated 20-70%
            temp: Math.round(Math.random() * 15 + 45)     // Simulated 45-60C
        };

        res.json({
            totalUsers,
            totalPlaylists,
            totalLikedSongs,
            userGrowth,
            systemStats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Playlists (Admin)
router.get('/admin/playlists', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const playlists = await Playlist.find().populate('user', 'name email');
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Maintenance Mode Toggle (Admin)
// In a real app, use a DB config collection. Memory for demo.
let isMaintenanceMode = false;

router.get('/maintenance', (req, res) => {
    res.json({ isMaintenanceMode });
});

router.post('/admin/maintenance', verifyToken, verifyAdmin, (req, res) => {
    isMaintenanceMode = !isMaintenanceMode;
    res.json({ isMaintenanceMode });
});

// Database View (Admin)
router.get('/admin/db/:collection', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { collection } = req.params;
        let data = [];
        if (collection === 'users') {
            data = await User.find().select('-password');
        } else if (collection === 'playlists') {
            data = await Playlist.find();
        } else {
            return res.status(400).json({ error: 'Invalid collection' });
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Playlist (Admin)
router.delete('/admin/playlists/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await Playlist.findByIdAndDelete(req.params.id);
        res.json({ message: 'Playlist deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logs (Admin)
import { getLogs } from '../utils/logger.js';
import SecurityLog from '../models/SecurityLog.js';
import SystemSettings from '../models/SystemSettings.js';

router.get('/admin/logs', verifyToken, verifyAdmin, (req, res) => {
    res.json(getLogs());
});

// --- SECURITY APIs ---

// Get Security Logs
router.get('/admin/security/logs', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const logs = await SecurityLog.find().sort({ createdAt: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get/Init System Settings
router.get('/admin/security/settings', verifyToken, verifyAdmin, async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({});
        }

        // Calculate Threat Level
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const failedAttempts = await SecurityLog.countDocuments({
            status: 'failed',
            createdAt: { $gte: oneHourAgo }
        });

        let threatLevel = 'LOW';
        if (failedAttempts > 20) threatLevel = 'HIGH';
        else if (failedAttempts > 5) threatLevel = 'MEDIUM';

        // Return settings + threatLevel
        res.json({ ...settings.toObject(), threatLevel });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update System Settings
router.post('/admin/security/settings', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const settings = await SystemSettings.findOne();
        if (!settings) return res.status(404).json({ message: 'Settings not initialized' });

        // Update fields if present
        if (req.body.publicRegistration !== undefined) settings.publicRegistration = req.body.publicRegistration;
        if (req.body.requireEmailVerify !== undefined) settings.requireEmailVerify = req.body.requireEmailVerify;

        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rotate API Key
router.post('/admin/security/rotate-key', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const settings = await SystemSettings.findOne();
        settings.rootApiKey = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await settings.save();
        res.json({ newKey: settings.rootApiKey });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SERVER MANAGEMENT APIs ---

// Soft Restart (Reset Stats)
router.post('/admin/server/restart', verifyToken, verifyAdmin, (req, res) => {
    // Reset global logs via logger utility (implies we need an export for clearLogs there)
    // For now, we'll just simulate the uptime reset
    // In a real app, this might trigger a pm2 restart
    global.serverStartTime = Date.now();
    isMaintenanceMode = false;
    res.json({ message: 'Server stats reset successfully.' });
});

// Clear Security Logs
router.post('/admin/security/clear-logs', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await SecurityLog.deleteMany({});
        res.json({ message: 'All security logs cleared.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Emergency Lockdown
router.post('/admin/server/lockdown', verifyToken, verifyAdmin, async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) settings = await SystemSettings.create({});

        settings.publicRegistration = false;
        settings.requireEmailVerify = true;
        await settings.save();

        // Also enable maintenance mode
        isMaintenanceMode = true;

        res.json({ message: 'SERVER LOCKED DOWN. Registration disabled, Maintenance enabled.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remote Terminal (Simulated)
// Remote Terminal (Real System Execution - Safe Subset)
router.post('/admin/terminal', verifyToken, verifyAdmin, async (req, res) => {
    const { command } = req.body;
    if (!command) return res.json({ output: '' });

    const cmd = command.trim();
    const baseCmd = cmd.split(' ')[0].toLowerCase();

    // Role Check
    const isSuperAdmin = req.user.role === 'super-admin';

    // Internal overrides (Available to both)
    if (baseCmd === 'db-stats') {
        const users = await User.countDocuments();
        const playlists = await Playlist.countDocuments();
        return res.json({ output: `Collections:\n - Users: ${users}\n - Playlists: ${playlists}\nStatus: Connected` });
    }

    if (baseCmd === 'cls' || baseCmd === 'clear') {
        return res.json({ output: '' });
    }

    // Safety Filter for Regular Admins
    if (!isSuperAdmin) {
        const allowed = ['echo', 'whoami', 'hostname', 'date', 'uptime', 'npm -v', 'node -v'];
        const isAllowed = allowed.some(a => cmd.startsWith(a));
        if (!isAllowed) {
            return res.json({ output: `Permission Denied: 'admin' role is restricted to safe commands.\nUpgrade to 'super-admin' for full shell access.` });
        }
    }

    // Execute Arbitrary Command (Super Admin or Whitelisted)
    exec(cmd, { timeout: 15000, cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
            return res.json({ output: stdout + (stderr || error.message) });
        }
        res.json({ output: stdout });
    });
});

// Dev-only: Promote specific user to super-admin (One-time use helper)
router.post('/admin/promote-super', verifyToken, async (req, res) => {
    // Hardcoded safety check - replace with your actual email or a secret header
    if (req.user.email === 'admin@gmail.com') {
        await User.findByIdAndUpdate(req.user.id, { role: 'super-admin' });
        return res.json({ message: "Promoted to Super Admin! Re-login to apply." });
    }
    res.status(403).json({ message: "Not authorized for promotion." });
});

// Verify API Key (Public/Protected by Key)
router.get('/api/verify-key', async (req, res) => {
    const key = req.header('x-api-key');
    if (!key) return res.status(401).json({ message: 'Missing API Key' });

    try {
        const settings = await SystemSettings.findOne();
        if (settings && settings.rootApiKey === key) {
            return res.json({ valid: true, message: 'API Key is VALID' });
        }
        res.status(403).json({ valid: false, message: 'Invalid API Key' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
