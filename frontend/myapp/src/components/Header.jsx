// src/components/Header.jsx
import { useAuth } from "../context/AuthContext";

export default function Header() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <header className="bg-white shadow py-4 px-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">
                    </h1>
                    {user && (
                        <p className="text-sm text-gray-500">
                        </p>
                    )}
                </div>

                {user && (
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="font-medium text-gray-800">
                                {user.fullName || user.username}
                            </span>
                            <span className="text-xs text-gray-500">
                                {user.role}
                            </span>
                        </div>

                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            {(user.fullName || user.username).charAt(0).toUpperCase()}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}