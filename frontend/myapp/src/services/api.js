// services/api.js
import axios from 'axios';

// For Vite: use import.meta.env.VITE_API_URL
// For Create React App: use process.env.REACT_APP_API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5136/api';

// Enhanced debug logging
console.log('=== API Configuration ===');
console.log('API URL:', API_URL);
console.log('Environment mode:', import.meta.env.MODE);
console.log('Full import.meta.env:', import.meta.env);

const API = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 15000, // 15 second timeout
    withCredentials: false // Set to true if using cookies with CORS
});

// Enhanced request interceptor with debugging
API.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    
    console.log('=== Request Interceptor ===');
    console.log('Request URL:', config.baseURL + config.url);
    console.log('Request method:', config.method?.toUpperCase());
    console.log('Request params:', config.params);
    console.log('Request data:', config.data);
    console.log('Token exists:', !!token);
    
    if (token) {
        // Validate token format
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const isExpired = payload.exp && payload.exp < Date.now() / 1000;
                console.log('Token payload:', {
                    userId: payload.nameid || payload.sub,
                    role: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
                    expires: new Date(payload.exp * 1000).toLocaleString(),
                    isExpired
                });
                
                if (isExpired) {
                    console.warn('Token is expired!');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('permissions');
                    window.location.href = '/login';
                    throw new axios.Cancel('Token expired');
                }
            } else {
                console.warn('Invalid token format');
            }
        } catch (e) {
            console.error('Token parsing error:', e);
        }
        
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Authorization header added');
    } else {
        console.warn('No authentication token found');
    }
    
    return config;
}, error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
});

// Enhanced response interceptor with detailed error handling
API.interceptors.response.use(
    response => {
        console.log('=== Response Success ===');
        console.log('URL:', response.config.url);
        console.log('Status:', response.status);
        console.log('Data type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
        console.log('Data preview:', Array.isArray(response.data) 
            ? `Array[${response.data.length}]` 
            : JSON.stringify(response.data).substring(0, 200) + '...');
        return response;
    },
    error => {
        console.error('=== Response Error ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (axios.isCancel(error)) {
            console.error('Request was cancelled:', error.message);
            return Promise.reject({ 
                isCancel: true, 
                message: 'Request cancelled' 
            });
        }
        
        if (error.response) {
            // Server responded with error status
            console.error('Status:', error.response.status);
            console.error('Status text:', error.response.statusText);
            console.error('Response data:', error.response.data);
            console.error('Request URL:', error.config?.url);
            console.error('Request method:', error.config?.method?.toUpperCase());
            console.error('Request headers:', error.config?.headers);
            
            // Handle specific status codes
            if (error.response.status === 401) {
                console.log('Unauthorized (401) - redirecting to login');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('permissions');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            } else if (error.response.status === 500) {
                console.error('Server Error 500 - Check backend logs');
                console.error('Full error response:', error.response.data);
                
                // Extract more details from 500 error
                if (error.response.data) {
                    const errorData = error.response.data;
                    console.error('500 Error Details:', {
                        message: errorData.message || 'Internal server error',
                        error: errorData.error || errorData.detail,
                        stackTrace: errorData.stackTrace,
                        type: errorData.type
                    });
                }
            } else if (error.response.status === 404) {
                console.error('Not Found 404 - Endpoint does not exist');
            } else if (error.response.status === 400) {
                console.error('Bad Request 400 - Validation error');
                console.error('Validation errors:', error.response.data.errors);
            }
            
        } else if (error.request) {
            // Request was made but no response received
            console.error('No response received from server');
            console.error('Request object:', error.request);
            console.error('Possible causes:');
            console.error('1. Backend server is not running');
            console.error('2. Network connectivity issue');
            console.error('3. CORS policy blocking the request');
            console.error('4. Wrong API URL or port');
            console.error('5. Server timeout');
            
            // Test if backend is reachable
            console.log('Testing backend connectivity...');
            fetch(API_URL.replace('/api', '/health').replace('/api', ''))
                .then(res => console.log('Backend health check:', res.status))
                .catch(err => console.error('Backend not reachable:', err));
                
        } else {
            // Something happened in setting up the request
            console.error('Request setup error:', error.message);
            console.error('Full error:', error);
        }
        
        console.error('Complete error object:', {
            name: error.name,
            message: error.message,
            code: error.code,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL,
                timeout: error.config?.timeout
            },
            request: error.request ? 'Exists' : 'None',
            response: error.response ? `Status: ${error.response.status}` : 'None'
        });
        
        return Promise.reject(error);
    }
);

// Helper function to test API connection
export const testAPIConnection = async () => {
    try {
        console.log('Testing API connection to:', API_URL);
        
        // Test 1: Check if backend is reachable
        const healthResponse = await fetch(API_URL.replace('/api', '/health').replace('/api', ''));
        console.log('Backend health check:', healthResponse.status);
        
        // Test 2: Test tasks endpoint
        const response = await API.get('/tasks', { 
            params: { limit: 1 },
            timeout: 5000 
        });
        
        return {
            success: true,
            status: response.status,
            data: response.data,
            message: 'API connection successful',
            backendReachable: healthResponse.ok
        };
    } catch (error) {
        console.error('API connection test failed:', error);
        
        return {
            success: false,
            status: error.response?.status || 0,
            message: error.message || 'Connection failed',
            error: error.response?.data,
            backendReachable: false
        };
    }
};

// Auth services
export const authAPI = {
    login: (credentials) => API.post('/auth/login', credentials),
    register: (userData) => API.post('/auth/register', userData),
    getCurrentUser: () => API.get('/auth/me'),
    changePassword: (data) => API.post('/auth/change-password', data),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        return Promise.resolve();
    }
};

// User services
export const userAPI = {
    getAll: (params) => {
        console.log('Fetching users with params:', params);
        return API.get('/users', { params });
    },
    getById: (id) => API.get(`/users/${id}`),
    create: (user) => {
        console.log('Creating user:', user);
        return API.post('/users', user);
    },
    update: (id, user) => {
        console.log('Updating user:', id, user);
        return API.put(`/users/${id}`, user);
    },
    delete: (id) => API.delete(`/users/${id}`),
    getStats: () => API.get('/users/stats')
};

// Task services - UPDATED to handle backend/frontend mismatch
export const taskAPI = {
    getAll: (params) => {
        console.log('=== TaskAPI.getAll ===');
        console.log('Input params:', params);
        
        // Clean and validate params
        const cleanParams = {};
        if (params) {
            if (params.status && params.status.trim()) cleanParams.status = params.status.trim();
            if (params.priority && params.priority.trim()) cleanParams.priority = params.priority.trim();
            if (params.assignedTo && params.assignedTo.toString().trim()) cleanParams.assignedTo = params.assignedTo.toString().trim();
            if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
            
            // Add pagination/sorting defaults
            cleanParams.sortBy = params.sortBy || 'createdAt';
            cleanParams.sortOrder = params.sortOrder || 'desc';
        }
        
        console.log('Cleaned params:', cleanParams);
        console.log('Full URL:', `${API_URL}/tasks?${new URLSearchParams(cleanParams).toString()}`);
        
        return API.get('/tasks', { params: cleanParams });
    },
    
    getById: (id) => {
        console.log('Fetching task by ID:', id);
        return API.get(`/tasks/${id}`);
    },
    
    create: (task) => {
        console.log('=== TaskAPI.create ===');
        console.log('Frontend task data:', task);
        
        // Transform for backend
        const backendTask = {
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'Medium',
            dueDate: task.dueDate,
            category: task.category || '',
            estimatedHours: task.estimatedHours,
            // Send as array for multiple users
            assignedUserIds: task.assignedUserIds || (task.assignedToId ? [task.assignedToId] : [])
        };
        
        console.log('Transformed for backend:', backendTask);
        return API.post('/tasks', backendTask);
    },
    
    update: (id, task) => {
        console.log('=== TaskAPI.update ===');
        console.log('Task ID:', id);
        console.log('Frontend task data:', task);
        
        // Remove frontend-specific properties
        const { assignedToId, assignedToName, ...rest } = task;
        
        // Transform for backend - ensure we send the right structure
        const backendTask = {
            ...rest,
            // Send as array for multiple users
            assignedUserIds: task.assignedUserIds || (task.assignedToId ? [task.assignedToId] : [])
        };
        
        // Clean up empty values
        Object.keys(backendTask).forEach(key => {
            if (backendTask[key] === undefined || backendTask[key] === null || backendTask[key] === '') {
                delete backendTask[key];
            }
        });
        
        console.log('Transformed for backend:', backendTask);
        console.log('Sending to:', `${API_URL}/tasks/${id}`);
        
        return API.put(`/tasks/${id}`, backendTask);
    },
    
    delete: (id) => {
        console.log('Deleting task:', id);
        return API.delete(`/tasks/${id}`);
    },
    
    getStats: () => {
        console.log('Getting task stats');
        return API.get('/tasks/stats');
    }
};

// Role services
export const roleAPI = {
    getAll: () => API.get('/roles'),
    getById: (id) => API.get(`/roles/${id}`),
    create: (roleData) => API.post('/roles', roleData),
    update: (id, roleData) => API.put(`/roles/${id}`, roleData),
    delete: (id) => API.delete(`/roles/${id}`),
    getRolePermissions: (roleId) => API.get(`/roles/${roleId}/permissions`),
    updateRolePermissions: (roleId, permissions) => 
        API.put(`/roles/${roleId}/permissions`, permissions)
};

// Health check endpoints
export const healthAPI = {
    check: () => API.get('/health'),
    checkBackend: () => fetch(API_URL.replace('/api', '/health').replace('/api', ''))
        .then(res => ({ status: res.status, ok: res.ok }))
        .catch(() => ({ status: 0, ok: false }))
};

// Debug utility to check localStorage
export const debugStorage = () => {
    console.log('=== LocalStorage Debug ===');
    console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('User:', localStorage.getItem('user') || 'Not set');
    console.log('Permissions:', localStorage.getItem('permissions') || 'Not set');
    
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload);
        } catch (e) {
            console.error('Failed to parse token:', e);
        }
    }
};

// Test endpoint directly without axios
export const testEndpointDirectly = async (endpoint = '/tasks') => {
    try {
        const token = localStorage.getItem('token');
        const url = `${API_URL}${endpoint}`;
        
        console.log('Testing endpoint directly:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Direct test status:', response.status);
        const text = await response.text();
        
        try {
            const data = JSON.parse(text);
            console.log('Direct test data:', data);
            return { status: response.status, data };
        } catch {
            console.log('Direct test response (not JSON):', text.substring(0, 500));
            return { status: response.status, text };
        }
        
    } catch (error) {
        console.error('Direct test error:', error);
        throw error;
    }
};

export default API;