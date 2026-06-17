import { useState, useEffect } from 'react';

const AdminDashboard = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('No admin token found');
        return;
      }

      const response = await fetch('/api/admin/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.error.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={fetchDashboardData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overview, recentActivity } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">NutriOptima System Administration</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Uptime: {formatUptime(overview.system.uptime)}
              </div>
              <button
                onClick={fetchDashboardData}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {overview.users.total.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-600">
                  +{overview.users.newToday} today
                  {overview.users.growthRate !== 0 && (
                    <span className={`ml-2 ${overview.users.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({overview.users.growthRate > 0 ? '+' : ''}{overview.users.growthRate}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Users Today */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Today
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {overview.users.activeToday.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-600">
                  {overview.users.newThisWeek} new this week
                </div>
              </div>
            </div>
          </div>

          {/* Health Alerts */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    overview.alerts.critical > 0 ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    <span className="text-white text-sm font-bold">⚠️</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Health Alerts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {overview.alerts.total.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-600">
                  {overview.alerts.critical} critical, {overview.alerts.today} today
                </div>
              </div>
            </div>
          </div>

          {/* Food Recognition */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🍎</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Food Scans
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {overview.foodRecognition.total.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-600">
                  {overview.foodRecognition.today} today
                </div>
              </div>
            </div>
          </div>

          {/* Content Moderation */}
          <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('moderation')}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    overview.moderation?.urgent > 0 ? 'bg-red-500' : 
                    overview.moderation?.pending > 0 ? 'bg-orange-500' : 'bg-gray-500'
                  }`}>
                    <span className="text-white text-sm font-bold">🔍</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Review
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {overview.moderation?.pending || 0}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-600">
                  {overview.moderation?.urgent || 0} urgent, {overview.moderation?.today || 0} today
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Admin Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Admin Actions</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivity.adminActions.length > 0 ? (
                recentActivity.adminActions.slice(0, 8).map((action, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {action.adminId?.email || 'Unknown Admin'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {action.action.replace(/_/g, ' ')} - {action.targetType}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTimeAgo(action.timestamp)}
                      </div>
                    </div>
                    {action.success === false && (
                      <div className="mt-1 text-xs text-red-600">
                        Failed: {action.errorMessage}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-sm text-gray-500">
                  No recent admin actions
                </div>
              )}
            </div>
          </div>

          {/* Recent Health Alerts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Health Alerts</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivity.healthAlerts.length > 0 ? (
                recentActivity.healthAlerts.map((alert, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            alert.severity === 'critical' 
                              ? 'bg-red-100 text-red-800'
                              : alert.severity === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {alert.userId?.name || alert.userId?.email || 'Unknown User'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.message}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTimeAgo(alert.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-sm text-gray-500">
                  No recent health alerts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => onNavigate && onNavigate('users')}
                className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span className="text-2xl mb-2">👥</span>
                <span className="text-sm font-medium">Manage Users</span>
              </button>
              <button 
                onClick={() => onNavigate && onNavigate('food')}
                className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span className="text-2xl mb-2">🍎</span>
                <span className="text-sm font-medium">Food Database</span>
              </button>
              <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                <span className="text-2xl mb-2">⚠️</span>
                <span className="text-sm font-medium">Health Alerts</span>
              </button>
              <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                <span className="text-2xl mb-2">📊</span>
                <span className="text-sm font-medium">Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;