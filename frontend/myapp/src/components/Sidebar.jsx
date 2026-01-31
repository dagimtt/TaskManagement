// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { hasPermission } = useAuth();
  const location = useLocation();

  const [openTasks, setOpenTasks] = useState(true);
  const [openUsers, setOpenUsers] = useState(false);

  const isActive = (path) =>
    location.pathname === path
      ? "bg-blue-50 text-blue-600 font-medium"
      : "";

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen flex flex-col">
      {/* LOGO */}
      <div className="px-6 py-5 text-xl font-bold text-blue-600 border-b">
        Task Manager
      </div>

      <nav className="flex-1 px-4 py-4 space-y-4 text-sm">
        {/* DASHBOARD */}
        <Link
          to="/"
          className={`sidebar-link ${isActive("/")}`}
        >
          Dashboard
        </Link>

        {/* MANAGE TASKS */}
        <div className="space-y-1">
          <button
            onClick={() => setOpenTasks(!openTasks)}
            className="sidebar-link w-full flex justify-between items-center font-medium"
          >
            <span>Manage Tasks</span>
            <span className="text-xs">
              {openTasks ? "▼" : "▶"}
            </span>
          </button>

          {openTasks && (
            <div className="ml-4 space-y-1">
              <Link
                to="/tasks"
                className={`sidebar-link text-sm ${isActive(
                  "/tasks"
                )}`}
              >
                Tasks
              </Link>

              {hasPermission("TASK_ASSIGN") && (
                <Link
                  to="/add-task"
                  className={`sidebar-link text-sm ${isActive(
                    "/add-task"
                  )}`}
                >
                  Add Task
                </Link>
              )}
            </div>
          )}
        </div>

        {/* MANAGE USERS */}
        {hasPermission("USER_VIEW") && (
          <div className="space-y-1">
            <button
              onClick={() => setOpenUsers(!openUsers)}
              className="sidebar-link w-full flex justify-between items-center font-medium"
            >
              <span>Manage Users</span>
              <span className="text-xs">
                {openUsers ? "▼" : "▶"}
              </span>
            </button>

            {openUsers && (
              <div className="ml-4 space-y-1">
                <Link
                  to="/users"
                  className={`sidebar-link text-sm ${isActive(
                    "/users"
                  )}`}
                >
                  Users 
                </Link>

                {hasPermission("USER_CREATE") && (
                  <Link
                    to="/add-user"
                    className={`sidebar-link text-sm ${isActive(
                      "/add-user"
                    )}`}
                  >
                    Add User
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* ROLES */}
        {hasPermission("ROLE_MANAGE") && (
          <Link
            to="/roles"
            className={`sidebar-link ${isActive(
              "/roles"
            )}`}
          >
            Roles
          </Link>
        )}

        {/* PERMISSIONS */}
        {hasPermission("PERMISSION_MANAGE") && (
          <Link
            to="/permissions"
            className={`sidebar-link ${isActive(
              "/permissions"
            )}`}
          >
            Permissions
          </Link>
        )}
      </nav>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t text-xs text-gray-500">
        © 2026 Task Manager
      </div>
    </aside>
  );
}
