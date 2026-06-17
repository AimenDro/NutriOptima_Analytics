import { useState, useEffect } from 'react';

const HealthAlerts = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [effectiveness, setEffectiveness] = useState(null);
  const [healthRules, setHealthRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  
  // Filters
  const [filters, setFilters] = useState({
    severity: '',
    alertType: '',
    condition: '',
    acknowledged: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Selected alerts for bulk actions
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  
  // Manual alert form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualAlert, setManualAlert] = useState({
    userId: '',
    severity: 'warning',
    message: '',
    details: ''
  });

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
    } else if (activeTab === 'alerts') {
      fetchAlerts();
    } else if (activeTab === 'patterns') {
      fetchPatterns();
    } else if (activeTab === 'effectiveness') {
      fetchEffectiveness();
    } else if (activeTab === 'rules') {
      fetchHealthRules();
    }
  }, [activeTab, timeframe, filters, pagination.page]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/health-alerts/overview?timeframe=${timeframe}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      
      const response = await fetch(`/api/admin/health-alerts/list?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data.alerts);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/health-alerts/analysis/patterns?days=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPatterns(data.data.patterns);
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEffectiveness = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/health-alerts/analysis/effectiveness?days=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEffectiveness(data.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching effectiveness:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthRules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/health-alerts/config/rules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setHealthRules(data.data);
      }
    } catch (error) {
      console.error('Error fetching health rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/health-alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/health-alerts/${alertId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.length === 0) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/health-alerts/bulk-acknowledge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alertIds: selectedAlerts })
      });
      const data = await response.json();
      if (data.success) {
        setSelectedAlerts([]);
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error bulk acknowledging:', error);
    }
  };

  const handleCreateManualAlert = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/health-alerts/manual', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(manualAlert)
      });
      const data = await response.json();
      if (data.success) {
        setShowManualForm(false);
        setManualAlert({ userId: '', severity: 'warning', message: '', details: '' });
        alert('Manual alert created successfully');
      }
    } catch (error) {
      console.error('Error creating manual alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !overview && !alerts.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Health Alert Administration</h1>
        <p className="text-gray-600 mt-1">Monitor and manage health alerts across the platform</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'alerts', 'patterns', 'effectiveness', 'rules'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div>
          {/* Timeframe Selector */}
          <div className="mb-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Alerts</div>
              <div className="text-2xl font-bold">{overview.stats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Active</div>
              <div className="text-2xl font-bold text-red-600">{overview.stats.active}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Critical</div>
              <div className="text-2xl font-bold text-red-600">{overview.stats.bySeverity.critical}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Acknowledged</div>
              <div className="text-2xl font-bold text-green-600">{overview.stats.acknowledged}</div>
            </div>
          </div>

          {/* By Type */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Alerts by Type</h3>
            <div className="space-y-2">
              {Object.entries(overview.stats.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-gray-700">{type.replace(/_/g, ' ')}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Condition */}
          {Object.keys(overview.stats.byCondition).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Alerts by Health Condition</h3>
              <div className="space-y-2">
                {Object.entries(overview.stats.byCondition).map(([condition, count]) => (
                  <div key={condition} className="flex justify-between items-center">
                    <span className="text-gray-700">{condition.replace(/_/g, ' ')}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts List Tab */}
      {activeTab === 'alerts' && (
        <div>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              <select
                value={filters.alertType}
                onChange={(e) => setFilters({ ...filters, alertType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Types</option>
                <option value="health_condition">Health Condition</option>
                <option value="nutrient_deficiency">Nutrient Deficiency</option>
                <option value="daily_limit_exceeded">Daily Limit Exceeded</option>
                <option value="trend_warning">Trend Warning</option>
              </select>
              <select
                value={filters.acknowledged}
                onChange={(e) => setFilters({ ...filters, acknowledged: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Status</option>
                <option value="false">Active</option>
                <option value="true">Acknowledged</option>
              </select>
              <button
                onClick={() => setShowManualForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Manual Alert
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedAlerts.length > 0 && (
            <div className="bg-indigo-50 p-4 rounded-lg mb-4 flex justify-between items-center">
              <span className="text-indigo-900">{selectedAlerts.length} alerts selected</span>
              <button
                onClick={handleBulkAcknowledge}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Acknowledge Selected
              </button>
            </div>
          )}

          {/* Alerts Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAlerts(alerts.map(a => a._id));
                        } else {
                          setSelectedAlerts([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts.map(alert => (
                  <tr key={alert._id} className={alert.acknowledged ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedAlerts.includes(alert._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAlerts([...selectedAlerts, alert._id]);
                          } else {
                            setSelectedAlerts(selectedAlerts.filter(id => id !== alert._id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{alert.alertType}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{alert.userEmail}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{alert.message}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAlert(alert._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} alerts
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && patterns && (
        <div className="space-y-6">
          {/* Most Common Alerts */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Most Common Alerts</h3>
            <div className="space-y-2">
              {Object.entries(patterns.mostCommonAlerts).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-gray-700">{type}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Most Affected Users */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Most Affected Users</h3>
            <div className="space-y-2">
              {Object.entries(patterns.mostAffectedUsers).map(([email, count]) => (
                <div key={email} className="flex justify-between items-center">
                  <span className="text-gray-700">{email}</span>
                  <span className="font-semibold">{count} alerts</span>
                </div>
              ))}
            </div>
          </div>

          {/* False Positive Indicators */}
          {patterns.falsePositiveIndicators.length > 0 && (
            <div className="bg-yellow-50 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-yellow-900">Potential False Positives</h3>
              <p className="text-sm text-yellow-700 mb-4">
                Users with high quick-acknowledgment rates may indicate false positive alerts
              </p>
              <div className="space-y-2">
                {patterns.falsePositiveIndicators.map((indicator, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-700">{indicator.userEmail}</span>
                    <span className="text-sm">
                      {indicator.totalAlerts} alerts, {indicator.quickAckRate} quick ack
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Conditions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Trending Health Conditions</h3>
            <div className="space-y-2">
              {Object.entries(patterns.trendingConditions).map(([condition, count]) => (
                <div key={condition} className="flex justify-between items-center">
                  <span className="text-gray-700">{condition.replace(/_/g, ' ')}</span>
                  <span className="font-semibold">{count} alerts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Effectiveness Tab */}
      {activeTab === 'effectiveness' && effectiveness && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Alerts</div>
              <div className="text-3xl font-bold">{effectiveness.totalAlerts}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Acknowledged Rate</div>
              <div className="text-3xl font-bold text-green-600">{effectiveness.acknowledgedRate}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Avg Time to Acknowledge</div>
              <div className="text-3xl font-bold">{effectiveness.averageTimeToAcknowledge}</div>
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Severity Distribution</h3>
            <div className="space-y-4">
              {Object.entries(effectiveness.severityDistribution).map(([severity, data]) => (
                <div key={severity}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700 capitalize">{severity}</span>
                    <span className="text-sm text-gray-600">
                      {data.acknowledged}/{data.total} acknowledged
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        severity === 'critical' ? 'bg-red-600' :
                        severity === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${data.total > 0 ? (data.acknowledged / data.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Engagement */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">User Engagement</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Users with Alerts</span>
                <span className="font-semibold">{effectiveness.userEngagement.totalUsersWithAlerts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Users Who Acknowledged</span>
                <span className="font-semibold">{effectiveness.userEngagement.usersWhoAcknowledged}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Engagement Rate</span>
                <span className="font-semibold text-green-600">{effectiveness.userEngagement.engagementRate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health Rules Tab */}
      {activeTab === 'rules' && healthRules && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              Health rules are currently read-only. Contact system administrator to modify rules.
            </p>
          </div>

          {/* Health Conditions */}
          {Object.entries(healthRules.healthRules).map(([condition, rules]) => (
            <div key={condition} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">{rules.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{rules.description}</p>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Avoid Rules (Per Meal)</h4>
                <div className="space-y-2">
                  {Object.entries(rules.avoid).map(([nutrient, rule]) => (
                    <div key={nutrient} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{nutrient}</span>
                      <span className={`px-2 py-1 rounded ${getSeverityColor(rule.severity)}`}>
                        &gt; {rule.threshold}{rule.unit} - {rule.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {rules.dailyLimits && (
                <div>
                  <h4 className="font-medium mb-2">Daily Limits</h4>
                  <div className="space-y-2">
                    {Object.entries(rules.dailyLimits).map(([nutrient, limit]) => (
                      <div key={nutrient} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{nutrient}</span>
                        <span className="text-gray-600">
                          Max: {limit.max}{limit.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* RDA Standards */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">RDA Standards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(healthRules.rdaStandards).map(([category, standards]) => (
                <div key={category}>
                  <h4 className="font-medium mb-2 capitalize">{category.replace(/_/g, ' ')}</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(standards).map(([nutrient, data]) => (
                      <div key={nutrient} className="flex justify-between">
                        <span className="text-gray-700">{data.name}</span>
                        <span className="text-gray-600">{data.min}{data.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Alert Form Modal */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create Manual Alert</h3>
            <form onSubmit={handleCreateManualAlert}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <input
                    type="text"
                    value={manualAlert.userId}
                    onChange={(e) => setManualAlert({ ...manualAlert, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={manualAlert.severity}
                    onChange={(e) => setManualAlert({ ...manualAlert, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <input
                    type="text"
                    value={manualAlert.message}
                    onChange={(e) => setManualAlert({ ...manualAlert, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                  <textarea
                    value={manualAlert.details}
                    onChange={(e) => setManualAlert({ ...manualAlert, details: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="3"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthAlerts;
