import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Hexagon } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await login(email, password);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f16] text-white relative overflow-hidden p-4">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
            <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none"></div>

            <div className="glass p-8 md:p-12 rounded-[2rem] w-full max-w-sm z-10 border border-white/5 shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] relative">
                <div className="flex justify-center mb-8">
                    <span className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                        <Hexagon size={32} className="text-white fill-white" /> Nebula
                    </span>
                </div>

                <h2 className="text-xl font-bold mb-6 text-center text-gray-200 tracking-wide">Welcome Back</h2>

                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg mb-6 text-xs text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="group">
                        <input
                            type="email"
                            placeholder="Email or Username"
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
                        Log In
                    </button>
                    <div className="text-center mt-2">
                        <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Forgot validation?</a>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-gray-500 text-xs">
                        Don't have an account? <Link to="/signup" className="text-white hover:underline font-bold transition-colors ml-1">Sign up free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
