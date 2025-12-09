import { Wrench } from 'lucide-react';

const Maintenance = () => {
    return (
        <div className="h-screen w-screen bg-[#0f0f16] flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Wrench size={48} className="text-indigo-400" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Under Maintenance</h1>
            <p className="text-gray-400 max-w-md text-lg">
                We're currently updating the system to bring you a better experience.
                Please check back shortly.
            </p>
            <div className="mt-8 text-sm text-gray-600 font-mono">
                Error Code: 503 | System Update
            </div>
        </div>
    );
};

export default Maintenance;
