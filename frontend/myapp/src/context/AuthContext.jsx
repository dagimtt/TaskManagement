import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, roleAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const savedPermissions = localStorage.getItem('permissions');
        
        if (token && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                
                if (savedPermissions) {
                    setUserPermissions(JSON.parse(savedPermissions));
                } else if (parsedUser.roleId) {
                    fetchUserPermissions(parsedUser.roleId);
                }
            } catch (err) {
                console.error('Error parsing user data:', err);
                clearAuthData();
            }
        }
        setLoading(false);
    }, []);

    const fetchUserPermissions = async (roleId) => {
        try {
            const response = await roleAPI.getRolePermissions(roleId);
            setUserPermissions(response.data);
            localStorage.setItem('permissions', JSON.stringify(response.data));
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const clearAuthData = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        setUser(null);
        setUserPermissions(null);
    };

    // Dynamic permission checking with your 14 permissions
    const hasPermission = (permissionKey) => {
        if (!userPermissions) return false;
        
        // Map frontend permission keys to backend property names
        const permissionMap = {
            // Task permissions
            'TASK_VIEW_ALL': 'canViewAllTasks',
            'TASK_EDIT_ALL': 'canEditAllTasks',
            'TASK_CREATE': 'canCreateTasks',
            'TASK_DELETE': 'canDeleteTasks',
            'TASK_ASSIGN': 'canAssignTasks',
            
            // User permissions
            'USER_VIEW_ALL': 'canViewAllUsers',
            'USER_CREATE': 'canCreateUsers',
            'USER_EDIT': 'canEditUsers',
            'USER_DELETE': 'canDeleteUsers',
            
            // System permissions
            'ROLE_MANAGE': 'canManageRoles',
            'PERMISSION_MANAGE': 'canManagePermissions',
            'REPORT_VIEW': 'canViewReports',
            'DATA_EXPORT': 'canExportData'
        };

        const backendProperty = permissionMap[permissionKey];
        if (!backendProperty) {
            console.warn(`Unknown permission key: ${permissionKey}`);
            return false;
        }
        
        return userPermissions[backendProperty] === true;
    };

    // Check if user has any of the given permissions
    const hasAnyPermission = (permissionKeys) => {
        return permissionKeys.some(key => hasPermission(key));
    };

    // Check if user has all of the given permissions
    const hasAllPermissions = (permissionKeys) => {
        return permissionKeys.every(key => hasPermission(key));
    };

    const login = async (credentials) => {
        try {
            setError('');
            const response = await authAPI.login(credentials);
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            
            // Fetch permissions for the user's role
            if (user.roleId) {
                await fetchUserPermissions(user.roleId);
            }
            
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        clearAuthData();
        window.location.href = '/login';
    };

    const refreshPermissions = async () => {
        if (user?.roleId) {
            await fetchUserPermissions(user.roleId);
        }
    };

    const value = {
        user,
        userPermissions,
        loading,
        error,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refreshPermissions,
        setError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};