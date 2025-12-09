import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        // Auto remove
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300); // Allow exit animation
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-24 right-4 md:right-8 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 min-w-[300px] transform transition-all duration-300 ease-out ${toast.isExiting ? 'translate-y-10 opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100 animate-fade-in-up'
                            } ${toast.type === 'success' ? 'bg-green-500/20 text-green-200' :
                                toast.type === 'error' ? 'bg-red-500/20 text-red-200' :
                                    'bg-blue-500/20 text-blue-200'
                            }`}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} className="shrink-0" />}
                        {toast.type === 'error' && <AlertCircle size={20} className="shrink-0" />}
                        {toast.type === 'info' && <Info size={20} className="shrink-0" />}

                        <p className="text-sm font-medium flex-1">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
