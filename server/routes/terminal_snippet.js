
// Mock OS shell execution (Safe subset)
router.post('/admin/terminal', verifyToken, verifyAdmin, async (req, res) => {
    const { command } = req.body;
    if (!command) return res.json({ output: '' });

    const cmd = command.trim().split(' ')[0].toLowerCase();

    // Simulated responses mimicking a real shell
    switch (cmd) {
        case 'whoami':
            return res.json({ output: `root@spotify-server (Role: ${req.user.role})` });
        case 'date':
            return res.json({ output: new Date().toString() });
        case 'uptime':
            return res.json({ output: `Server Up: ${process.uptime().toFixed(1)}s` });
        case 'node':
            return res.json({ output: `Node.js Version: ${process.version}` });
        case 'ls':
            return res.json({ output: 'index.js\npackage.json\nroutes/\nmodels/\nutils/\n.env\n(Access Limited)' });
        case 'env':
            // Only show safe env vars
            return res.json({ output: `NODE_ENV=${process.env.NODE_ENV || 'development'}\nPORT=${process.env.PORT || 5000}\nMONGO_URI=[REDACTED]` });
        case 'db-stats':
            const users = await User.countDocuments();
            const playlists = await Playlist.countDocuments();
            return res.json({ output: `Collections:\n - Users: ${users}\n - Playlists: ${playlists}\nStatus: Connected` });
        default:
            return res.json({ output: `bash: ${cmd}: command not found` });
    }
});
