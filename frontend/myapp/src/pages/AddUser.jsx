import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, roleAPI } from '../services/api'; // Add roleAPI
import { useAuth } from '../context/AuthContext';

export default function AddUser() {
    const [form, setForm] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        roleId: '' // Start empty
    });
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Fetch roles on component mount
    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoadingRoles(true);
            const response = await roleAPI.getAll();
            setRoles(response.data);
            
            // Set default role to first non-admin role or empty
            if (response.data.length > 0) {
                const defaultRole = response.data.find(role => role.name !== 'Admin') || response.data[0];
                if (defaultRole) {
                    setForm(prev => ({ ...prev, roleId: defaultRole.id }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            setError('Failed to load roles');
            // Fallback to hardcoded roles if API fails
            setRoles([
                { id: 1, name: 'Admin' },
                { id: 2, name: 'Manager' },
                { id: 3, name: 'User' }
            ]);
        } finally {
            setLoadingRoles(false);
        }
    };

    // Check if current user can assign specific roles
    // Admins can assign any role, others can only assign roles with lower permissions
    const canAssignRole = (role) => {
        if (!currentUser || !currentUser.role) return false;
        
        // If current user is Admin, they can assign any role
        if (currentUser.role === 'Admin') return true;
        
        // For non-Admins, check permissions
        const currentUserRole = roles.find(r => r.name === currentUser.role);
        const targetRole = roles.find(r => r.id === role.id);
        
        if (!currentUserRole || !targetRole) return false;
        
        // Non-Admins can only assign roles that don't have higher permissions
        // Simple check: can't assign Admin role, and can only assign roles with same or lower ID
        // You might want to implement more sophisticated permission checking
        return targetRole.name !== 'Admin' && 
               (currentUserRole.canManageRoles || 
                (!targetRole.canManageRoles && !targetRole.canManageUsers));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!form.roleId) {
            setError('Please select a role');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const userData = {
                fullName: form.fullName,
                username: form.username,
                email: form.email,
                password: form.password,
                roleId: form.roleId
            };

            await userAPI.create(userData);
            
            setSuccess('User created successfully!');
            setForm({
                fullName: '',
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                roleId: roles.length > 0 ? roles.find(r => r.name === 'User')?.id || roles[0].id : ''
            });

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/users');
            }, 2000);

        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const availableRoles = roles.filter(role => canAssignRole(role));

    return (
        <div className="bg-white p-6 rounded-xl shadow max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Add User</h2>

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
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                        type="text"
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Enter full name"
                        value={form.fullName}
                        onChange={(e) => setForm({...form, fullName: e.target.value})}
                        required
                        disabled={loading}
                    />
                </div>

                {/* Username */}
                <div>
                    <label className="block text-sm font-medium mb-1">Username *</label>
                    <input
                        type="text"
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Enter username"
                        value={form.username}
                        onChange={(e) => setForm({...form, username: e.target.value})}
                        required
                        disabled={loading}
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                        type="email"
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Enter email"
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        required
                        disabled={loading}
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium mb-1">Password *</label>
                    <input
                        type="password"
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Enter password (min 6 characters)"
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        required
                        disabled={loading}
                    />
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                    <input
                        type="password"
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Confirm password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                        required
                        disabled={loading}
                    />
                </div>

                {/* Role Selection */}
                <div>
                    <label className="block text-sm font-medium mb-1">Role *</label>
                    {loadingRoles ? (
                        <div className="text-gray-500">Loading roles...</div>
                    ) : availableRoles.length === 0 ? (
                        <div className="text-red-500">No roles available to assign</div>
                    ) : (
                        <>
                            <select 
                                className="w-full border rounded-lg px-4 py-2"
                                value={form.roleId}
                                onChange={(e) => setForm({...form, roleId: parseInt(e.target.value)})}
                                disabled={loading || availableRoles.length === 0}
                                required
                            >
                                <option value="">Select Role</option>
                                {availableRoles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.name} {role.description && `- ${role.description}`}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Available roles are filtered based on your permissions
                            </p>
                        </>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        className="bg-[#073954] text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                        disabled={loading || loadingRoles || availableRoles.length === 0}
                    >
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/users')}
                        className="ml-3 px-6 py-2 border rounded-lg hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}