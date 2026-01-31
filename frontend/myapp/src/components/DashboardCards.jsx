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

    const cards = [
        {
            title: 'Total Tasks',
            value: taskStats?.totalTasks || 0,
            color: 'bg-blue-500',
            icon: '📋',
            description: 'All tasks in the system'
        },
        {
            title: 'Completed Tasks',
            value: taskStats?.completedTasks || 0,
            color: 'bg-green-500',
            icon: '✅',
            description: 'Successfully completed'
        },
        {
            title: 'Active Users',
            value: userStats?.totalUsers || 0,
            color: 'bg-purple-500',
            icon: '👥',
            description: 'Currently active users'
        },
        {
            title: 'Completion Rate',
            value: taskStats?.completionRate ? `${taskStats.completionRate.toFixed(1)}%` : '0%',
            color: 'bg-yellow-500',
            icon: '📈',
            description: 'Task completion percentage'
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
                <button
                    onClick={onRefresh}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                >
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${card.color} text-white`}>
                                <span className="text-2xl">{card.icon}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold">{card.value}</div>
                                <div className="text-sm text-gray-500">{card.title}</div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">{card.description}</p>
                    </div>
                ))}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Task Status Summary */}
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-lg font-semibold mb-4">Task Status</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span>Pending</span>
                            <span className="font-medium">{taskStats?.pendingTasks || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>In Progress</span>
                            <span className="font-medium">{taskStats?.inProgressTasks || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Overdue</span>
                            <span className="font-medium text-red-600">{taskStats?.overdueTasks || 0}</span>
                        </div>
                    </div>
                </div>

                {/* User Role Summary */}
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-lg font-semibold mb-4">User Roles</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span>Admins</span>
                            <span className="font-medium">{userStats?.totalAdmins || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Managers</span>
                            <span className="font-medium">{userStats?.totalManagers || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Users</span>
                            <span className="font-medium">{userStats?.totalRegularUsers || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}