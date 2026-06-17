import { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Flag, 
  ArrowLeft,
  Image,
  User,
  Calendar,
  AlertTriangle,
  Star,
  FileText
} from 'lucide-react';

const ContentReview = ({ contentId, onClose, onAction }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [moderationNotes, setModerationNotes] = useState('');
  const [userFeedback, setUserFeedback] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (contentId) {
      fetchContentDetails();
    }
  }, [contentId]);

  const fetchContentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/moderation/content/${contentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.data);
      }
    } catch (error) {
      console.error('Error fetching content details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/moderation/content/${contentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          moderationNotes,
          userFeedback
        })
      });

      if (response.ok) {
        onAction('approved');
        onClose();
      }
    } catch (error) {
      console.error('Error approving content:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      alert('Please select a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/moderation/content/${contentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          reason: rejectionReason,
          moderationNotes,
          userFeedback
        })
      });

      if (response.ok) {
        onAction('rejected');
        onClose();
      }
    } catch (error) {
      console.error('Error rejecting content:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlag = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/moderation/content/${contentId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          flagReason: 'needs_further_review',
          moderationNotes,
          priority: 'high'
        })
      });

      if (response.ok) {
        onAction('flagged');
        onClose();
      }
    } catch (error) {
      console.error('Error flagging content:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-center text-gray-600">Loading content details...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  const { moderation, content: actualContent } = content;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">Content Review</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(moderation.priority)}`}>
              {moderation.priority} priority
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Content Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{moderation.userId?.name || 'Unknown User'}</p>
                  <p className="text-sm text-gray-600">{moderation.userId?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="font-medium text-gray-900">{formatDate(moderation.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Content Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {moderation.contentType.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Results */}
            {moderation.aiResults && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">AI Analysis</h3>
                
                {moderation.aiResults.topPrediction && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Top Prediction</span>
                    </div>
                    <p className="text-lg font-semibold text-blue-900">
                      {moderation.aiResults.topPrediction.food}
                    </p>
                    <p className="text-sm text-blue-700">
                      Confidence: {Math.round(moderation.aiResults.topPrediction.confidence * 100)}%
                    </p>
                  </div>
                )}

                {moderation.aiResults.flaggedReasons && moderation.aiResults.flaggedReasons.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Flagged Issues</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-yellow-800">
                      {moderation.aiResults.flaggedReasons.map((reason, index) => (
                        <li key={index} className="capitalize">{reason.replace('_', ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {moderation.aiResults.predictions && moderation.aiResults.predictions.length > 1 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">All Predictions</h4>
                    <div className="space-y-2">
                      {moderation.aiResults.predictions.slice(0, 5).map((prediction, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{prediction.food}</span>
                          <span className="text-sm text-gray-500">
                            {Math.round(prediction.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image Display */}
          {moderation.contentType === 'food_image' && moderation.imageData && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Image Content</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Image className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-900">Food Image</span>
                </div>
                
                {moderation.imageData.originalPath && (
                  <div className="mb-4">
                    <img
                      src={`/uploads/${moderation.imageData.originalPath}`}
                      alt="Food content"
                      className="max-w-full h-auto rounded-lg border"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">File Size:</span> {Math.round(moderation.imageData.fileSize / 1024)} KB
                  </div>
                  <div>
                    <span className="font-medium">Format:</span> {moderation.imageData.format}
                  </div>
                  {moderation.imageData.dimensions && (
                    <>
                      <div>
                        <span className="font-medium">Width:</span> {moderation.imageData.dimensions.width}px
                      </div>
                      <div>
                        <span className="font-medium">Height:</span> {moderation.imageData.dimensions.height}px
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Text Content */}
          {moderation.textContent && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Text Content</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {moderation.textContent.title && (
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">Title:</span>
                    <p className="text-gray-900">{moderation.textContent.title}</p>
                  </div>
                )}
                {moderation.textContent.description && (
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="text-gray-900">{moderation.textContent.description}</p>
                  </div>
                )}
                {moderation.textContent.notes && (
                  <div>
                    <span className="font-medium text-gray-700">Notes:</span>
                    <p className="text-gray-900">{moderation.textContent.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Moderation Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Moderation Decision</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes
              </label>
              <textarea
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Add internal notes about this moderation decision..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Feedback (Optional)
              </label>
              <textarea
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Message to send to the user (optional)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (if rejecting)
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select rejection reason...</option>
                <option value="inappropriate_content">Inappropriate Content</option>
                <option value="low_quality_image">Low Quality Image</option>
                <option value="not_food_related">Not Food Related</option>
                <option value="duplicate_content">Duplicate Content</option>
                <option value="spam">Spam</option>
                <option value="violates_guidelines">Violates Guidelines</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={actionLoading}
            >
              Cancel
            </button>
            
            <button
              onClick={handleFlag}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
              disabled={actionLoading}
            >
              <Flag className="w-4 h-4" />
              <span>Flag for Review</span>
            </button>
            
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              disabled={actionLoading}
            >
              <X className="w-4 h-4" />
              <span>Reject</span>
            </button>
            
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              disabled={actionLoading}
            >
              <Check className="w-4 h-4" />
              <span>Approve</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentReview;