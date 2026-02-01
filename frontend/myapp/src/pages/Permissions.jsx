import { useState, useEffect } from 'react';
import { roleAPI } from '../services/api';

export default function Permissions() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState(null);
    const [rolePermissions, setRolePermissions] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        if (selectedRole) {
            fetchRolePermissions(selectedRole.id);
        }
    }, [selectedRole]);

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

    const fetchRolePermissions = async (roleId) => {
        try {
            const response = await roleAPI.getRolePermissions(roleId);
            setRolePermissions(response.data);
        } catch (error) {
            console.error('Error fetching role permissions:', error);
        }
    };

    const updatePermission = (permissionKey, value) => {
        if (!rolePermissions) return;
        
        setRolePermissions(prev => ({
            ...prev,
            [permissionKey]: value
        }));
    };

    const savePermissions = async () => {
        if (!selectedRole || !rolePermissions) return;
        
        try {
            setSaving(true);
            setSaveMessage('');
            
            const permissionsToUpdate = {
                canViewAllTasks: rolePermissions.canViewAllTasks,
                canEditAllTasks: rolePermissions.canEditAllTasks,
                canCreateTasks: rolePermissions.canCreateTasks,
                canDeleteTasks: rolePermissions.canDeleteTasks,
                canAssignTasks: rolePermissions.canAssignTasks,
                canViewAllUsers: rolePermissions.canViewAllUsers,
                canCreateUsers: rolePermissions.canCreateUsers,
                canEditUsers: rolePermissions.canEditUsers,
                canDeleteUsers: rolePermissions.canDeleteUsers,
                canManageRoles: rolePermissions.canManageRoles,
                canManagePermissions: rolePermissions.canManagePermissions,
                canViewReports: rolePermissions.canViewReports,
                canExportData: rolePermissions.canExportData
            };
            
            await roleAPI.updateRolePermissions(selectedRole.id, permissionsToUpdate);
            setSaveMessage('Permissions updated successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error('Error saving permissions:', error);
            setSaveMessage('Error saving permissions. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const permissionGroups = [
        {
            title: "Task Permissions",
            permissions: [
                { key: 'canViewAllTasks', label: 'View All Tasks', description: 'Can view all tasks in the system' },
                { key: 'canEditAllTasks', label: 'Edit All Tasks', description: 'Can edit any task, not just assigned ones' },
                { key: 'canCreateTasks', label: 'Create Tasks', description: 'Can create new tasks' },
                { key: 'canDeleteTasks', label: 'Delete Tasks', description: 'Can delete tasks' },
                { key: 'canAssignTasks', label: 'Assign Tasks', description: 'Can assign tasks to other users' }
            ]
        },
        {
            title: "User Permissions",
            permissions: [
                { key: 'canViewAllUsers', label: 'View All Users', description: 'Can view all user profiles' },
                { key: 'canCreateUsers', label: 'Create Users', description: 'Can create new user accounts' },
                { key: 'canEditUsers', label: 'Edit Users', description: 'Can edit user information' },
                { key: 'canDeleteUsers', label: 'Delete Users', description: 'Can deactivate user accounts' }
            ]
        },
        {
            title: "System Permissions",
            permissions: [
                { key: 'canManageRoles', label: 'Manage Roles', description: 'Can create and modify roles' },
                { key: 'canManagePermissions', label: 'Manage Permissions', description: 'Can modify role permissions' },
                { key: 'canViewReports', label: 'View Reports', description: 'Can access system reports' },
                { key: 'canExportData', label: 'Export Data', description: 'Can export system data' }
            ]
        }
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Role Permissions Management</h1>
            
            {/* Role Selector */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Select Role</h2>
                <div className="flex flex-wrap gap-3">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                selectedRole?.id === role.id
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {role.name}
                            <span className="ml-2 text-xs opacity-75">
                                ({role.users?.length || 0} users)
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {selectedRole && rolePermissions && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Permissions for <span className="text-blue-600">{selectedRole.name}</span>
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    {selectedRole.description || 'No description provided.'}
                                </p>
                            </div>
                            <button
                                onClick={savePermissions}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Permissions'}
                            </button>
                        </div>
                        
                        {saveMessage && (
                            <div className={`mt-4 p-3 rounded-lg ${
                                saveMessage.includes('Error') 
                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                    : 'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                                {saveMessage}
                            </div>
                        )}
                    </div>

                    <div className="p-6">
                        {permissionGroups.map((group) => (
                            <div key={group.title} className="mb-8 last:mb-0">
                                <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                                    {group.title}
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {group.permissions.map((permission) => (
                                        <div key={permission.key} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            id={`perm-${permission.key}`}
                                                            checked={rolePermissions[permission.key] || false}
                                                            onChange={(e) => updatePermission(permission.key, e.target.checked)}
                                                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <label 
                                                            htmlFor={`perm-${permission.key}`}
                                                            className="font-medium text-gray-800 cursor-pointer"
                                                        >
                                                            {permission.label}
                                                        </label>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-2 ml-8">
                                                        {permission.description}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    rolePermissions[permission.key]
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {rolePermissions[permission.key] ? 'Allowed' : 'Denied'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {roles.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Roles Found</h3>
                    <p className="text-gray-500">Create roles first to manage permissions.</p>
                </div>
            )}
        </div>
    );
}