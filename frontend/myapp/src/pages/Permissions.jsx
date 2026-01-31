import { useState, useEffect } from 'react';
import { roleAPI } from '../services/api';

export default function Permissions() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await roleAPI.getAll();
            setRoles(response.data);
            if (response.data.length > 0) {
                setSelectedRole(response.data[0]);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const permissionsList = [
        { key: 'canViewAllTasks', label: 'View All Tasks', description: 'Can view all tasks in the system' },
        { key: 'canEditAllTasks', label: 'Edit All Tasks', description: 'Can edit any task, not just assigned ones' },
        { key: 'canManageUsers', label: 'Manage Users', description: 'Can create, update, and deactivate users' },
        { key: 'canManageRoles', label: 'Manage Roles', description: 'Can create and modify role permissions' }
    ];

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow max-w-lg">
                <h2 className="text-xl font-semibold mb-4">Permissions</h2>
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Permissions</h2>
            
            {/* Role Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role to View Permissions
                </label>
                <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                selectedRole?.id === role.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {role.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Permissions List for Selected Role */}
            {selectedRole && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">
                        Permissions for <span className="text-blue-600">{selectedRole.name}</span>
                    </h3>
                    
                    <ul className="space-y-3">
                        {permissionsList.map((permission) => (
                            <li key={permission.key} className="border p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${
                                                selectedRole[permission.key]
                                                    ? 'bg-green-500'
                                                    : 'bg-red-500'
                                            }`}></span>
                                            <span className="font-medium">{permission.label}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {permission.description}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${
                                        selectedRole[permission.key]
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {selectedRole[permission.key] ? 'Allowed' : 'Denied'}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Role Summary */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Role Summary</h4>
                        <p className="text-sm text-gray-600">
                            {selectedRole.description || 'No description available.'}
                        </p>
                        <div className="mt-2 text-sm text-gray-500">
                            Created: {new Date(selectedRole.createdAt).toLocaleDateString()} • 
                            Users: {selectedRole.userCount}
                        </div>
                    </div>
                </div>
            )}

            {roles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No roles found
                </div>
            )}
        </div>
    );
}