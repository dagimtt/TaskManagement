// services/api.js
import axios from 'axios';

// For Vite: use import.meta.env.VITE_API_URL
// For Create React App: use process.env.REACT_APP_API_URL
const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';

const API = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Debug log to verify API URL is loaded
console.log('API Base URL:', API_URL);

// Add token to requests
API.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for error handling
API.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth services
export const authAPI = {
    login: (credentials) => API.post('/auth/login', credentials),
    register: (userData) => API.post('/auth/register', userData),
    getCurrentUser: () => API.get('/auth/me'),
    changePassword: (data) => API.post('/auth/change-password', data)
};

// User services
export const userAPI = {
    getAll: (params) => API.get('/users', { params }),
    getById: (id) => API.get(`/users/${id}`),
    create: (user) => API.post('/users', user),
    update: (id, user) => API.put(`/users/${id}`, user),
    delete: (id) => API.delete(`/users/${id}`),
    getStats: () => API.get('/users/stats')
};

// Task services
export const taskAPI = {
    getAll: (params) => API.get('/tasks', { params }),
    getById: (id) => API.get(`/tasks/${id}`),
    create: (task) => API.post('/tasks', task),
    update: (id, task) => API.put(`/tasks/${id}`, task),
    delete: (id) => API.delete(`/tasks/${id}`),
    getStats: () => API.get('/tasks/stats')
};

// Role services
export const roleAPI = {
    getAll: () => API.get('/roles'),
    getById: (id) => API.get(`/roles/${id}`),
    create: (role) => API.post('/roles', role),
    update: (id, role) => API.put(`/roles/${id}`, role),
    delete: (id) => API.delete(`/roles/${id}`)
};

export default API;