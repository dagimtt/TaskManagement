import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function DashboardCards({ stats, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const { taskStats, userStats } = stats;

  // Calculate completion rate if not provided
  const completionRate = taskStats?.completionRate 
    ? taskStats.completionRate 
    : (taskStats?.totalTasks > 0 
        ? ((taskStats?.completedTasks || 0) / taskStats.totalTasks * 100).toFixed(1)
        : 0);

  const cards = [
    {
      title: "Total Tasks",
      value: taskStats?.totalTasks || 0,
      color: "bg-blue-100",
      icon: "📋",
      description: "All tasks in the system",
    },
    {
      title: "Completed Tasks",
      value: taskStats?.completedTasks || 0,
      color: "bg-green-100",
      icon: "✅",
      description: "Successfully completed",
    },
    {
      title: "Active Users",
      value: userStats?.totalUsers || 0,
      color: "bg-purple-100",
      icon: "👥",
      description: "Currently active users",
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      color: "bg-yellow-100",
      icon: "📈",
      description: "Task completion percentage",
    },
  ];

  // 🔹 Chart data - Tasks by Status (always visible)
  const taskByStatus = [
    { name: "Pending", value: taskStats?.pendingTasks || 0 },
    { name: "In Progress", value: taskStats?.inProgressTasks || 0 },
    { name: "Completed", value: taskStats?.completedTasks || 0 },
    { name: "Overdue", value: taskStats?.overdueTasks || 0 },
  ];

  // 🔹 Chart data - Users by Role (only show if userStats exists)
  const usersByRole = userStats ? [
    { name: "Admins", value: userStats?.totalAdmins || 0 },
    { name: "Managers", value: userStats?.totalManagers || 0 },
    { name: "Users", value: userStats?.totalRegularUsers || 0 },
  ] : [];

  const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"]; 

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
        
      </div>

      {/* Info message for non-admin users */}
     

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-800">{card.value}</div>
                <div className="text-sm text-gray-500">{card.title}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">{card.description}</p>
            {card.title === "Active Users" && !userStats && (
              <p className="text-xs text-gray-400 mt-2">Admin view only</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Task vs Status - ALWAYS VISIBLE */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Tasks by Status</h3>
          {taskStats?.totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={taskByStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  label
                >
                  {taskByStatus.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <span className="text-4xl mb-2">📊</span>
              <p className="text-gray-500">No task data available</p>
            </div>
          )}
        </div>

        {/* Users by Role - ONLY VISIBLE IF userStats EXISTS */}
        {usersByRole.length > 0 ? (
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Users by Role</h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                Admin View
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={usersByRole}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name="User Count"
                  radius={[8, 8, 0, 0]}
                  fill="#8b5cf6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
            <div className="flex flex-col items-center justify-center h-64">
              <span className="text-4xl mb-2">👥</span>
              <p className="text-gray-500">User statistics available to administrators only</p>
              <p className="text-sm text-gray-400 mt-2">Login as admin to view user analytics</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}