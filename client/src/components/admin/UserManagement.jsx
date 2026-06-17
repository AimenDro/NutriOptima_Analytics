import { useState, useEffect } from 'react';
import UserList from './UserList';
import UserDetails from './UserDetails';

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    healthCondition: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: 20,
        ...filters
      });

      const response = await fetch(`/api/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        setError(data.error.message || 'Failed to load users');
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleUserUpdate = (updatedUser) => {
    setUsers(users.map(user => 
      user._id === updatedUser._id ? updatedUser : user
    ));
    setSelectedUser(updatedUser);
  };

  const handleBulkAction = async (action, userIds, data = null) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: action,
          userIds,
          data
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh users list
        fetchUsers();
        return result;
      } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      throw error;
    }
  };

  if (selectedUser) {
    return (
      <UserDetails
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onUserUpdate={handleUserUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Total Users: {pagination.totalUsers}
              </div>
              <button
                onClick={fetchUsers}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserList
          users={users}
          loading={loading}
          error={error}
          filters={filters}
          pagination={pagination}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onUserSelect={handleUserSelect}
          onBulkAction={handleBulkAction}
          onRefresh={fetchUsers}
        />
      </div>
    </div>
  );
};

export default UserManagement;