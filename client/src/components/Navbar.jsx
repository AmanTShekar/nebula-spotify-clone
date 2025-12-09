import { ChevronLeft, ChevronRight, User, Shield, ShieldAlert, ExternalLink, Settings as SettingsIcon, LogOut, Sparkles, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="w-full h-14 md:h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-[500] backdrop-blur-md bg-transparent">
            <div className="flex items-center gap-2 md:gap-4">
                <div onClick={() => navigate(-1)} className="glass p-1.5 md:p-2 rounded-full cursor-pointer hover:bg-white/10 transition active:scale-95">
                    <ChevronLeft size={18} className="text-white md:w-5 md:h-5" />
                </div>
                <div onClick={() => navigate(1)} className="glass p-1.5 md:p-2 rounded-full cursor-pointer hover:bg-white/10 transition active:scale-95">
                    <ChevronRight size={18} className="text-white md:w-5 md:h-5" />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {!user ? (
                    <>
                        <button onClick={() => navigate('/signup')} className="text-gray-300 font-bold hover:text-white hover:scale-105 transition tracking-wide text-xs md:text-sm">
                            Sign up
                        </button>
                        <button onClick={() => navigate('/login')} className="bg-white text-black font-bold px-4 md:px-8 py-2 md:py-3 rounded-full hover:scale-105 transition shadow-lg shadow-white/10 text-xs md:text-sm">
                            Log in
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => setIsPremiumModalOpen(true)}
                            className="hidden md:flex glass px-4 py-1.5 rounded-full text-sm font-bold hover:bg-white/10 transition border-white/20 hover:border-white/40 items-center gap-2"
                        >
                            <Sparkles size={14} className="text-yellow-400" /> Explore Premium
                        </button>
                        <div className="relative z-50" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`flex items-center gap-2 bg-black/60 hover:bg-black/80 p-0.5 pr-2 md:pr-3 rounded-full transition-all border ${isDropdownOpen ? 'border-white/20 bg-black/90' : 'border-transparent hover:border-white/10'}`}
                            >
                                <div className="bg-gradient-to-tr from-indigo-500 to-pink-500 p-1.5 rounded-full shadow-lg">
                                    <User size={14} className="text-white md:w-4 md:h-4" />
                                </div>
                                <span className="text-white font-bold text-xs md:text-sm hidden sm:block max-w-[80px] md:max-w-[100px] truncate">{user.name || 'User'}</span>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 md:w-72 bg-[#18181b] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 origin-top-right animate-fade-in-up z-[100]">
                                    <div className="px-3 py-3 border-b border-white/5 mb-1 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shrink-0">
                                            <span className="font-bold text-lg">{user.name?.[0]?.toUpperCase()}</span>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-white font-bold text-sm truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {(user.role === 'admin' || user.role === 'super-admin') && (
                                            <>
                                                <button onClick={() => { navigate('/admin'); setIsDropdownOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors font-bold flex items-center gap-3 group/item ${user.role === 'super-admin' ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-amber-500/10 text-amber-400'}`}>
                                                    <div className="flex items-center gap-3">
                                                        {user.role === 'super-admin' ? <ShieldAlert size={16} /> : <Shield size={16} />}
                                                        {user.role === 'super-admin' ? 'Super Admin' : 'Admin Panel'}
                                                    </div>
                                                    <ExternalLink size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity ml-auto" />
                                                </button>
                                                <div className="h-[1px] bg-white/5 my-1 mx-2"></div>
                                            </>
                                        )}
                                        <button onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-xl text-sm transition-colors text-gray-200 flex items-center justify-between group/item">
                                            <div className="flex items-center gap-3">
                                                <User size={16} className="text-gray-400 group-hover/item:text-white transition-colors" />
                                                Profile
                                            </div>
                                            <ChevronRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                        </button>
                                        <button onClick={() => { navigate('/settings'); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-xl text-sm transition-colors text-gray-200 flex items-center justify-between group/item">
                                            <div className="flex items-center gap-3">
                                                <SettingsIcon size={16} className="text-gray-400 group-hover/item:text-white transition-colors" />
                                                Settings
                                            </div>
                                            <ChevronRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                        </button>
                                        <div className="h-[1px] bg-white/5 my-1 mx-2"></div>
                                        <button onClick={logout} className="w-full text-left px-3 py-2.5 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-sm transition-colors text-gray-200 font-medium flex items-center gap-3 group/item">
                                            <LogOut size={16} className="group-hover/item:text-red-400 text-gray-400 transition-colors" />
                                            Log out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Modal */}
            {isPremiumModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#18181b] w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button onClick={() => setIsPremiumModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition z-10">
                            <X size={24} className="text-gray-400 hover:text-white" />
                        </button>

                        <div className="p-8 md:p-12 text-center">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                Unlock Premium Power
                            </h2>
                            <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
                                Experience music like never before. Higher quality, zero ads, and unlimited skips.
                            </p>

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Free Plan */}
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col hover:border-white/10 transition-colors">
                                    <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                                    <div className="text-3xl font-black text-white mb-6">$0<span className="text-sm font-medium text-gray-500">/mo</span></div>
                                    <ul className="space-y-3 mb-8 flex-1 text-left">
                                        <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> Ad-supported music</li>
                                        <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> Standard audio quality</li>
                                        <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> Play in Shuffle mode</li>
                                    </ul>
                                    <button className="w-full py-3 rounded-full border border-white/20 font-bold hover:bg-white hover:text-black transition">Current Plan</button>
                                </div>

                                {/* Premium Individual */}
                                <div className="bg-gradient-to-b from-indigo-900/50 to-black/50 border border-indigo-500/30 rounded-2xl p-6 flex flex-col relative transform scale-105 shadow-xl">
                                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">BEST VALUE</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Premium</h3>
                                    <div className="text-3xl font-black text-white mb-6">$4.99<span className="text-sm font-medium text-gray-500">/mo</span></div>
                                    <ul className="space-y-3 mb-8 flex-1 text-left">
                                        <li className="flex items-center gap-3 text-sm text-white font-medium"><Check size={16} className="text-indigo-400" /> Ad-free music listening</li>
                                        <li className="flex items-center gap-3 text-sm text-white font-medium"><Check size={16} className="text-indigo-400" /> High fidelity audio</li>
                                        <li className="flex items-center gap-3 text-sm text-white font-medium"><Check size={16} className="text-indigo-400" /> Unlimited skips</li>
                                        <li className="flex items-center gap-3 text-sm text-white font-medium"><Check size={16} className="text-indigo-400" /> Offline playback</li>
                                    </ul>
                                    <button className="w-full py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition shadow-lg shadow-white/10">Get Premium</button>
                                </div>

                                {/* Family Plan */}
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col hover:border-white/10 transition-colors">
                                    <h3 className="text-xl font-bold text-white mb-2">Family</h3>
                                    <div className="text-3xl font-black text-white mb-6">$9.99<span className="text-sm font-medium text-gray-500">/mo</span></div>
                                    <ul className="space-y-3 mb-8 flex-1 text-left">
                                        <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> Up to 6 Premium accounts</li>
                                        <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> Block explicit music</li>
                                        <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> Access to Spotify Kids</li>
                                    </ul>
                                    <button className="w-full py-3 rounded-full border border-white/20 font-bold hover:bg-white hover:text-black transition">Get Family</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Navbar;
