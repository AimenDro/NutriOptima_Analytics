import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  RefreshCw
} from 'lucide-react';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/dashboard?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (dataType) => {
    try {
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          dataType,
          timeframe,
          format: 'csv'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}_${timeframe}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center text-gray-500">
        No analytics data available
      </div>
    );
  }

  const { overview, trends, featureUsage } = dashboardData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-600">Comprehensive platform insights and metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">{timeframe}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{overview.totalUsers.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Total Users</p>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-green-600">+{overview.newUsers} new</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">{timeframe}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{overview.activeUsers.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Active Users</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">{overview.engagementRate}% engagement</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">{timeframe}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{featureUsage.foodScanning.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Food Scans</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">AI Recognition</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <PieChart className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">{timeframe}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{featureUsage.healthAlerts.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Health Alerts</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">Safety Warnings</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Analytics
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'features'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Feature Usage
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Export Data
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* User Growth Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Trend</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {trends.userGrowth && trends.userGrowth.length > 0 ? (
                    <div className="space-y-2">
                      {trends.userGrowth.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item._id}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-48 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(item.count / Math.max(...trends.userGrowth.map(i => i.count))) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No growth data available</p>
                  )}
                </div>
              </div>

              {/* Daily Active Users */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Active Users</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {trends.dailyActiveUsers && trends.dailyActiveUsers.length > 0 ? (
                    <div className="space-y-2">
                      {trends.dailyActiveUsers.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.date}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-48 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(item.count / Math.max(...trends.dailyActiveUsers.map(i => i.count))) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No activity data available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">User analytics details coming soon</p>
              <button
                onClick={() => handleExport('users')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export User Data</span>
              </button>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Feature Usage Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">Food Scanning</span>
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{featureUsage.foodScanning.toLocaleString()}</p>
                  <p className="text-sm text-purple-700 mt-1">Total scans in {timeframe}</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-900">Health Alerts</span>
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{featureUsage.healthAlerts.toLocaleString()}</p>
                  <p className="text-sm text-orange-700 mt-1">Alerts generated</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Content Moderation</span>
                    <PieChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{featureUsage.contentModeration.toLocaleString()}</p>
                  <p className="text-sm text-blue-700 mt-1">Items moderated</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport('users')}
                  className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-6 h-6 text-gray-600" />
                    <Download className="w-5 h-5 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900">User Data</h4>
                  <p className="text-sm text-gray-600 mt-1">Export user profiles and statistics</p>
                </button>

                <button
                  onClick={() => handleExport('food_recognition')}
                  className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <BarChart3 className="w-6 h-6 text-gray-600" />
                    <Download className="w-5 h-5 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Food Recognition Data</h4>
                  <p className="text-sm text-gray-600 mt-1">Export AI recognition results</p>
                </button>

                <button
                  onClick={() => handleExport('health_alerts')}
                  className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-6 h-6 text-gray-600" />
                    <Download className="w-5 h-5 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Health Alerts</h4>
                  <p className="text-sm text-gray-600 mt-1">Export health alert history</p>
                </button>

                <button
                  onClick={() => handleExport('admin_actions')}
                  className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-6 h-6 text-gray-600" />
                    <Download className="w-5 h-5 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Admin Actions</h4>
                  <p className="text-sm text-gray-600 mt-1">Export admin activity logs</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;