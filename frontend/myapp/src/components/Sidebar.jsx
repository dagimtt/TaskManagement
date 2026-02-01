import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  UserPlus,
  Shield,
  Lock,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  FileText,
  Download,
} from "lucide-react";

export default function Sidebar() {
  const { hasPermission, user } = useAuth();
  const location = useLocation();

  const [openTasks, setOpenTasks] = useState(true);
  const [openUsers, setOpenUsers] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) =>
    location.pathname === path
      ? "bg-[#073954] text-white shadow"
      : "text-[#073954] hover:bg-blue-50 hover:text-[#073954]";

  const baseLink =
    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200";

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#073954] text-white rounded-md shadow"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full min-h-screen w-64 bg-white shadow-xl flex flex-col transform transition-transform duration-300 z-40 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* LOGO */}
        <div className="px-6 py-5 text-xl font-bold text-[#073954] bg-white">
          Task Manager
        </div>

        {/* User Info */}
        {user && (
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-800"></div>
            <div className="text-xs text-gray-500 capitalize"></div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-2 text-sm overflow-y-auto">
          {/* DASHBOARD */}
          <Link to="/" className={`${baseLink} ${isActive("/")}`}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>

          {/* MANAGE TASKS */}
          <div className="space-y-1">
            <button
              onClick={() => setOpenTasks(!openTasks)}
              className={`${baseLink} w-full justify-between font-medium text-[#073954] hover:bg-blue-50`}
            >
              <span className="flex items-center gap-3">
                <CheckSquare size={18} /> Manage Tasks
              </span>
              {openTasks ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {openTasks && (
              <div className="ml-6 space-y-1">
                <Link to="/tasks" className={`${baseLink} ${isActive("/tasks")}`}>
                  All Tasks
                </Link>

                {(hasPermission('TASK_CREATE') || hasPermission('TASK_ASSIGN')) && (
                  <Link
                    to="/add-task"
                    className={`${baseLink} ${isActive("/add-task")}`}
                  >
                    Add New Task
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* MANAGE USERS */}
          {hasPermission('USER_VIEW_ALL') && (
            <div className="space-y-1">
              <button
                onClick={() => setOpenUsers(!openUsers)}
                className={`${baseLink} w-full justify-between font-medium text-[#073954] hover:bg-blue-50`}
              >
                <span className="flex items-center gap-3">
                  <Users size={18} /> Manage Users
                </span>
                {openUsers ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {openUsers && (
                <div className="ml-6 space-y-1">
                  <Link to="/users" className={`${baseLink} ${isActive("/users")}`}>
                    All Users
                  </Link>

                  {hasPermission('USER_CREATE') && (
                    <Link
                      to="/add-user"
                      className={`${baseLink} ${isActive("/add-user")}`}
                    >
                      <UserPlus size={16} /> Add User
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ROLES */}
          {hasPermission('ROLE_MANAGE') && (
            <Link to="/roles" className={`${baseLink} ${isActive("/roles")}`}>
              <Shield size={18} /> Roles
            </Link>
          )}

          {/* PERMISSIONS */}
          {hasPermission('PERMISSION_MANAGE') && (
            <Link
              to="/permissions"
              className={`${baseLink} ${isActive("/permissions")}`}
            >
              <Lock size={18} /> Permissions
            </Link>
          )}

          {/* REPORTS */}
          {hasPermission('REPORT_VIEW') && (
            <Link to="/reports" className={`${baseLink} ${isActive("/reports")}`}>
              <FileText size={18} /> Reports
            </Link>
          )}

          {/* DATA EXPORT */}
          {hasPermission('DATA_EXPORT') && (
            <Link to="/export" className={`${baseLink} ${isActive("/export")}`}>
              <Download size={18} /> Export Data
            </Link>
          )}
        </nav>

        {/* FOOTER */}
        <div className="px-6 py-4 text-xs text-center text-gray-500 border-t mt-auto">
          © 2026 Task Manager
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-25 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
}