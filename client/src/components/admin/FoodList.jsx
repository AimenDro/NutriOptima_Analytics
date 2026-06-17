import { useState } from 'react';

const FoodList = ({
  foods,
  loading,
  error,
  filters,
  pagination,
  stats,
  onFilterChange,
  onPageChange,
  onFoodSelect,
  onBulkAction,
  onRefresh
}) => {
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedFoods(foods.map(food => food._id));
    } else {
      setSelectedFoods([]);
    }
  };

  const handleSelectFood = (foodId, checked) => {
    if (checked) {
      setSelectedFoods([...selectedFoods, foodId]);
    } else {
      setSelectedFoods(selectedFoods.filter(id => id !== foodId));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedFoods.length === 0) return;

    setBulkActionLoading(true);
    try {
      await onBulkAction(action, selectedFoods);
      setSelectedFoods([]);
    } catch (error) {
      alert('Bulk action failed: ' + error.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (food) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[food.status]}`}>
        {food.status.replace('_', ' ')}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const categoryColors = {
      fruits: 'bg-red-100 text-red-800',
      vegetables: 'bg-green-100 text-green-800',
      grains: 'bg-yellow-100 text-yellow-800',
      proteins: 'bg-purple-100 text-purple-800',
      dairy: 'bg-blue-100 text-blue-800',
      nuts_seeds: 'bg-orange-100 text-orange-800',
      legumes: 'bg-pink-100 text-pink-800',
      beverages: 'bg-cyan-100 text-cyan-800',
      snacks: 'bg-indigo-100 text-indigo-800',
      desserts: 'bg-rose-100 text-rose-800',
      oils_fats: 'bg-amber-100 text-amber-800',
      herbs_spices: 'bg-lime-100 text-lime-800',
      processed_foods: 'bg-slate-100 text-slate-800',
      other: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryColors[category] || categoryColors.other}`}>
        {category.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={onRefresh}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🍎</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Foods
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.summary.totalFoods.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Verified
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.summary.verifiedFoods.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Review
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.summary.pendingReview.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📈</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Recently Added
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.summary.recentlyAdded.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search foods..."
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                <option value="fruits">Fruits</option>
                <option value="vegetables">Vegetables</option>
                <option value="grains">Grains</option>
                <option value="proteins">Proteins</option>
                <option value="dairy">Dairy</option>
                <option value="nuts_seeds">Nuts & Seeds</option>
                <option value="legumes">Legumes</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="desserts">Desserts</option>
                <option value="oils_fats">Oils & Fats</option>
                <option value="herbs_spices">Herbs & Spices</option>
                <option value="processed_foods">Processed Foods</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange({ status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending_review">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verified
              </label>
              <select
                value={filters.verified}
                onChange={(e) => onFilterChange({ verified: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Items</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  onFilterChange({ sortBy, sortOrder });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="usage.recognitionCount-desc">Most Used</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFoods.length > 0 && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {selectedFoods.length} item{selectedFoods.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('verify')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleBulkAction('unverify')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  Unverify
                </button>
                <button
                  onClick={() => handleBulkAction('activate')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Food Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFoods.length === foods.length && foods.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Food Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nutrition (per 100g)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {foods.map((food) => (
                <tr key={food._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedFoods.includes(food._id)}
                      onChange={(e) => handleSelectFood(food._id, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {food.name}
                      </div>
                      {food.commonNames && food.commonNames.length > 0 && (
                        <div className="text-sm text-gray-500">
                          {food.commonNames.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getCategoryBadge(food.category)}
                    {food.subcategory && (
                      <div className="text-xs text-gray-500 mt-1">
                        {food.subcategory}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>Cal: {food.nutrition.calories}</div>
                      <div>P: {food.nutrition.protein}g</div>
                      <div>C: {food.nutrition.carbs}g</div>
                      <div>F: {food.nutrition.fat}g</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {getStatusBadge(food)}
                      {food.dataQuality.verified && (
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            ✓ Verified
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      Recognition: {food.usage.recognitionCount || 0}
                    </div>
                    <div>
                      Manual: {food.usage.manualEntryCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(food.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => onFoodSelect(food)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleBulkAction(food.dataQuality.verified ? 'unverify' : 'verify', [food._id])}
                      className={`${
                        food.dataQuality.verified 
                          ? 'text-yellow-600 hover:text-yellow-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {food.dataQuality.verified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {foods.length === 0 && !loading && (
          <div className="p-12 text-center">
            <div className="text-gray-500 text-lg mb-2">No food items found</div>
            <div className="text-gray-400 text-sm">
              Try adjusting your search filters
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodList;