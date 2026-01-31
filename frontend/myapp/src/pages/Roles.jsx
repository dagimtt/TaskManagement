import { useState, useEffect } from 'react';
import { roleAPI } from '../services/api';

export default function Roles() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await roleAPI.getAll();
            setRoles(response.data);
        } catch (error) {
            setError('Failed to load roles');
            console.error('Error fetching roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow max-w-lg">
                <h2 className="text-xl font-semibold mb-4">Roles</h2>
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-xl shadow max-w-lg">
                <h2 className="text-xl font-semibold mb-4">Roles</h2>
                <div className="text-red-600 p-4 bg-red-50 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow max-w-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Roles</h2>
                <span className="text-sm text-gray-500">
                    {roles.length} role{roles.length !== 1 ? 's' : ''}
                </span>
            </div>

            <ul className="space-y-3">
                {roles.map((role) => (
                    <li key={role.id} className="border p-4 rounded-lg hover:shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">{role.name}</h3>
                                {role.description && (
                                    <p className="text-gray-600 text-sm mt-1">{role.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {role.canViewAllTasks && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                            View All Tasks
                                        </span>
                                    )}
                                    {role.canEditAllTasks && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                            Edit All Tasks
                                        </span>
                                    )}
                                    {role.canManageUsers && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                            Manage Users
                                        </span>
                                    )}
                                    {role.canManageRoles && (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                            Manage Roles
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">
                                    {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {formatDate(role.createdAt)}
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {roles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No roles found
                </div>
            )}
        </div>
    );
}