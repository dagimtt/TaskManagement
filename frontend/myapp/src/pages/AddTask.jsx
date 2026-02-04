import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI, userAPI } from '../services/api';
import { X, UserPlus } from 'lucide-react';

export default function AddTask() {
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        category: '',
        estimatedHours: '',
        assignedUserIds: []  // Changed from assignedToId to array
    });
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]); // For display
    const [loading, setLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setUserLoading(true);
            const response = await userAPI.getAll({ active: true });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setUserLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!form.title.trim()) {
            setError('Title is required');
            return;
        }

        if (!form.dueDate) {
            setError('Due date is required');
            return;
        }

        setLoading(true);

        try {
            const taskData = {
                title: form.title,
                description: form.description,
                priority: form.priority,
                dueDate: form.dueDate,
                category: form.category || null,
                estimatedHours: form.estimatedHours ? parseInt(form.estimatedHours) : null,
                assignedUserIds: form.assignedUserIds // Send array instead of single ID
            };

            await taskAPI.create(taskData);
            
            setSuccess('Task created successfully!');
            setForm({
                title: '',
                description: '',
                priority: 'Medium',
                dueDate: '',
                category: '',
                estimatedHours: '',
                assignedUserIds: []
            });
            setSelectedUsers([]);

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/tasks');
            }, 2000);

        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = (e) => {
        const userId = parseInt(e.target.value);
        if (userId && !form.assignedUserIds.includes(userId)) {
            const user = users.find(u => u.id === userId);
            if (user) {
                setForm(prev => ({
                    ...prev,
                    assignedUserIds: [...prev.assignedUserIds, userId]
                }));
                setSelectedUsers(prev => [...prev, user]);
                e.target.value = ''; // Reset select
            }
        }
    };

    const handleRemoveUser = (userId) => {
        setForm(prev => ({
            ...prev,
            assignedUserIds: prev.assignedUserIds.filter(id => id !== userId)
        }));
        setSelectedUsers(prev => prev.filter(user => user.id !== userId));
    };

    const today = new Date().toISOString().split('T')[0];

    // Get available users (not already selected)
    const availableUsers = users.filter(user => 
        !form.assignedUserIds.includes(user.id)
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Add Task</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Task Title */}
                <input
                    type="text"
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Task title"
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    required
                    disabled={loading}
                />

                {/* Description */}
                <textarea
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Task description"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    disabled={loading}
                />

                {/* Due Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                    </label>
                    <input
                        type="date"
                        className="w-full border rounded-lg px-4 py-2"
                        min={today}
                        value={form.dueDate}
                        onChange={(e) => setForm({...form, dueDate: e.target.value})}
                        required
                        disabled={loading}
                    />
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                    </label>
                    <select
                        className="w-full border rounded-lg px-4 py-2"
                        value={form.priority}
                        onChange={(e) => setForm({...form, priority: e.target.value})}
                        disabled={loading}
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>

                {/* Category */}
                <input
                    type="text"
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Category (optional)"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    disabled={loading}
                />

                {/* Estimated Hours */}
                <input
                    type="number"
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Estimated hours (optional)"
                    min="1"
                    value={form.estimatedHours}
                    onChange={(e) => setForm({...form, estimatedHours: e.target.value})}
                    disabled={loading}
                />

                {/* Assign To Multiple Users */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign To (optional)
                        <span className="text-xs text-gray-500 ml-2">
                            {form.assignedUserIds.length > 0 
                                ? `${form.assignedUserIds.length} user(s) selected` 
                                : 'Select users'}
                        </span>
                    </label>

                    {/* Selected Users Display */}
                    {selectedUsers.length > 0 && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                            <div className="flex flex-wrap gap-2">
                                {selectedUsers.map(user => (
                                    <div 
                                        key={user.id}
                                        className="flex items-center gap-2 bg-white border rounded-full px-3 py-1 text-sm"
                                    >
                                        <span className="font-medium">
                                            {user.fullName}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUser(user.id)}
                                            className="text-gray-400 hover:text-red-500"
                                            disabled={loading}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User Selection */}
                    {userLoading ? (
                        <div className="border rounded-lg px-4 py-2 text-gray-500">
                            Loading users...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <UserPlus size={18} className="text-gray-400" />
                            <select
                                className="w-full border rounded-lg px-4 py-2"
                                onChange={handleUserSelect}
                                disabled={loading || availableUsers.length === 0}
                            >
                                <option value="">Select a user to assign...</option>
                                {availableUsers.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullName} ({user.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {availableUsers.length === 0 && form.assignedUserIds.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                            All available users have been assigned to this task.
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        className="bg-[#073954] text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                        disabled={loading}
                    >
                        {loading ? 'Creating Task...' : 'Save Task'}
                    </button>
                </div>
            </form>
        </div>
    );
}