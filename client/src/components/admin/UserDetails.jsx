import { useState, useEffect } from 'react';

const UserDetails = ({ user, onBack, onUserUpdate }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchUserDetails();
  }, [user._id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/users/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUserDetails(data.data);
        setEditForm(data.data.user);
      } else {
        setError(data.error.message || 'Failed to load user details');
      }
    } catch (error) {
      console.error('Fetch user details error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (data.success) {
        setUserDetails({ ...userDetails, user: data.data.user });
        onUserUpdate(data.data.user);
        setEditing(false);
      } else {
        alert('Failed to update user: ' + data.error.message);
      }
    } catch (error) {
      console.error('Update user error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleStatusChange = async (isActive) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/users/${user._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await response.json();

      if (data.success) {
        setUserDetails({ ...userDetails, user: data.data.user });
        onUserUpdate(data.data.user);
      } else {
        alert('Failed to update user status: ' + data.error.message);
      }
    } catch (error) {
      console.error('Update user status error:', error);
      alert('Network error. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    return num?.toFixed(1) || '0.0';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="mb-6 text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Users
          </button>
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button
              onClick={fetchUserDetails}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user: userData, recentActivity, healthAlerts, stats } = userDetails;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 text-indigo-600 hover:text-indigo-800"
            >
              ← Back to Users
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {userData.name || 'Unnamed User'}
              </h1>
              <p className="text-gray-600">{userData.email}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Edit User
                </button>
                <button
                  onClick={() => handleStatusChange(!userData.isActive)}
                  className={`px-4 py-2 rounded-md text-white ${
                    userData.isActive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {userData.isActive ? 'Block User' : 'Activate User'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
              
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={editForm.age || ''}
                      onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={editForm.gender || ''}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={editForm.height || ''}
                      onChange={(e) => setEditForm({ ...editForm, height: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={editForm.weight || ''}
                      onChange={(e) => setEditForm({ ...editForm, weight: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <p className="text-gray-900">{userData.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{userData.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Age:</span>
                    <p className="text-gray-900">{userData.age || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Gender:</span>
                    <p className="text-gray-900">{userData.gender || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Height:</span>
                    <p className="text-gray-900">{userData.height ? `${userData.height} cm` : 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Weight:</span>
                    <p className="text-gray-900">{userData.weight ? `${userData.weight} kg` : 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">BMI:</span>
                    <p className="text-gray-900">{userData.bmi || 'Not calculated'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userData.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Health Conditions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Conditions</h2>
              <div className="flex flex-wrap gap-2">
                {userData.healthConditions?.length > 0 ? (
                  userData.healthConditions.map((condition, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {condition}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No health conditions reported</p>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(activity.date)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.totalCalories} calories logged
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>P: {formatNumber(activity.totalProtein)}g</div>
                        <div>C: {formatNumber(activity.totalCarbs)}g</div>
                        <div>F: {formatNumber(activity.totalFat)}g</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Days:</span>
                  <span className="text-sm font-medium text-gray-900">{stats.totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Alerts:</span>
                  <span className="text-sm font-medium text-gray-900">{stats.totalAlerts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Critical Alerts:</span>
                  <span className="text-sm font-medium text-red-600">{stats.criticalAlerts}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Daily Averages:</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Calories:</span>
                      <span className="text-gray-900">{stats.avgCalories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Protein:</span>
                      <span className="text-gray-900">{stats.avgProtein}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Carbs:</span>
                      <span className="text-gray-900">{stats.avgCarbs}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fat:</span>
                      <span className="text-gray-900">{stats.avgFat}g</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Health Alerts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Health Alerts</h2>
              <div className="space-y-3">
                {healthAlerts.length > 0 ? (
                  healthAlerts.slice(0, 5).map((alert, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">
                            {alert.severity.toUpperCase()}
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            {alert.message}
                          </p>
                        </div>
                        <span className="text-xs text-red-600">
                          {formatDate(alert.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No recent health alerts</p>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Joined:</span>
                  <p className="text-gray-900">{formatDate(userData.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <p className="text-gray-900">{formatDate(userData.updatedAt)}</p>
                </div>
                {userData.lastLogin && (
                  <div>
                    <span className="text-gray-500">Last Login:</span>
                    <p className="text-gray-900">{formatDate(userData.lastLogin)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;