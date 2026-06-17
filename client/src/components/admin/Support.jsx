import { useState, useEffect } from 'react';

const Support = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // New message
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
    } else if (activeTab === 'tickets') {
      fetchTickets();
    } else if (activeTab === 'metrics') {
      fetchMetrics();
    }
    fetchAdmins();
  }, [activeTab, timeframe, filters, pagination.page]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/support/overview?timeframe=${timeframe}`, {
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

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      
      const response = await fetch(`/api/admin/support/tickets?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.data.tickets);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedTicket(data.data.ticket);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/support/metrics?days=30', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/support/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAdmins(data.data.admins);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleAssignTicket = async (ticketId, adminId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminId })
      });
      const data = await response.json();
      if (data.success) {
        fetchTickets();
        if (selectedTicket && selectedTicket._id === ticketId) {
          fetchTicketDetails(ticketId);
        }
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (data.success) {
        fetchTickets();
        if (selectedTicket && selectedTicket._id === ticketId) {
          fetchTicketDetails(ticketId);
        }
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleAddMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/support/tickets/${selectedTicket._id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage, isInternal })
      });
      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        setIsInternal(false);
        fetchTicketDetails(selectedTicket._id);
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  const handleEscalate = async (ticketId) => {
    const reason = prompt('Enter escalation reason:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (data.success) {
        fetchTickets();
        if (selectedTicket && selectedTicket._id === ticketId) {
          fetchTicketDetails(ticketId);
        }
      }
    } catch (error) {
      console.error('Error escalating ticket:', error);
    }
  };

  const handleResolve = async (ticketId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchTickets();
        if (selectedTicket && selectedTicket._id === ticketId) {
          fetchTicketDetails(ticketId);
        }
      }
    } catch (error) {
      console.error('Error resolving ticket:', error);
    }
  };

  const handleClose = async (ticketId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchTickets();
        if (selectedTicket && selectedTicket._id === ticketId) {
          fetchTicketDetails(ticketId);
        }
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in-progress': return 'text-purple-600 bg-purple-100';
      case 'waiting-user': return 'text-yellow-600 bg-yellow-100';
      case 'waiting-admin': return 'text-orange-600 bg-orange-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !overview && !tickets.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support & Issue Tracking</h1>
        <p className="text-gray-600 mt-1">Manage user support tickets and track resolutions</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'tickets', 'metrics'].map(tab => (
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
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Tickets</div>
              <div className="text-2xl font-bold">{overview.stats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Open</div>
              <div className="text-2xl font-bold text-blue-600">{overview.stats.open}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">In Progress</div>
              <div className="text-2xl font-bold text-purple-600">{overview.stats.inProgress}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Resolved</div>
              <div className="text-2xl font-bold text-green-600">{overview.stats.resolved}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Escalated</div>
              <div className="text-2xl font-bold text-red-600">{overview.stats.escalated}</div>
            </div>
          </div>

          {/* Response Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Avg Response Time</h3>
              <div className="text-3xl font-bold text-indigo-600">{overview.stats.avgResponseTime}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Avg Resolution Time</h3>
              <div className="text-3xl font-bold text-indigo-600">{overview.stats.avgResolutionTime}</div>
            </div>
          </div>

          {/* By Priority */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Tickets by Priority</h3>
            <div className="space-y-2">
              {Object.entries(overview.stats.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <span className="text-gray-700 capitalize">{priority}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Category */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Tickets by Category</h3>
            <div className="space-y-2">
              {Object.entries(overview.stats.byCategory).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-700">{category}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2">
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
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="waiting-user">Waiting User</option>
                  <option value="waiting-admin">Waiting Admin</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  <option value="technical">Technical</option>
                  <option value="content">Content</option>
                  <option value="account">Account</option>
                  <option value="health-related">Health Related</option>
                  <option value="billing">Billing</option>
                  <option value="feature-request">Feature Request</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Assignments</option>
                  <option value="unassigned">Unassigned</option>
                  {admins.map(admin => (
                    <option key={admin._id} value={admin._id}>{admin.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div
                  key={ticket._id}
                  onClick={() => fetchTicketDetails(ticket._id)}
                  className={`bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition ${
                    selectedTicket && selectedTicket._id === ticket._id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{ticket.ticketNumber}</div>
                      <div className="text-sm text-gray-600">{ticket.subject}</div>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{ticket.userEmail}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  {ticket.assignedToEmail && (
                    <div className="mt-2 text-xs text-gray-600">
                      Assigned to: {ticket.assignedToEmail}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
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

          {/* Ticket Details */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{selectedTicket.ticketNumber}</h3>
                  <p className="text-sm text-gray-600">{selectedTicket.subject}</p>
                </div>

                {/* Actions */}
                <div className="mb-4 space-y-2">
                  <select
                    value={selectedTicket.assignedTo?._id || ''}
                    onChange={(e) => handleAssignTicket(selectedTicket._id, e.target.value || 'self')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Assign to...</option>
                    <option value="self">Assign to me</option>
                    {admins.map(admin => (
                      <option key={admin._id} value={admin._id}>{admin.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdateTicket(selectedTicket._id, { priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>

                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateTicket(selectedTicket._id, { status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="waiting-user">Waiting User</option>
                    <option value="waiting-admin">Waiting Admin</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEscalate(selectedTicket._id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                    >
                      Escalate
                    </button>
                    <button
                      onClick={() => handleResolve(selectedTicket._id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    >
                      Resolve
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Messages</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                    {selectedTicket.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.sender === 'admin'
                            ? 'bg-indigo-50 ml-4'
                            : 'bg-gray-50 mr-4'
                        } ${msg.isInternal ? 'border-2 border-yellow-300' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">{msg.senderEmail}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{msg.message}</p>
                        {msg.isInternal && (
                          <span className="text-xs text-yellow-700 font-medium">Internal Note</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Message Form */}
                  <form onSubmit={handleAddMessage}>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
                      rows="3"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="mr-2"
                        />
                        Internal note
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                Select a ticket to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Tickets</div>
              <div className="text-3xl font-bold">{metrics.totalTickets}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Open Tickets</div>
              <div className="text-3xl font-bold text-blue-600">{metrics.openTickets}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">First Response Rate</div>
              <div className="text-3xl font-bold text-green-600">{metrics.firstResponseRate}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Resolution Rate</div>
              <div className="text-3xl font-bold text-green-600">{metrics.resolutionRate}</div>
            </div>
          </div>

          {/* Response & Resolution Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Avg First Response Time</h3>
              <div className="text-3xl font-bold text-indigo-600">{metrics.avgFirstResponseTime}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Avg Resolution Time</h3>
              <div className="text-3xl font-bold text-indigo-600">{metrics.avgResolutionTime}</div>
            </div>
          </div>

          {/* SLA Compliance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">SLA Compliance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Response Time SLA (Target: {metrics.slaCompliance.responseTime.target} min)</span>
                  <span className="text-sm text-gray-600">
                    {metrics.slaCompliance.responseTime.met} met / {metrics.slaCompliance.responseTime.missed} missed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{
                      width: `${
                        (metrics.slaCompliance.responseTime.met /
                          (metrics.slaCompliance.responseTime.met + metrics.slaCompliance.responseTime.missed)) *
                        100
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Resolution Time SLA (Target: {metrics.slaCompliance.resolutionTime.target} hrs)</span>
                  <span className="text-sm text-gray-600">
                    {metrics.slaCompliance.resolutionTime.met} met / {metrics.slaCompliance.resolutionTime.missed} missed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{
                      width: `${
                        (metrics.slaCompliance.resolutionTime.met /
                          (metrics.slaCompliance.resolutionTime.met + metrics.slaCompliance.resolutionTime.missed)) *
                        100
                      }%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance by Admin */}
          {Object.keys(metrics.byAdmin).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Performance by Admin</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Open</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resolved</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(metrics.byAdmin).map(([email, stats]) => (
                      <tr key={email}>
                        <td className="px-4 py-2 text-sm text-gray-900">{email}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{stats.total}</td>
                        <td className="px-4 py-2 text-sm text-blue-600">{stats.open}</td>
                        <td className="px-4 py-2 text-sm text-green-600">{stats.resolved}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Support;
