import { Home, Search, Library, Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';

const MobileNav = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Search, label: 'Search', path: '/search' },
        { icon: Library, label: 'Library', path: '/library' },
    ];

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 pb-safe">
                <div className="flex items-center justify-around px-2 py-1.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px] ${isActive
                                    ? 'text-white bg-white/10'
                                    : 'text-gray-400 hover:text-white active:scale-95'
                                }`
                            }
                        >
                            <item.icon size={22} strokeWidth={2.5} />
                            <span className="text-[10px] font-semibold">{item.label}</span>
                        </NavLink>
                    ))}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95 min-w-[64px]"
                    >
                        <Menu size={22} strokeWidth={2.5} />
                        <span className="text-[10px] font-semibold">More</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-xl animate-fade-in">
                    <div className="flex flex-col h-full pt-safe">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Menu</h2>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition active:scale-95"
                            >
                                <X size={24} className="text-white" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 pb-safe">
                            {/* Menu content will be populated by Sidebar component */}
                            <Sidebar isMobile={true} onClose={() => setIsMenuOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileNav;
