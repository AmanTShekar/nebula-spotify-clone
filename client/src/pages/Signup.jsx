import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Hexagon, Check } from 'lucide-react';

const Signup = () => {
    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    // Auth & Navigation
    const { register } = useAuth();
    const navigate = useNavigate();

    // Avatars: "Micah" style is cleaner, more modern/premium than "Adventurer"
    const avatars = [
        "https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=e0e7ff&baseColor=f9c9b6",
        "https://api.dicebear.com/7.x/micah/svg?seed=Willow&backgroundColor=ffdfbf&baseColor=ac6651",
        "https://api.dicebear.com/7.x/micah/svg?seed=Milo&backgroundColor=cffafe&baseColor=f9c9b6",
        "https://api.dicebear.com/7.x/micah/svg?seed=Oscar&backgroundColor=fce7f3&baseColor=ac6651",
    ];

    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await register(name, email, password, selectedAvatar);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f16] text-white relative overflow-auto p-4">
            {/* Background elements - Exactly matching Login.jsx */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
            <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none"></div>

            <div className="glass p-8 md:p-10 rounded-[2rem] w-full max-w-sm z-10 border border-white/5 shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] relative my-auto">
                {/* Header matches Login exactly */}
                <div className="flex justify-center mb-6">
                    <span className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                        <Hexagon size={32} className="text-white fill-white" /> Nebula
                    </span>
                </div>

                <h2 className="text-xl font-bold mb-6 text-center text-gray-200 tracking-wide">Create Account</h2>

                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl mb-4 text-xs text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Avatar Selection - Compact */}
                    <div className="flex flex-col gap-2 mb-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Select Avatar</label>
                        <div className="flex justify-center gap-3">
                            {avatars.map((ava, idx) => (
                                <div
                                    key={idx}
                                    className={`relative group cursor-pointer transition-all duration-300 ${selectedAvatar === ava ? 'scale-110 -translate-y-1' : 'hover:scale-105'}`}
                                    onClick={() => setSelectedAvatar(ava)}
                                >
                                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${selectedAvatar === ava ? 'border-indigo-500 shadow-md shadow-indigo-500/20' : 'border-transparent opacity-70 group-hover:opacity-100 group-hover:border-white/20'}`}>
                                        <img src={ava} alt="avatar" className="w-full h-full object-cover bg-white/5" />
                                    </div>
                                    {selectedAvatar === ava && (
                                        <div className="absolute bottom-0 right-0 bg-indigo-500 rounded-full p-0.5 border-2 border-[#18181b]">
                                            <Check size={8} className="text-white stroke-[3]" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="group">
                        <input
                            type="text"
                            placeholder="Display Name"
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition-all focus:bg-white/10 text-white placeholder-gray-500 text-sm font-medium"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="group">
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition-all focus:bg-white/10 text-white placeholder-gray-500 text-sm font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="group">
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition-all focus:bg-white/10 text-white placeholder-gray-500 text-sm font-medium"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className="bg-white text-black font-bold py-4 rounded-xl mt-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-white/20 uppercase tracking-widest text-xs">
                        Sign Up Free
                    </button>

                    <div className="text-center mt-2">
                        <Link to="/login" className="text-xs text-gray-500 hover:text-white transition-colors">Already have an account?</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
