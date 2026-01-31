import { useState, useEffect } from 'react';
import { taskAPI, userAPI } from '../services/api';

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLoading, setUserLoading] = useState(true);
    const [editingTask, setEditingTask] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        assignedTo: '',
        search: ''
    });

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, [filters]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.priority) params.priority = filters.priority;
            if (filters.assignedTo) params.assignedTo = filters.assignedTo;
            if (filters.search) params.search = filters.search;

            const response = await taskAPI.getAll(params);
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleUpdateTask = async () => {
        if (!editingTask) return;

        try {
            await taskAPI.update(editingTask.id, {
                title: editingTask.title,
                description: editingTask.description,
                status: editingTask.status,
                priority: editingTask.priority,
                dueDate: editingTask.dueDate,
                category: editingTask.category,
                estimatedHours: editingTask.estimatedHours,
                actualHours: editingTask.actualHours,
                assignedToId: editingTask.assignedToId
            });

            await fetchTasks();
            setEditingTask(null);
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task');
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await taskAPI.delete(id);
            await fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-600';
            case 'Medium': return 'text-yellow-600';
            case 'Low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    if (loading) {
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Manage Tasks</h2>
                <span className="text-sm text-gray-500">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search tasks..."
                    className="border rounded-lg px-4 py-2"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
                <select
                    className="border rounded-lg px-4 py-2"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                </select>
                <select
                    className="border rounded-lg px-4 py-2"
                    value={filters.priority}
                    onChange={(e) => setFilters({...filters, priority: e.target.value})}
                >
                    <option value="">All Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
                <select
                    className="border rounded-lg px-4 py-2"
                    value={filters.assignedTo}
                    onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
                    disabled={userLoading}
                >
                    <option value="">All Assignees</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.fullName}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tasks Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b text-left text-gray-600">
                            <th className="py-3">Title</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Due Date</th>
                            <th>Assigned To</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task) => (
                            <tr key={task.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 font-medium">
                                    <div>{task.title}</div>
                                    {task.description && (
                                        <div className="text-xs text-gray-500 truncate max-w-xs">
                                            {task.description}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className={`font-medium ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </td>
                                <td>
                                    {formatDate(task.dueDate)}
                                    {new Date(task.dueDate) < new Date() && task.status !== 'Completed' && (
                                        <div className="text-xs text-red-500">Overdue</div>
                                    )}
                                </td>
                                <td>
                                    {task.assignedToName ? (
                                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                            {task.assignedToName}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Unassigned</span>
                                    )}
                                </td>
                                <td className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => setEditingTask({...task})}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="text-red-600 hover:underline text-sm"
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

            {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No tasks found
                </div>
            )}

            {/* Edit Modal */}
            {editingTask && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-semibold mb-4">
                            Edit Task
                        </h3>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={editingTask.title}
                                onChange={(e) => setEditingTask({
                                    ...editingTask,
                                    title: e.target.value
                                })}
                                className="w-full border rounded-lg px-4 py-2"
                                placeholder="Task Title"
                            />

                            <textarea
                                value={editingTask.description || ''}
                                onChange={(e) => setEditingTask({
                                    ...editingTask,
                                    description: e.target.value
                                })}
                                className="w-full border rounded-lg px-4 py-2"
                                placeholder="Description"
                                rows={3}
                            />

                            <input
                                type="date"
                                value={editingTask.dueDate.split('T')[0]}
                                onChange={(e) => setEditingTask({
                                    ...editingTask,
                                    dueDate: e.target.value
                                })}
                                className="border rounded-lg px-4 py-2 w-full"
                            />

                            <select
                                value={editingTask.status}
                                onChange={(e) => setEditingTask({
                                    ...editingTask,
                                    status: e.target.value
                                })}
                                className="w-full border rounded-lg px-4 py-2"
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>

                            <select
                                value={editingTask.priority}
                                onChange={(e) => setEditingTask({
                                    ...editingTask,
                                    priority: e.target.value
                                })}
                                className="w-full border rounded-lg px-4 py-2"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>

                            {/* Assign To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign To
                                </label>
                                <select
                                    className="w-full border rounded-lg px-4 py-2"
                                    value={editingTask.assignedToId || ''}
                                    onChange={(e) => setEditingTask({
                                        ...editingTask,
                                        assignedToId: e.target.value ? parseInt(e.target.value) : null
                                    })}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.fullName} ({user.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Hours */}
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="number"
                                    placeholder="Estimated hours"
                                    value={editingTask.estimatedHours || ''}
                                    onChange={(e) => setEditingTask({
                                        ...editingTask,
                                        estimatedHours: e.target.value ? parseInt(e.target.value) : null
                                    })}
                                    className="border rounded-lg px-4 py-2"
                                />
                                <input
                                    type="number"
                                    placeholder="Actual hours"
                                    value={editingTask.actualHours || ''}
                                    onChange={(e) => setEditingTask({
                                        ...editingTask,
                                        actualHours: e.target.value ? parseInt(e.target.value) : null
                                    })}
                                    className="border rounded-lg px-4 py-2"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditingTask(null)}
                                className="px-4 py-2 rounded-lg border"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateTask}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
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