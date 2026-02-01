import { useState, useEffect } from 'react';
import DashboardCards from "../components/DashboardCards";
import { taskAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext'; // Assuming you have auth context

export default function Dashboard() {
    const [stats, setStats] = useState({
        taskStats: null,
        userStats: null,
        userInfo: null
    });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth(); // Get current user info from auth context

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            
            // Always fetch task stats
            const taskStatsResponse = await taskAPI.getStats();
            
            // Fetch user stats - handle permission errors
            let userStatsResponse = null;
            let userStatsData = null;
            
            try {
                userStatsResponse = await userAPI.getStats();
                userStatsData = userStatsResponse.data;
            } catch (error) {
                if (error.response?.status === 403 || error.response?.status === 401) {
                    // User doesn't have permission to see user stats
                    console.log('User does not have permission to view user statistics');
                    userStatsData = null;
                } else {
                    console.error('Error fetching user stats:', error);
                    throw error;
                }
            }
            
            // Fetch current user info if needed
            let userInfo = null;
            if (user) {
                userInfo = user; // From auth context
            } else {
                try {
                    const userInfoResponse = await userAPI.getCurrentUser();
                    userInfo = userInfoResponse.data;
                } catch (error) {
                    console.error('Error fetching user info:', error);
                }
            }
            
            setStats({
                taskStats: taskStatsResponse.data,
                userStats: userStatsData,
                userInfo: userInfo
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
          
            
            <DashboardCards 
                stats={stats}
                loading={loading}
                user={user}
                onRefresh={fetchDashboardStats}
            />
        </div>
    );
}