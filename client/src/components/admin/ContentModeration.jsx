import { useState, useEffect } from 'react';
import { 
  Eye, 
  Check, 
  X, 
  Flag, 
  Filter, 
  Search,
  Clock,
  AlertTriangle,
  Image,
  FileText,
  MessageSquare,
  StickyNote
} from 'lucide-react';

const ContentModeration = () => {
  const [pendingContent, setPendingContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({
    contentType: '',
    priority: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingContent();
    fetchStats();
  }, [currentPage, filters]);

  const fetchPendingContent = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...filters
      });

      const response = await fetch(`/api/admin/moderation/pending?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingContent(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching pending content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/moderation/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
    }
  };

  const handleApprove = async (contentId) => {
    try {
      const response = await fetch(`/api/admin/moderation/content/${contentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          moderationNotes: 'Approved via admin panel'
        })
      });

      if (response.ok) {
        fetchPendingContent();
        fetchStats();
      }
    } catch (error) {
      console.error('Error approving content:', error);
    }
  };

  const handleReject = async (contentId, reason) => {
    try {
      const response = await fetch(`/api/admin/moderation/content/${contentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          reason,
          moderationNotes: 'Rejected via admin panel'
        })
      });

      if (response.ok) {
        fetchPendingContent();
        fetchStats();
      }
    } catch (error) {
      console.error('Error rejecting content:', error);
    }
  };

  const handleFlag = async (contentId, flagReason) => {
    try {
      const response = await fetch(`/api/admin/moderation/content/${contentId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          flagReason,
          moderationNotes: 'Flagged for further review'
        })
      });

      if (response.ok) {
        fetchPendingContent();
        fetchStats();
      }
    } catch (error) {
      console.error('Error flagging content:', error);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedItems.length === 0) return;

    try {
      const response = await fetch('/api/admin/moderation/batch/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          contentIds: selectedItems,
          moderationNotes: 'Batch approved via admin panel'
        })
      });

      if (response.ok) {
        setSelectedItems([]);
        fetchPendingContent();
        fetchStats();
      }
    } catch (error) {
      console.error('Error batch approving content:', error);
    }
  };

  const handleBatchReject = async (reason) => {
    if (selectedItems.length === 0) return;

    try {
      const response = await fetch('/api/admin/moderation/batch/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          contentIds: selectedItems,
          reason,
          moderationNotes: 'Batch rejected via admin panel'
        })
      });

      if (response.ok) {
        setSelectedItems([]);
        fetchPendingContent();
        fetchStats();
      }
    } catch (error) {
      console.error('Error batch rejecting content:', error);
    }
  };

  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === pendingContent.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(pendingContent.map(item => item._id));
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'food_image': return <Image className="w-4 h-4" />;
      case 'food_entry': return <FileText className="w-4 h-4" />;
      case 'user_comment': return <MessageSquare className="w-4 h-4" />;
      case 'user_note': return <StickyNote className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <div className="flex space-x-2">
          {selectedItems.length > 0 && (
            <>
              <button
                onClick={handleBatchApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Approve Selected ({selectedItems.length})</span>
              </button>
              <button
                onClick={() => handleBatchReject('batch_rejected')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Reject Selected ({selectedItems.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.overall?.find(s => s._id === 'pending')?.count || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.today?.find(s => s._id === 'approved')?.count || 0}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected Today</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.today?.find(s => s._id === 'rejected')?.count || 0}
              </p>
            </div>
            <X className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.overall?.find(s => s._id === 'flagged')?.count || 0}
              </p>
            </div>
            <Flag className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={filters.contentType}
            onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Content Types</option>
            <option value="food_image">Food Images</option>
            <option value="food_entry">Food Entries</option>
            <option value="user_comment">Comments</option>
            <option value="user_note">Notes</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="createdAt">Date Created</option>
            <option value="priority">Priority</option>
            <option value="contentType">Content Type</option>
          </select>

          <select
            value={filters.sortOrder}
            onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pending Content</h2>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedItems.length === pendingContent.length && pendingContent.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {pendingContent.map((item) => (
            <div key={item._id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item._id)}
                    onChange={() => toggleSelectItem(item._id)}
                    className="rounded border-gray-300"
                  />
                  
                  <div className="flex items-center space-x-2">
                    {getContentTypeIcon(item.contentType)}
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.contentType.replace('_', ' ')}
                    </span>
                  </div>

                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApprove(item._id)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                    title="Approve"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReject(item._id, 'inappropriate_content')}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFlag(item._id, 'needs_review')}
                    className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg"
                    title="Flag for Review"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2 ml-8">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>User: {item.userId?.name || 'Unknown'}</span>
                  <span>•</span>
                  <span>Submitted: {formatDate(item.createdAt)}</span>
                  {item.aiResults?.topPrediction && (
                    <>
                      <span>•</span>
                      <span>AI: {item.aiResults.topPrediction.food} ({Math.round(item.aiResults.topPrediction.confidence * 100)}%)</span>
                    </>
                  )}
                </div>

                {item.aiResults?.flaggedReasons && item.aiResults.flaggedReasons.length > 0 && (
                  <div className="mt-1 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-700">
                      Flagged: {item.aiResults.flaggedReasons.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {pendingContent.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No pending content to review</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="px-3 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentModeration;