import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const skipVerification = useRef(false);
    const isLoggingOut = useRef(false); // Track logout state to prevent race conditions

    const logout = () => {
        isLoggingOut.current = true; // Set flag FIRST
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        setLoading(false);
        // Reset flag after a brief delay to allow components to unmount
        setTimeout(() => { isLoggingOut.current = false; }, 100);
    };

    useEffect(() => {
        const verifySession = async () => {
            // Don't do anything if we're in the process of logging out
            if (isLoggingOut.current) {
                setLoading(false);
                return;
            }

            if (token) {
                // Skip verification for guest token (it's not a real JWT)
                if (token === 'guest_token') {
                    setLoading(false);
                    return;
                }

                // Skip verification if token was just set by login/register
                if (skipVerification.current) {
                    skipVerification.current = false;
                    setLoading(false);
                    return;
                }

                // Optimistically load user from localStorage
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                // Verify with server to ensure token is still valid
                try {
                    const res = await axios.get(`${API_URL}/user/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Server is source of truth
                    if (res.data.user) {
                        setUser(res.data.user);
                        localStorage.setItem('user', JSON.stringify(res.data.user));
                    }
                    setLoading(false);
                } catch (err) {
                    // Silent logout on 401 - token is expired/invalid
                    if (err.response?.status === 401) {
                        console.log('Token expired or invalid, logging out...');
                        logout();
                    } else {
                        // For other errors (network, server down), keep user logged in
                        console.warn("Session verification failed (non-auth error):", err.message);
                        setLoading(false);
                    }
                }
            } else {
                setUser(null);
                localStorage.removeItem('user');
                setLoading(false);
            }
        };

        verifySession();
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });

            // Set loading to true to prevent other components from making requests
            setLoading(true);
            skipVerification.current = true; // Skip verification for this token

            setToken(res.data.token);
            setUser(res.data.user);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            // Set loading to false after a brief delay to ensure state is settled
            setTimeout(() => setLoading(false), 100);

            console.log('AuthContext: Login successful, token and user set');
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (name, email, password, image) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, image });
            skipVerification.current = true; // Skip verification for this token
            setToken(res.data.token);
            setUser(res.data.user);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const continueAsGuest = () => {
        const guestUser = { id: 'guest', name: 'Guest User', role: 'guest' };
        setUser(guestUser);
        setToken('guest_token');
        localStorage.setItem('token', 'guest_token');
        localStorage.setItem('user', JSON.stringify(guestUser));
        setLoading(false);
    };

    const updateUserProfile = async (data) => {
        try {
            const res = await axios.put(`${API_URL}/user/update-profile`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Update failed' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading, updateUserProfile, continueAsGuest, isLoggingOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
