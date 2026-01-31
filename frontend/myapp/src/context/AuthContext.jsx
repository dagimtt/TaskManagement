// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

// Create context
const AuthContext = createContext();

// Create custom hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Create provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (err) {
                console.error('Error parsing user data:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    // Add hasPermission function here
    const hasPermission = (permission) => {
        if (!user || !user.role) return false;
        
        const permissionMap = {
            'TASK_ASSIGN': ['Admin', 'Manager', 'User'],
            'USER_VIEW': ['Admin', 'Manager'],
            'USER_CREATE': ['Admin', 'Manager'],
            'ROLE_MANAGE': ['Admin'],
            'PERMISSION_MANAGE': ['Admin']
        };

        if (permissionMap[permission]) {
            return permissionMap[permission].includes(user.role);
        }
        
        return false;
    };

    const login = async (credentials) => {
        try {
            setError('');
            const response = await authAPI.login(credentials);
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    const register = async (userData) => {
        try {
            setError('');
            const response = await authAPI.register(userData);
            return { success: true, data: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const changePassword = async (data) => {
        try {
            setError('');
            await authAPI.changePassword(data);
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Password change failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        register,
        changePassword,
        hasPermission,
        setError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Also export the context itself if needed elsewhere
export default AuthContext;