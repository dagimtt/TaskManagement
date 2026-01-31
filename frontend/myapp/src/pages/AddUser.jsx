import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AddUser() {
    const [form, setForm] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        roleId: 3 // Default to User role
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Only Admin can assign Admin/Manager roles
    const canAssignAllRoles = currentUser?.role === 'Admin';

    const roles = [
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Manager' },
        { id: 3, name: 'User' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
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
                roleId: 3
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

    const availableRoles = canAssignAllRoles 
        ? roles 
        : roles.filter(role => role.id === 3); // Non-admins can only create Users

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
                <input
                    type="text"
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Full Name"
                    value={form.fullName}
                    onChange={(e) => setForm({...form, fullName: e.target.value})}
                    required
                    disabled={loading}
                />

                {/* Username */}
                <input
                    type="text"
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) => setForm({...form, username: e.target.value})}
                    required
                    disabled={loading}
                />

                {/* Email */}
                <input
                    type="email"
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    required
                    disabled={loading}
                />

                {/* Password */}
                <input
                    type="password"
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    required
                    disabled={loading}
                />

                {/* Confirm Password */}
                <input
                    type="password"
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                    required
                    disabled={loading}
                />

                {/* Role Selection */}
                <select 
                    className="w-full border rounded-lg px-4 py-2"
                    value={form.roleId}
                    onChange={(e) => setForm({...form, roleId: parseInt(e.target.value)})}
                    disabled={loading || !canAssignAllRoles}
                >
                    <option value="">Select Role</option>
                    {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>
                            {role.name}
                        </option>
                    ))}
                </select>

                {!canAssignAllRoles && (
                    <p className="text-sm text-gray-500">
                        Note: You can only create regular Users. Only Admins can create Admin/Manager roles.
                    </p>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create User'}
                </button>
            </form>
        </div>
    );
}