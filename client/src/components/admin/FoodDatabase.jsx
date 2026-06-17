import { useState, useEffect } from 'react';
import FoodList from './FoodList';
import FoodEditor from './FoodEditor';
import FoodImport from './FoodImport';

// ── User Logged Foods Tab ─────────────────────────────────────────────────────
const UserLoggedFoods = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => { fetchEntries(); }, [source, page]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page, limit: 50, source, search });
      const res = await fetch(`/api/admin/food/user-logged?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEntries(data.data.entries);
        setPagination(data.data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEntries();
  };

  const sourceLabel = (s) => {
    if (s === 'image_ai') return { label: '📸 Image AI', cls: 'bg-purple-100 text-purple-700' };
    if (s === 'manual')   return { label: '✏️ Manual',   cls: 'bg-blue-100 text-blue-700' };
    return { label: '📋 Meal Plan', cls: 'bg-green-100 text-green-700' };
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search food name..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
            Search
          </button>
        </form>
        <select
          value={source}
          onChange={e => { setSource(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Sources</option>
          <option value="manual">✏️ Manual Entry</option>
          <option value="image_ai">📸 Image Upload (AI)</option>
          <option value="meal_plan">📋 Meal Plan</option>
        </select>
        <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
          Total: <span className="font-bold text-gray-800 ml-1">{pagination.total}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Manual Entries', icon: '✏️', filter: 'manual', color: 'blue' },
          { label: 'Image AI Entries', icon: '📸', filter: 'image_ai', color: 'purple' },
          { label: 'All Logged', icon: '📊', filter: '', color: 'green' },
        ].map(({ label, icon, filter, color }) => (
          <button
            key={filter}
            onClick={() => { setSource(filter); setPage(1); }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              source === filter
                ? `border-${color}-400 bg-${color}-50`
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-sm font-semibold text-gray-700">{label}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading food entries...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-gray-500">No food entries found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Food Name', 'User', 'Calories', 'Protein', 'Carbs', 'Fats', 'Quantity', 'Source', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry, i) => {
                  const src = sourceLabel(entry.source);
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                        {entry.imageUrl && (
                          <img src={entry.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
                        )}
                        {entry.foodName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{entry.userEmail}</td>
                      <td className="px-4 py-3 font-semibold text-orange-600">{entry.calories} kcal</td>
                      <td className="px-4 py-3 text-blue-600">{entry.protein}g</td>
                      <td className="px-4 py-3 text-yellow-600">{entry.carbs}g</td>
                      <td className="px-4 py-3 text-purple-600">{entry.fats}g</td>
                      <td className="px-4 py-3 text-gray-500">{entry.quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${src.cls}`}>
                          {src.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {entry.loggedAt ? new Date(entry.loggedAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
              >← Prev</button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Main FoodDatabase Component ───────────────────────────────────────────────
const FoodDatabase = () => {
  const [activeTab, setActiveTab] = useState('database'); // database | user-logged
  const [currentView, setCurrentView] = useState('list');
  const [selectedFood, setSelectedFood] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: '', category: '', verified: '', status: 'active', sortBy: 'name', sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalFoods: 0 });

  useEffect(() => {
    if (activeTab === 'database') { fetchFoods(); fetchStats(); }
  }, [filters, pagination.currentPage, activeTab]);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({ page: pagination.currentPage, limit: 20, ...filters });
      const response = await fetch(`/api/admin/food?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFoods(data.data.foods);
        setPagination(data.data.pagination);
      } else {
        setError(data.error.message || 'Failed to load food items');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/food/stats/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setStats(data.data);
    } catch (error) { console.error(error); }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handleFoodSave = (savedFood) => {
    if (selectedFood) {
      setFoods(foods.map(f => f._id === savedFood._id ? savedFood : f));
    } else {
      setFoods([savedFood, ...foods]);
    }
    setCurrentView('list');
    setSelectedFood(null);
    fetchStats();
  };

  const handleBulkAction = async (action, foodIds, data = null) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/food/bulk', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: action, foodIds, data })
    });
    const result = await response.json();
    if (result.success) { fetchFoods(); fetchStats(); return result; }
    throw new Error(result.error.message);
  };

  const renderDatabaseView = () => {
    switch (currentView) {
      case 'editor':
        return (
          <FoodEditor
            food={selectedFood}
            onSave={handleFoodSave}
            onCancel={() => { setCurrentView('list'); setSelectedFood(null); }}
          />
        );
      case 'import':
        return (
          <FoodImport
            onComplete={() => { setCurrentView('list'); fetchFoods(); fetchStats(); }}
            onCancel={() => setCurrentView('list')}
          />
        );
      default:
        return (
          <FoodList
            foods={foods}
            loading={loading}
            error={error}
            filters={filters}
            pagination={pagination}
            stats={stats}
            onFilterChange={handleFilterChange}
            onPageChange={(p) => setPagination({ ...pagination, currentPage: p })}
            onFoodSelect={(food) => { setSelectedFood(food); setCurrentView('editor'); }}
            onBulkAction={handleBulkAction}
            onRefresh={fetchFoods}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Food Database</h1>
              <p className="text-gray-600">Manage food items and all user-logged foods</p>
            </div>
            {activeTab === 'database' && currentView === 'list' && (
              <div className="flex items-center gap-3">
                {stats && (
                  <span className="text-sm text-gray-500">
                    Total: {stats.summary.totalFoods} | Verified: {stats.summary.verifiedFoods}
                  </span>
                )}
                <button onClick={() => setCurrentView('import')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                  Import CSV
                </button>
                <button onClick={() => { setSelectedFood(null); setCurrentView('editor'); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                  Add Food
                </button>
              </div>
            )}
            {activeTab === 'database' && currentView !== 'list' && (
              <button onClick={() => setCurrentView('list')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm">
                ← Back to List
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 pb-0">
            {[
              { key: 'database',    label: '🗄️ Food Database',      desc: 'Admin-managed foods' },
              { key: 'user-logged', label: '👤 User Logged Foods',   desc: 'All foods logged by users' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'database' ? renderDatabaseView() : <UserLoggedFoods />}
      </div>
    </div>
  );
};

export default FoodDatabase;
