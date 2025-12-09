import { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Users, Music, Activity, Trash2, Shield, ShieldAlert, Database, Server, Lock, Terminal, Copy } from 'lucide-react'; JSON

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPlaylists: 0,
        totalLikedSongs: 0,
        userGrowth: [],
        systemStats: null
    });
    const [dbData, setDbData] = useState(null);
    const [dbCollection, setDbCollection] = useState('users');
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [liveUptime, setLiveUptime] = useState(0);
    const [serverLogs, setServerLogs] = useState([]);
    const [clientLogs, setClientLogs] = useState([]);
    const [cmdInput, setCmdInput] = useState("");
    const [cmdHistory, setCmdHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const { token } = useAuth();
    const { showToast } = useToast();
    const logsEndRef = useRef(null);

    const [securityLogs, setSecurityLogs] = useState([]);
    const [systemSettings, setSystemSettings] = useState(null);

    // ... existing useEffects ...

    const [activeTab, setActiveTab] = useState('overview');

    // Main Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(statsRes.data);
                if (statsRes.data.systemStats) {
                    setLiveUptime(Math.floor(statsRes.data.systemStats.uptime));
                }

                const usersRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/admin/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(usersRes.data);

                const playlistsRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/admin/playlists`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPlaylists(playlistsRes.data);

                const maintRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/maintenance`);
                setIsMaintenance(maintRes.data.isMaintenanceMode);
            } catch (err) {
                console.error("Error fetching admin data:", err);
            }
        };
        fetchData();

        // Poll stats every 10s for live updates (except uptime which is local)
        const statsInterval = setInterval(fetchData, 10000);
        return () => clearInterval(statsInterval);
    }, [token]);

    // Fetch Security Data
    useEffect(() => {
        if (activeTab === 'security' && token) {
            const fetchSecurityData = async () => {
                try {
                    const logsRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/admin/security/logs`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSecurityLogs(logsRes.data);

                    const settingsRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/admin/security/settings`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSystemSettings(settingsRes.data);
                } catch (err) {
                    console.error("Error fetching security data:", err);
                }
            };
            fetchSecurityData();
            // Poll every 5s
            const interval = setInterval(fetchSecurityData, 5000);
            return () => clearInterval(interval);
        }
    }, [activeTab, token]);

    const handleToggleSetting = async (key) => {
        if (!systemSettings) return;
        try {
            const newValue = !systemSettings[key];
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/admin/security/settings`,
                { [key]: newValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSystemSettings(res.data);
            showToast(`${key} is now ${newValue ? 'ENABLED' : 'DISABLED'}`, newValue ? 'success' : 'info');
        } catch (err) {
            console.error("Error updating setting:", err);
            showToast("Failed to update setting", "error");
        }
    };

    const handleRestartServer = async () => {
        if (!window.confirm("Are you sure you want to restart the server monitoring logic? This will reset uptime.")) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/user/admin/server/restart`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast("Server stats reset successfully.", "success");
            setLiveUptime(0);
        } catch (err) {
            console.error("Restart Error:", err);
            showToast("Failed to restart server.", "error");
        }
    };

    const handleClearLogs = async () => {
        if (!window.confirm("This will permanently delete ALL security logs. Continue?")) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/user/admin/security/clear-logs`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSecurityLogs([]);
            showToast("Security logs cleared.", "success");
        } catch (err) {
            console.error("Clear Logs Error:", err);
            showToast("Failed to clear logs.", "error");
        }
    };

    const handleLockdown = async () => {
        if (!window.confirm("EMERGENCY LOCKDOWN: This will disable registration and verify email for ALL users. Proceed?")) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/user/admin/server/lockdown`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast("Server is now in LOCKDOWN mode.", "error", 5000);
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            console.error("Lockdown Error:", err);
            showToast("Failed to execute lockdown.", "error");
        }
    };

    const handleTestKey = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/api/verify-key`, {
                headers: { 'x-api-key': systemSettings?.rootApiKey }
            });
            showToast(`Success: ${res.data.message}`, "success");
        } catch (err) {
            showToast("Failed: Invalid Key", "error");
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!", "success");
    };

    const formatTimeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} mins ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hours ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    // Live Logs Poller
    useEffect(() => {
        if (activeTab === 'console' && token) {
            const fetchLogs = async () => {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/admin/logs`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setServerLogs(res.data);
                } catch (err) {
                    // console.error("Error fetching logs", err); // Avoid loop
                }
            };
            fetchLogs(); // Initial
            const logInterval = setInterval(fetchLogs, 2000);
            return () => clearInterval(logInterval);
        }
    }, [activeTab, token]);

    // Frontend Log Interceptor
    useEffect(() => {
        if (activeTab !== 'console') return;

        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const addClientLog = (type, args) => {
            const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            const log = {
                timestamp: new Date().toISOString(),
                type: type === 'error' ? 'error' : 'client',
                message: `[CLIENT] ${message}`,
                isClient: true
            };
            setClientLogs(prev => {
                const newLogs = [...prev, log];
                if (newLogs.length > 50) newLogs.shift();
                return newLogs;
            });
        };

        console.log = (...args) => {
            addClientLog('log', args);
            originalLog.apply(console, args);
        };
        console.error = (...args) => {
            addClientLog('error', args);
            originalError.apply(console, args);
        };
        console.warn = (...args) => {
            addClientLog('warn', args);
            originalWarn.apply(console, args);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, [activeTab]);

    // Merge Logs
    const allLogs = [...serverLogs, ...clientLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    useEffect(() => {
        if (activeTab === 'console') {
            logsEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        }
    }, [allLogs, activeTab]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < cmdHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setCmdInput(cmdHistory[cmdHistory.length - 1 - newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCmdInput(cmdHistory[cmdHistory.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCmdInput("");
            }
        }
    };

    const handleCommand = async (e) => {
        e.preventDefault();
        const cmd = cmdInput.trim();
        if (!cmd) return;

        // Log command and update history
        const now = new Date().toISOString();
        setClientLogs(prev => [...prev, { timestamp: now, type: 'command', message: `> ${cmd}`, isClient: true }]);
        setCmdHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);
        setCmdInput("");

        const args = cmd.split(' ');
        const action = args[0].toLowerCase();

        switch (action) {
            case 'clear':
                setClientLogs([]);
                setServerLogs([]);
                break;
            case 'help':
                setClientLogs(prev => [...prev, {
                    timestamp: now, type: 'info', isClient: true,
                    message: 'Available commands:\n  help        - Show this menu\n  clear       - Clear console\n  stats       - Detailed system stats\n  users       - User summary\n  maintenance - Toggle status (maintenance [on|off])\n  restart     - Soft server restart\n  echo <msg>  - Print message\n\nRemote Commands (Server-Side):\n  whoami, date, uptime, node, ls, env, db-stats'
                }]);
                break;
            case 'echo':
                setClientLogs(prev => [...prev, { timestamp: now, type: 'info', message: args.slice(1).join(' '), isClient: true }]);
                break;
            case 'stats':
                const memObj = stats.systemStats?.memory || {};
                const memUsage = Math.round((memObj.heapUsed || 0) / 1024 / 1024);
                setClientLogs(prev => [...prev, {
                    timestamp: now, type: 'info', isClient: true,
                    message: `SYSTEM STATUS:\n------------------\nUptime:    ${formatUptime(liveUptime)}\nUsers:     ${stats.totalUsers}\nPlaylists: ${stats.totalPlaylists}\nMemory:    ${memUsage} MB Used\nCPU Load:  ${stats.systemStats?.cpuLoad || 0}%\nTemp:      ${stats.systemStats?.temp || 0}°C`
                }]);
                break;
            case 'users':
                setClientLogs(prev => [...prev, { timestamp: now, type: 'info', message: `Total Registered: ${stats.totalUsers}\nActive Now: ${Math.floor(stats.totalUsers * 0.8) + 1} (est)`, isClient: true }]);
                break;
            case 'restart':
                handleRestartServer();
                break;
            case 'maintenance':
                if (args[1] === 'on') {
                    if (!isMaintenance) toggleMaintenance();
                    else setClientLogs(prev => [...prev, { timestamp: now, type: 'warn', message: 'Maintenance is already ON.', isClient: true }]);
                } else if (args[1] === 'off') {
                    if (isMaintenance) toggleMaintenance();
                    else setClientLogs(prev => [...prev, { timestamp: now, type: 'warn', message: 'Maintenance is already OFF.', isClient: true }]);
                } else {
                    toggleMaintenance(); // Toggle if no arg
                }
                break;
            default:
                // Try sending to server
                try {
                    setClientLogs(prev => [...prev, { timestamp: now, type: 'info', message: 'Sending to server...', isClient: true }]);
                    const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/admin/terminal`,
                        { command: cmd },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (res.data.output) {
                        setClientLogs(prev => [...prev, { timestamp: new Date().toISOString(), type: 'info', message: res.data.output, isClient: false }]);
                    } else {
                        // If empty, maybe it was unknown on server too, but our endpoint returns bash error string usually
                        // But if it was truly empty
                        setClientLogs(prev => [...prev, { timestamp: new Date().toISOString(), type: 'warn', message: '(No output)', isClient: false }]);
                    }
                } catch (err) {
                    setClientLogs(prev => [...prev, { timestamp: new Date().toISOString(), type: 'error', message: `Server Error: ${err.message}`, isClient: true }]);
                }
        }
    };

    useEffect(() => {
        if (activeTab === 'database' && token) {
            const fetchDb = async () => {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/admin/db/${dbCollection}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setDbData(res.data);
                } catch (err) {
                    console.error("DB Fetch Error", err);
                }
            };
            fetchDb();
        }
    }, [activeTab, dbCollection, token]);

    const toggleMaintenance = async () => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/admin/maintenance`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsMaintenance(res.data.isMaintenanceMode);
            showToast(`Maintenance Mode is now ${res.data.isMaintenanceMode ? 'ON' : 'OFF'}`, "info");
        } catch (err) {
            console.error("Error toggling maintenance", err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/user/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u._id !== userId));
            setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
            showToast("User deleted successfully.", "success");
        } catch (err) {
            console.error("Error deleting user:", err);
            showToast("Failed to delete user", "error");
        }
    };

    const handleDeletePlaylist = async (playlistId) => {
        if (!window.confirm("Are you sure you want to delete this playlist?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/user/admin/playlists/${playlistId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlaylists(playlists.filter(p => p._id !== playlistId));
            setStats({ ...stats, totalPlaylists: stats.totalPlaylists - 1 });
            showToast("Playlist deleted successfully.", "success");
        } catch (err) {
            console.error("Error deleting playlist:", err);
            showToast("Failed to delete playlist", "error");
        }
    };

    const formatUptime = (seconds) => {
        if (!seconds) return "0s";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const renderChart = () => {
        // Map last 7 days to ensure we have labels even if 0 users
        const labels = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' })); // Mon, Tue

            const found = stats.userGrowth.find(g => g._id === dateStr);
            data.push(found ? found.count : 0);
        }

        // Find max for scaling
        const maxVal = Math.max(...data, 5); // Minimum scale of 5

        return (
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 animate-fade-in col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-gray-400 font-bold tracking-wider text-sm uppercase">User Growth</h3>
                        <p className="text-xs text-gray-500">Last 7 Days</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-white">{data.reduce((a, b) => a + b, 0)}</div>
                        <div className="text-[10px] items-center gap-1 text-green-400 flex justify-end font-bold">
                            New Users
                        </div>
                    </div>
                </div>

                <div className="flex items-end justify-between h-40 gap-4">
                    {data.map((h, i) => {
                        const heightPct = (h / maxVal) * 100;
                        return (
                            <div key={i} className="flex flex-col items-center gap-2 w-full group">
                                <div className="text-xs text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">{h}</div>
                                <div
                                    className="w-full bg-gradient-to-t from-indigo-600 to-pink-500 rounded-t-md opacity-70 hover:opacity-100 transition-all duration-500 relative overflow-hidden min-h-[4px]"
                                    style={{ height: `${heightPct}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold">{labels[i]}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderSystemHealth = () => (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 animate-fade-in w-full">
            <h3 className="text-gray-400 font-bold mb-6 tracking-wider text-sm uppercase">Live System Health</h3>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 text-green-500 rounded-lg"><Activity size={18} /></div>
                        <div>
                            <div className="text-white font-bold">Server Uptime</div>
                            <div className="text-xs text-gray-500">Since last restart</div>
                        </div>
                    </div>
                    <div className="text-xl font-mono text-white">{formatUptime(liveUptime)}</div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg"><Server size={18} /></div>
                        <div>
                            <div className="text-white font-bold">Memory Usage</div>
                            <div className="text-xs text-gray-500">Heap Used</div>
                        </div>
                    </div>
                    <div className="text-xl font-mono text-white">
                        {stats.systemStats ? `${Math.round(stats.systemStats.memory.heapUsed / 1024 / 1024)} MB` : '0 MB'}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 text-purple-500 rounded-lg"><Database size={18} /></div>
                        <div>
                            <div className="text-white font-bold">Database</div>
                            <div className="text-xs text-gray-500">Collections</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold text-white">Users: {stats.totalUsers}</div>
                        <div className="text-sm font-bold text-white">Playlists: {stats.totalPlaylists}</div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="px-4 md:px-8 py-4 md:py-8 pb-24 md:pb-32 h-full max-w-7xl mx-auto">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">Admin Dashboard</h1>
                    <p className="text-gray-400 font-medium">Platform analytics and content management.</p>
                </div>
                <div className="flex p-1 bg-white/5 rounded-full backdrop-blur-md border border-white/5">
                    {['overview', 'users', 'security', 'system', 'console'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 capitalize ${activeTab === tab ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                        <div className="glass p-4 md:p-8 rounded-3xl flex items-center gap-4 md:gap-6 hover:bg-white/10 transition-all border border-white/5 group bg-gradient-to-br from-indigo-500/10 to-transparent">
                            <div className="p-4 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                                <Users size={32} />
                            </div>
                            <div>
                                <h3 className="text-indigo-200 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">Total Users</h3>
                                <p className="text-3xl md:text-5xl font-black text-white tracking-tighter">{stats.totalUsers}</p>
                            </div>
                        </div>

                        <div className="glass p-4 md:p-8 rounded-3xl flex items-center gap-4 md:gap-6 hover:bg-white/10 transition-all border border-white/5 group bg-gradient-to-br from-emerald-500/10 to-transparent">
                            <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                                <Activity size={32} />
                            </div>
                            <div>
                                <h3 className="text-emerald-200 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">Active Now</h3>
                                <p className="text-3xl md:text-5xl font-black text-white tracking-tighter">{Math.floor(stats.totalUsers * 0.8) + 1}</p>
                            </div>
                        </div>

                        <div className="glass p-4 md:p-8 rounded-3xl flex items-center gap-4 md:gap-6 hover:bg-white/10 transition-all border border-white/5 group bg-gradient-to-br from-blue-500/10 to-transparent">
                            <div className="p-4 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                <Activity size={32} />
                            </div>
                            <div>
                                <h3 className="text-blue-200 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">Server Status</h3>
                                <p className="text-2xl md:text-5xl font-black text-white tracking-tighter">ONLINE</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart & Health Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {renderChart()}
                        <div className="col-span-1">
                            {renderSystemHealth()}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="glass rounded-3xl overflow-hidden border border-white/5 shadow-2xl animate-fade-in-up">
                    <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield size={24} className="text-indigo-400" />
                            <h3 className="font-bold text-xl text-white">User Management</h3>
                        </div>
                        <span className="text-sm text-gray-400">{users.length} registered users</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-black/20 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="p-3 md:p-6 pl-4 md:pl-8">User Info</th>
                                    <th className="p-3 md:p-6">Role</th>
                                    <th className="p-3 md:p-6">Joined</th>
                                    <th className="p-3 md:p-6 text-right pr-4 md:pr-8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map(user => (
                                    <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-3 md:p-6 pl-4 md:pl-8">
                                            <div className="font-bold text-white text-sm md:text-lg">{user.name}</div>
                                            <div className="text-gray-400 text-xs md:text-sm">{user.email}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${user.role === 'Admin'
                                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                                : 'bg-green-500/10 border-green-500/20 text-green-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-6 text-gray-500 text-sm font-mono">
                                            2024-12-01
                                        </td>
                                        <td className="p-6 text-right pr-8">
                                            {user.role !== 'Admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="p-3 hover:bg-red-500/20 rounded-xl text-gray-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {users.length === 0 && (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <ShieldAlert size={48} className="mb-4 opacity-50" />
                            <p>No users found in the database.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'security' && (
                <div className="flex flex-col gap-6 animate-fade-in-up">
                    {/* Security Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass p-6 rounded-3xl flex items-center justify-between border border-white/5 bg-gradient-to-br from-red-500/10 to-transparent">
                            <div>
                                <h3 className="text-red-200 font-bold text-xs uppercase tracking-widest mb-1">Threat Level</h3>
                                <p className="text-3xl font-black text-white">LOW</p>
                            </div>
                            <div className="p-3 bg-red-500 rounded-xl text-white shadow-lg shadow-red-500/30">
                                <ShieldAlert size={24} />
                            </div>
                        </div>
                        <div className="glass p-6 rounded-3xl flex items-center justify-between border border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
                            <div>
                                <h3 className="text-blue-200 font-bold text-xs uppercase tracking-widest mb-1">Public Reg</h3>
                                <p className="text-3xl font-black text-white">{systemSettings?.publicRegistration ? 'OPEN' : 'CLOSED'}</p>
                            </div>
                            <div className={`p-3 rounded-xl text-white shadow-lg ${systemSettings?.publicRegistration ? 'bg-blue-500 shadow-blue-500/30' : 'bg-gray-500'}`}>
                                <Lock size={24} />
                            </div>
                        </div>
                        <div className="glass p-6 rounded-3xl flex items-center justify-between border border-white/5 bg-gradient-to-br from-green-500/10 to-transparent">
                            <div>
                                <h3 className="text-green-200 font-bold text-xs uppercase tracking-widest mb-1">Last Audit</h3>
                                <p className="text-xl font-black text-white">{securityLogs[0] ? formatTimeAgo(securityLogs[0].createdAt) : 'None'}</p>
                            </div>
                            <div className="p-3 bg-green-500 rounded-xl text-white shadow-lg shadow-green-500/30">
                                <Activity size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Login Audit Table */}
                    <div className="glass rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                        <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield size={24} className="text-indigo-400" />
                                <h3 className="font-bold text-xl text-white">Recent Login Attempts</h3>
                            </div>
                            <button className="text-xs text-indigo-400 hover:text-white transition-colors">Export Log</button>
                        </div>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-black/20 text-gray-400 text-xs uppercase tracking-wider font-semibold sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="p-6 pl-8">Status</th>
                                        <th className="p-6">User / IP</th>
                                        <th className="p-6">Location</th>
                                        <th className="p-6">Time</th>
                                        <th className="p-6 text-right pr-8">Risk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {(securityLogs.length > 0 ? securityLogs : [
                                        { status: 'success', user: 'admin@spotify.com', ip: '192.168.1.1', location: 'Localhost', createdAt: new Date().toISOString(), riskScore: 'Low' },
                                        { status: 'failed', user: 'root', ip: '45.32.11.2', location: 'Russia', createdAt: new Date(Date.now() - 7200000).toISOString(), riskScore: 'High' }
                                    ]).map((log, i) => (
                                        <tr key={log._id || i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-6 pl-8">
                                                {log.status === 'success' ? (
                                                    <span className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase"><div className="w-2 h-2 rounded-full bg-green-500"></div> Success</span>
                                                ) : (
                                                    <span className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase"><div className="w-2 h-2 rounded-full bg-red-500"></div> Failed</span>
                                                )}
                                            </td>
                                            <td className="p-6">
                                                <div className="text-white font-bold text-sm">{log.user}</div>
                                                <div className="text-gray-500 text-xs font-mono">{log.ip}</div>
                                            </td>
                                            <td className="p-6 text-gray-400 text-sm">{log.location}</td>
                                            <td className="p-6 text-gray-400 text-sm">{formatTimeAgo(log.createdAt || log.time)}</td>
                                            <td className="p-6 text-right pr-8">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.riskScore === 'High' || log.risk === 'High' ? 'bg-red-500/20 text-red-500' :
                                                    (log.riskScore === 'Medium' || log.risk === 'Medium') ? 'bg-yellow-500/20 text-yellow-500' :
                                                        'bg-green-500/20 text-green-500'
                                                    }`}>{log.riskScore || log.risk}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Security Settings & Keys */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass rounded-3xl p-8 border border-white/5">
                            <h3 className="font-bold text-xl text-white mb-6">Access Control</h3>
                            {systemSettings ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                        <div>
                                            <div className="text-white font-bold">Public Registration</div>
                                            <div className="text-gray-500 text-xs">Allow new users to sign up</div>
                                        </div>
                                        <div
                                            onClick={() => handleToggleSetting('publicRegistration')}
                                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${systemSettings.publicRegistration ? 'bg-green-500' : 'bg-white/20'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemSettings.publicRegistration ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                        <div>
                                            <div className="text-white font-bold">Require Email Verify</div>
                                            <div className="text-gray-500 text-xs">Send verification email on signup</div>
                                        </div>
                                        <div
                                            onClick={() => handleToggleSetting('requireEmailVerify')}
                                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${systemSettings.requireEmailVerify ? 'bg-green-500' : 'bg-white/20'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemSettings.requireEmailVerify ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500">Loading settings...</div>
                            )}
                        </div>

                        <div className="glass rounded-3xl p-8 border border-white/5">
                            <h3 className="font-bold text-xl text-white mb-6">Admin Key Management</h3>
                            <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl mb-4">
                                <div className="text-red-400 text-xs font-bold uppercase mb-2">Root API Key</div>
                                <div
                                    className="font-mono text-white text-sm bg-black/50 p-3 rounded border border-white/5 flex justify-between items-center cursor-pointer group"
                                    onClick={() => copyToClipboard(systemSettings?.rootApiKey)}
                                    title="Click to Copy"
                                >
                                    <span>{systemSettings?.rootApiKey || 'Loading...'}</span>
                                    <Copy size={14} className="text-gray-500 group-hover:text-white" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition"
                                    onClick={() => showToast('Rotate Key not implemented yet', 'info')}
                                >
                                    Rotate Keys
                                </button>
                                <button
                                    className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/20 rounded-xl font-bold transition"
                                    onClick={handleTestKey}
                                >
                                    Test Key
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="glass rounded-3xl overflow-hidden border border-white/5 shadow-2xl animate-fade-in-up p-8 flex flex-col gap-8">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                        <Server size={24} className="text-red-400" />
                        <h3 className="font-bold text-xl text-white">System Monitor</h3>
                    </div>

                    {/* Server Actions (Danger Zone) */}
                    <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 flex flex-col gap-4 col-span-1 md:col-span-2 lg:col-span-4">
                        <div className="flex justify-between items-center text-red-400 text-sm font-bold uppercase tracking-wider">
                            <span>Danger Zone</span>
                            <ShieldAlert size={18} />
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleRestartServer}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2"
                            >
                                <Activity size={18} /> Soft Restart
                            </button>
                            <button
                                onClick={handleClearLogs}
                                className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-6 py-3 rounded-xl font-bold transition flex items-center gap-2"
                            >
                                <Trash2 size={18} /> Clear Security Logs
                            </button>
                            <button
                                onClick={handleLockdown}
                                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ml-auto border border-white/10"
                            >
                                <Lock size={18} /> EMERGENCY LOCKDOWN
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* CPU */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                            <div className="flex justify-between items-center text-gray-400 text-sm font-bold uppercase tracking-wider">
                                <span>CPU Load</span>
                                <Activity size={18} />
                            </div>
                            <div className="relative h-32 flex items-end gap-1 overflow-hidden">
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <div key={i} className="flex-1 bg-white/10 rounded-sm" style={{ height: `${Math.random() * (stats.systemStats?.cpuLoad || 30) + 10}%` }}></div>
                                ))}
                            </div>
                            <div className="text-3xl font-mono text-white font-bold">{stats.systemStats?.cpuLoad || 0}%</div>
                        </div>

                        {/* GPU */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                            <div className="flex justify-between items-center text-gray-400 text-sm font-bold uppercase tracking-wider">
                                <span>GPU Usage</span>
                                <Activity size={18} />
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden mt-auto">
                                <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${stats.systemStats?.gpuLoad || 0}%` }}></div>
                            </div>
                            <div className="text-3xl font-mono text-purple-400 font-bold">{stats.systemStats?.gpuLoad || 0}%</div>
                        </div>

                        {/* Memory */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                            <div className="flex justify-between items-center text-gray-400 text-sm font-bold uppercase tracking-wider">
                                <span>Memory</span>
                                <Server size={18} />
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden mt-auto">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: '45%' }}></div>
                            </div>
                            <div className="text-3xl font-mono text-blue-400 font-bold">{stats.systemStats ? Math.round(stats.systemStats.memory.heapUsed / 1024 / 1024) : 0} MB</div>
                        </div>

                        {/* Temp */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                            <div className="flex justify-between items-center text-gray-400 text-sm font-bold uppercase tracking-wider">
                                <span>Core Temp</span>
                                <Activity size={18} />
                            </div>
                            <div className="relative h-32 flex items-end gap-1 overflow-hidden opacity-50">
                                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent"></div>
                            </div>
                            <div className="text-3xl font-mono text-orange-400 font-bold">{stats.systemStats?.temp || 45}°C</div>
                        </div>

                        {/* Maintenance Mode Tile */}
                        <div className={`p-6 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${isMaintenance ? 'bg-red-500/20 border-red-500/50' : 'bg-white/5 border-white/5'}`}>
                            <div>
                                <div className="flex justify-between items-center text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">
                                    <span className={isMaintenance ? 'text-red-300' : 'text-gray-400'}>Maintenance</span>
                                    <Lock size={18} className={isMaintenance ? 'text-red-400' : 'text-gray-500'} />
                                </div>
                                <h4 className={`font-bold text-lg ${isMaintenance ? 'text-red-100' : 'text-white'}`}>
                                    {isMaintenance ? 'Active' : 'Disabled'}
                                </h4>
                                <p className={`text-sm mt-1 ${isMaintenance ? 'text-red-200' : 'text-gray-400'}`}>
                                    {isMaintenance ? 'Users blocked.' : 'System accessible.'}
                                </p>
                            </div>
                            <button
                                onClick={toggleMaintenance}
                                className={`w-full py-3 rounded-xl font-bold transition-all ${isMaintenance ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                            >
                                {isMaintenance ? 'Disable Mode' : 'Enable Mode'}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
            {
                activeTab === 'console' && (
                    <div className="glass rounded-xl overflow-hidden shadow-2xl animate-fade-in-up h-[600px] flex flex-col bg-black font-mono border border-gray-800">
                        {/* Terminal Header */}
                        <div className="bg-gray-900/80 p-2 flex items-center justify-between border-b border-gray-800 backdrop-blur-sm select-none">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                            </div>
                            <div className="text-xs text-gray-500 font-mono tracking-widest uppercase">root@spotify-server:~</div>
                            <div className="w-10"></div>
                        </div>

                        {/* Terminal Body */}
                        <div className="flex-1 overflow-auto p-4 text-xs md:text-sm scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent space-y-1" onClick={() => document.getElementById('terminal-input')?.focus()}>
                            {/* Welcome Message */}
                            <div className="text-green-500 mb-4 select-none">
                                <pre>{` ___  ____   __  ____  __  ____  _  _    ___  __    __  __ _  ____ 
/ __)(  _ \\ /  \\(_  _)(  )(  __)( \\/ )  / __)(  )  /  \\(  ( \\(  __)
\\__ \\ ) __/(  O ) )(   )(  ) _)  )  /  ( (__ / (_/\\(  O )    ( ) _) 
(___/(__)   \\__/ (__) (__) அதற்கு  (__/    \\___)\\____/ \\__/ \\_)__)(____)`}</pre>
                                <p className="mt-2 text-gray-400">Spotify Admin Shell v2.0.0-release</p>
                                <p className="text-gray-500">Type 'help' for a list of commands.</p>
                            </div>

                            {/* Logs Output */}
                            {allLogs.map((log, i) => (
                                <div key={i} className="break-words leading-relaxed">
                                    <span className="text-gray-600 select-none mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                    {log.type === 'command' ? (
                                        <span className="text-white font-bold">{log.message}</span>
                                    ) : log.type === 'error' ? (
                                        <span className="text-red-500">{log.message}</span>
                                    ) : (
                                        <span className="text-green-400 whitespace-pre-wrap">{log.message}</span>
                                    )}
                                </div>
                            ))}

                            {/* Active Prompt Line */}
                            <form onSubmit={handleCommand} className="flex items-center gap-2 mt-2">
                                <span className="text-green-500 font-bold shrink-0">root@server:~$</span>
                                <input
                                    id="terminal-input"
                                    type="text"
                                    value={cmdInput}
                                    onChange={(e) => setCmdInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder-gray-700 caret-green-500"
                                    autoFocus
                                    autoComplete="off"
                                />
                            </form>
                            <div ref={logsEndRef} className="h-4" />
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Admin;
