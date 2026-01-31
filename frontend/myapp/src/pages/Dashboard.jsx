import { useState, useEffect } from 'react';
import DashboardCards from "../components/DashboardCards";
import { taskAPI, userAPI } from '../services/api';

export default function Dashboard() {
    const [stats, setStats] = useState({
        taskStats: null,
        userStats: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const [taskStats, userStats] = await Promise.all([
                taskAPI.getStats(),
                userAPI.getStats()
            ]);
            
            setStats({
                taskStats: taskStats.data,
                userStats: userStats.data
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <DashboardCards 
                stats={stats}
                loading={loading}
                onRefresh={fetchDashboardStats}
            />
        </>
    );
}