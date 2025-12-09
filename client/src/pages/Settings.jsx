import { useState, useEffect } from 'react';
import { Bell, Globe, Wifi, Zap, Smartphone, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const { showToast } = useToast();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        publicProfile: false,
        audioQuality: 'auto', // 'high' | 'auto'
        dataSaver: false
    });

    useEffect(() => {
        const saved = localStorage.getItem('userSettings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, []);

    const toggleSetting = (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        showToast(`${key.replace(/([A-Z])/g, ' $1')} ${newSettings[key] ? 'enabled' : 'disabled'}`, 'success');
    };

    const setQuality = (quality) => {
        const newSettings = { ...settings, audioQuality: quality };
        setSettings(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        showToast(`Audio quality set to ${quality.toUpperCase()}`, 'success');
    };

    return (
        <div className="px-4 md:px-8 py-4 md:py-8 pb-24 md:pb-32 text-white max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in-up">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-4 md:mb-8">Settings</h1>

            {/* Account Settings */}
            <section className="space-y-4">
                <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-gray-200">
                    <Globe size={20} /> Account & Privacy
                </h2>
                <div className="glass-card rounded-2xl p-1 border border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center p-4 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleSetting('emailNotifications')}>
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${settings.emailNotifications ? 'bg-green-500/20 text-green-500' : 'bg-gray-800 text-gray-500'}`}>
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm md:text-base">Email Notifications</p>
                                <p className="text-xs md:text-sm text-gray-400">Receive updates about new releases</p>
                            </div>
                        </div>
                        <div className={`w-14 h-7 md:w-12 md:h-6 rounded-full transition-colors relative ${settings.emailNotifications ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-1 w-5 h-5 md:w-4 md:h-4 bg-white rounded-full shadow-lg transition-all ${settings.emailNotifications ? 'right-1' : 'left-1'}`}></div>
                        </div>
                    </div>
                    <div className="h-[1px] bg-white/5 mx-4"></div>
                    <div className="flex justify-between items-center p-4 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleSetting('publicProfile')}>
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${settings.publicProfile ? 'bg-blue-500/20 text-blue-500' : 'bg-gray-800 text-gray-500'}`}>
                                <Globe size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm md:text-base">Public Profile</p>
                                <p className="text-xs md:text-sm text-gray-400">Allow others to see your playlists</p>
                            </div>
                        </div>
                        <div className={`w-14 h-7 md:w-12 md:h-6 rounded-full transition-colors relative ${settings.publicProfile ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-1 w-5 h-5 md:w-4 md:h-4 bg-white rounded-full shadow-lg transition-all ${settings.publicProfile ? 'right-1' : 'left-1'}`}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Audio Quality */}
            <section className="space-y-4">
                <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-gray-200">
                    <Zap size={20} /> Audio Quality
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => setQuality('high')}
                        className={`glass-card p-4 md:p-6 rounded-2xl border cursor-pointer transition-all relative group ${settings.audioQuality === 'high' ? 'border-green-500/50 bg-green-500/5' : 'border-white/5 hover:border-white/10'}`}
                    >
                        {settings.audioQuality === 'high' && <div className="absolute top-4 right-4 text-green-500"><Check size={20} /></div>}
                        <div className={`p-3 rounded-full w-fit mb-4 ${settings.audioQuality === 'high' ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                            <Wifi size={24} />
                        </div>
                        <h3 className="font-bold text-base md:text-lg mb-1">High Fidelity</h3>
                        <p className="text-xs md:text-sm text-gray-400">Best for Wi-Fi. Streams at 320kbit/s for crystal clear audio.</p>
                    </div>

                    <div
                        onClick={() => setQuality('auto')}
                        className={`glass-card p-4 md:p-6 rounded-2xl border cursor-pointer transition-all relative group ${settings.audioQuality === 'auto' ? 'border-green-500/50 bg-green-500/5' : 'border-white/5 hover:border-white/10'}`}
                    >
                        {settings.audioQuality === 'auto' && <div className="absolute top-4 right-4 text-green-500"><Check size={20} /></div>}
                        <div className={`p-3 rounded-full w-fit mb-4 ${settings.audioQuality === 'auto' ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                            <Smartphone size={24} />
                        </div>
                        <h3 className="font-bold text-base md:text-lg mb-1">Automatic</h3>
                        <p className="text-xs md:text-sm text-gray-400">Adjusts based on your connection speed to prevent buffering.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Settings;
