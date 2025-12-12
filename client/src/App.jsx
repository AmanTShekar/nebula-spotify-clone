import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { API_URL } from './config/api';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import MobileNav from './components/MobileNav';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Profile from './pages/Profile';
import Playlist from './pages/Playlist';
import Artist from './pages/Artist';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Maintenance from './pages/Maintenance';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PlayerProvider } from './context/PlayerContext';
import FullScreenPlayer from './components/FullScreenPlayer';
import { useState, useEffect } from 'react';
import axios from 'axios';



const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
        return <Navigate to="/" replace />;
    }
    return children;
};

const AppContent = () => {
    const location = useLocation();
    const { user, loading } = useAuth();
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [checkingMaintenance, setCheckingMaintenance] = useState(true);

    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const res = await axios.get(`${API_URL}/user/maintenance`);
                setIsMaintenance(res.data.isMaintenanceMode);
            } catch (err) {
                console.error("Failed to check maintenance status", err);
            } finally {
                setCheckingMaintenance(false);
            }
        };

        checkMaintenance();
        // Poll every 30s
        const interval = setInterval(checkMaintenance, 30000);
        return () => clearInterval(interval);
    }, []);

    if (checkingMaintenance || loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

    // Strict Maintenance Enforcement
    if (isMaintenance && !isAdmin && !location.pathname.includes('/admin') && !location.pathname.includes('/login')) {
        return <Maintenance />;
    }

    if (isAuthPage) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                {/* Redirect any other path to login if in auth flow context, or just let them fall through if we want mixed usage. 
                    Actually, we just render these specific routes here. 
                */}
            </Routes>
        );
    }

    return (
        <div className="h-screen flex flex-col p-0 md:p-2 gap-0 md:gap-2">
            <div className="flex flex-1 overflow-hidden gap-0 md:gap-2">
                {/* Sidebar - Hidden on mobile */}
                <div className="hidden md:block">
                    <Sidebar />
                </div>

                <div className="flex-1 flex flex-col min-w-0 glass md:rounded-xl relative">
                    <Navbar />
                    <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-28">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="/likes" element={<Library />} />
                            <Route path="/admin" element={
                                <AdminRoute>
                                    <Admin />
                                </AdminRoute>
                            } />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/playlist/:id" element={<Playlist />} />
                            <Route path="/artist/:id" element={<Artist />} />
                            {/* Keep these here just in case of weird routing, but ideally handled above */}
                            <Route path="/login" element={<Navigate to="/" replace />} />
                            <Route path="/signup" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </div>
            </div>
            <Player />
            <MobileNav />
            <FullScreenPlayer />
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <PlayerProvider>
                    <AppContent />
                </PlayerProvider>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
