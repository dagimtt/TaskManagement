import { useState, useEffect, useCallback, useRef } from 'react';
import { taskAPI, userAPI } from '../services/api';

// Custom debounce function (no lodash dependency)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState({ 
        tasks: true, 
        users: true,
        initial: true 
    });
    const [editingTask, setEditingTask] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        assignedTo: '',
        search: ''
    });
    const [error, setError] = useState(null);
    const [debugMode, setDebugMode] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    
    // Use ref to persist debounced function
    const debouncedFetchTasksRef = useRef(
        debounce(() => {
            if (!loading.initial) {
                fetchTasks();
            }
        }, 500)
    );

    // Initial load
    useEffect(() => {
        console.log('=== Tasks Component Mounted ===');
        console.log('Environment API URL:', import.meta.env.VITE_API_URL);
        
        const loadData = async () => {
            try {
                setLoading(prev => ({...prev, initial: true}));
                await Promise.all([
                    fetchTasks(),
                    fetchUsers()
                ]);
            } catch (error) {
                console.error('Initial load failed:', error);
            } finally {
                setLoading(prev => ({...prev, initial: false}));
            }
        };
        
        loadData();
    }, []);

    // Handle filter changes with debouncing
    useEffect(() => {
        if (filters.search) {
            debouncedFetchTasksRef.current();
        } else {
            const timer = setTimeout(() => {
                if (!loading.initial) {
                    fetchTasks();
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [filters.status, filters.priority, filters.assignedTo, filters.search]);

    const fetchTasks = async () => {
        try {
            setLoading(prev => ({...prev, tasks: true}));
            setError(null);
            
            console.log('=== Fetching Tasks ===');
            console.log('Filters:', filters);
            
            // Build params with validation
            const params = {};
            if (filters.status && filters.status.trim()) params.status = filters.status.trim();
            if (filters.priority && filters.priority.trim()) params.priority = filters.priority.trim();
            if (filters.assignedTo && filters.assignedTo.trim()) params.assignedTo = filters.assignedTo.trim();
            if (filters.search && filters.search.trim()) params.search = filters.search.trim();
            
            console.log('Sending params:', params);
            
            // Add request timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await taskAPI.getAll({ 
                params,
                signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            console.log('Response received:', response);
            
            // Transform data for frontend
            const transformedTasks = Array.isArray(response.data) ? response.data.map(task => ({
                ...task,
                // Handle multiple assigned users - take first one for display
                assignedToName: task.assignedUsers && task.assignedUsers.length > 0 
                    ? task.assignedUsers[0].fullName 
                    : null,
                assignedToId: task.assignedUsers && task.assignedUsers.length > 0 
                    ? task.assignedUsers[0].id 
                    : null
            })) : [];
            
            setTasks(transformedTasks);
            console.log(`Loaded ${transformedTasks.length} tasks`);
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('=== Task Fetch Error ===');
            console.error('Error:', error);
            
            let errorMessage = 'Failed to load tasks';
            let statusCode = 0;
            let showRetry = true;
            
            if (error.name === 'AbortError') {
                errorMessage = 'Request timeout (15 seconds). Server might be slow or unresponsive.';
                statusCode = 408;
            } else if (error.response) {
                statusCode = error.response.status;
                
                if (error.response.data) {
                    console.error('Server error data:', error.response.data);
                    
                    if (typeof error.response.data === 'string') {
                        errorMessage = error.response.data;
                    } else if (error.response.data.message) {
                        errorMessage = error.response.data.message;
                    } else if (error.response.data.error) {
                        errorMessage = error.response.data.error;
                    }
                }
                
                if (statusCode === 500) {
                    errorMessage = 'Server Error (500). Please check backend logs.';
                } else if (statusCode === 401) {
                    errorMessage = 'Session expired. Please login again.';
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    showRetry = false;
                } else if (statusCode === 404) {
                    errorMessage = 'API endpoint not found. Check API configuration.';
                } else if (statusCode === 400) {
                    errorMessage = 'Bad request. Please check filter values.';
                }
            } else if (error.request) {
                errorMessage = 'Cannot connect to server. Is the backend running?';
                console.error('No response received. Check:');
                console.error('1. Backend server is running');
                console.error('2. Correct API URL');
                console.error('3. No CORS issues');
            } else {
                errorMessage = error.message || 'Network error occurred';
            }
            
            setError({
                message: errorMessage,
                status: statusCode,
                showRetry,
                timestamp: new Date().toISOString()
            });
            
            setTasks([]);
            
        } finally {
            setLoading(prev => ({...prev, tasks: false}));
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(prev => ({...prev, users: true}));
            console.log('Fetching users...');
            
            const response = await userAPI.getAll({ active: true });
            console.log('Users response:', response);
            
            if (response.data && Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                setUsers([]);
            }
            
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setLoading(prev => ({...prev, users: false}));
        }
    };

    const handleUpdateTask = async () => {
        if (!editingTask) return;

        try {
            console.log('Updating task:', editingTask.id, editingTask);
            
            // Prepare data for backend - transform to match backend DTO
            const updateData = {
                title: editingTask.title,
                description: editingTask.description || '',
                status: editingTask.status,
                priority: editingTask.priority,
                dueDate: editingTask.dueDate,
                category: editingTask.category || '',
                estimatedHours: editingTask.estimatedHours ? 
                    parseFloat(editingTask.estimatedHours) : null,
                actualHours: editingTask.actualHours ? 
                    parseFloat(editingTask.actualHours) : null,
                // Send as array for multiple users (backend expects assignedUserIds)
                assignedUserIds: selectedUserIds.length > 0 ? selectedUserIds : []
            };

            console.log('Sending update data:', updateData);
            
            await taskAPI.update(editingTask.id, updateData);
            await fetchTasks();
            
            setEditingTask(null);
            setSelectedUserIds([]);
            
            alert('Task updated successfully!');
            
        } catch (error) {
            console.error('Update error details:', error);
            alert(`Failed to update task: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            console.log('Deleting task:', id);
            await taskAPI.delete(id);
            await fetchTasks();
            alert('Task deleted successfully!');
        } catch (error) {
            console.error('Delete error:', error);
            alert(`Failed to delete task: ${error.response?.data?.message || error.message}`);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            console.error('Date formatting error:', e);
            return 'Invalid date';
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
            case 'in progress': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-red-600 font-bold';
            case 'medium': return 'text-yellow-600 font-semibold';
            case 'low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            priority: '',
            assignedTo: '',
            search: ''
        });
    };

    const retryConnection = async () => {
        setError(null);
        await fetchTasks();
    };

    const testDirectConnection = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5136/api';
            const url = `${baseURL}/tasks`;
            
            console.log('Testing direct connection to:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Direct test status:', response.status);
            const data = await response.text();
            console.log('Direct test response:', data);
            
            alert(`Direct test: Status ${response.status}\nResponse: ${data.substring(0, 200)}...`);
            
        } catch (error) {
            console.error('Direct test error:', error);
            alert(`Direct test failed: ${error.message}`);
        }
    };

    // When editing task opens, initialize selected users
    useEffect(() => {
        if (editingTask) {
            if (editingTask.assignedUsers && editingTask.assignedUsers.length > 0) {
                setSelectedUserIds(editingTask.assignedUsers.map(u => u.id));
            } else if (editingTask.assignedToId) {
                setSelectedUserIds([editingTask.assignedToId]);
            } else {
                setSelectedUserIds([]);
            }
        }
    }, [editingTask]);

    if (loading.initial) {
        return (
            <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-semibold mb-6">Manage Tasks</h2>
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow">
            {/* Debug Panel */}
            {debugMode && (
                <div className="mb-4 p-4 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold">Debug Information</h3>
                        <button 
                            onClick={() => setDebugMode(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            Hide
                        </button>
                    </div>
                    <div className="space-y-1">
                        <div>API URL: {import.meta.env.VITE_API_URL || 'Not set'}</div>
                        <div>Tasks loaded: {tasks.length}</div>
                        <div>Users loaded: {users.length}</div>
                        <div>Token present: {localStorage.getItem('token') ? 'Yes' : 'No'}</div>
                        <div>Current filters: {JSON.stringify(filters)}</div>
                        <div>Selected user IDs: {JSON.stringify(selectedUserIds)}</div>
                        {error && (
                            <div className="text-red-300">
                                Error {error.status}: {error.message}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold">Manage Tasks</h2>
                    {error && !loading.tasks && (
                        <p className="text-sm text-red-600 mt-1">
                            Error: {error.message}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                        {loading.tasks ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>
                                Loading...
                            </span>
                        ) : (
                            `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`
                        )}
                    </span>
                    <button
                        onClick={() => setDebugMode(!debugMode)}
                        className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                        title="Toggle debug mode"
                    >
                        {debugMode ? 'Hide Debug' : 'Debug'}
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && !loading.tasks && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h3 className="text-red-800 font-medium">
                                Error {error.status || 'Connection Failed'}
                            </h3>
                            <p className="text-red-600 text-sm">{error.message}</p>
                            <p className="text-red-500 text-xs mt-1">
                                {error.timestamp && new Date(error.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {error.showRetry !== false && (
                                <button
                                    onClick={retryConnection}
                                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                                >
                                    Retry
                                </button>
                            )}
                            <button
                                onClick={testDirectConnection}
                                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                                title="Test API directly"
                            >
                                Test API
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    window.location.href = '/login';
                                }}
                                className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded"
                            >
                                Re-login
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Search tasks..."
                    className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    disabled={loading.tasks}
                />
                <select
                    className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    disabled={loading.tasks}
                >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                </select>
                <select
                    className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.priority}
                    onChange={(e) => setFilters({...filters, priority: e.target.value})}
                    disabled={loading.tasks}
                >
                    <option value="">All Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
                <select
                    className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.assignedTo}
                    onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
                    disabled={loading.users || loading.tasks}
                >
                    <option value="">All Assignees</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.fullName}
                        </option>
                    ))}
                </select>
                {(filters.status || filters.priority || filters.assignedTo || filters.search) && (
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                        disabled={loading.tasks}
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Tasks Table */}
            {!loading.tasks && tasks.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-gray-600">
                                <th className="py-3 px-4 font-medium">Title</th>
                                <th className="py-3 px-4 font-medium">Status</th>
                                <th className="py-3 px-4 font-medium">Priority</th>
                                <th className="py-3 px-4 font-medium">Due Date</th>
                                <th className="py-3 px-4 font-medium">Assigned To</th>
                                <th className="py-3 px-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-gray-900">{task.title}</div>
                                        {task.description && (
                                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                {task.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                            {task.status || 'Not Set'}
                                        </span>
                                    </td>
                                    <td className={`py-3 px-4 ${getPriorityColor(task.priority)}`}>
                                        {task.priority || 'Not Set'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div>{formatDate(task.dueDate)}</div>
                                        {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed' && (
                                            <div className="text-xs text-red-500 font-medium mt-1">Overdue</div>
                                        )}
                                    </td>
                                   <td className="py-3 px-4">
    {task.assignedUsers && task.assignedUsers.length > 0 ? (
        <div className="flex flex-wrap gap-1">
            {task.assignedUsers.map((user, index) => (
                <span 
                    key={`${task.id}-user-${user.id}`} 
                    className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200"
                    title={`${user.fullName} (${user.role || 'No Role'})`}
                >
                    {user.fullName}
                    {task.assignedUsers.length > 1 && index < 2 && task.assignedUsers.length > 3 && index === 1 ? '...' : ''}
                </span>
            ))}
            {task.assignedUsers.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">
                    +{task.assignedUsers.length - 2} more
                </span>
            )}
        </div>
    ) : (
        <span className="text-gray-400 text-sm">Unassigned</span>
    )}
</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={() => setEditingTask(task)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                disabled={loading.tasks}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                                                disabled={loading.tasks}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : !loading.tasks ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
                    <p className="text-gray-500 mb-4">
                        {error ? 'Error loading tasks' : 'No tasks match your filters'}
                    </p>
                    {(filters.status || filters.priority || filters.assignedTo || filters.search) && (
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Clear filters to see all tasks
                        </button>
                    )}
                </div>
            ) : null}

            {/* Loading skeleton */}
            {loading.tasks && tasks.length === 0 && (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                            <div className="h-6 bg-gray-200 rounded w-24"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal - Updated for multiple user selection */}
            {editingTask && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">
                                Edit Task
                            </h3>
                            <button
                                onClick={() => {
                                    setEditingTask(null);
                                    setSelectedUserIds([]);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    value={editingTask.title || ''}
                                    onChange={(e) => setEditingTask({
                                        ...editingTask,
                                        title: e.target.value
                                    })}
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Enter task title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={editingTask.description || ''}
                                    onChange={(e) => setEditingTask({
                                        ...editingTask,
                                        description: e.target.value
                                    })}
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Task description"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                                        onChange={(e) => setEditingTask({
                                            ...editingTask,
                                            dueDate: e.target.value
                                        })}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={editingTask.status || 'Pending'}
                                        onChange={(e) => setEditingTask({
                                            ...editingTask,
                                            status: e.target.value
                                        })}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={editingTask.priority || 'Medium'}
                                        onChange={(e) => setEditingTask({
                                            ...editingTask,
                                            priority: e.target.value
                                        })}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Assign To (Multiple)
                                    </label>
                                    <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                                        {users.map(user => (
                                            <label key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.includes(user.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedUserIds([...selectedUserIds, user.id]);
                                                        } else {
                                                            setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                                                        }
                                                    }}
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">
                                                    {user.fullName} {user.role && `(${user.role})`}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {selectedUserIds.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Selected: {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estimated Hours
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={editingTask.estimatedHours || ''}
                                        onChange={(e) => setEditingTask({
                                            ...editingTask,
                                            estimatedHours: e.target.value ? parseFloat(e.target.value) : null
                                        })}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        min="0"
                                        step="0.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Actual Hours
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={editingTask.actualHours || ''}
                                        onChange={(e) => setEditingTask({
                                            ...editingTask,
                                            actualHours: e.target.value ? parseFloat(e.target.value) : null
                                        })}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        min="0"
                                        step="0.5"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                            <button
                                onClick={() => {
                                    setEditingTask(null);
                                    setSelectedUserIds([]);
                                }}
                                className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateTask}
                                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}