const express = require('express');
const router = express.Router();
const ContentModeration = require('../../models/ContentModeration');
const FoodRecognition = require('../../models/FoodRecognition');
const AdminActionLog = require('../../models/AdminActionLog');
const { authenticateAdmin, requirePermission, logAdminAction } = require('../../middleware/adminAuth');
const mongoose = require('mongoose');

// Get pending content for moderation
router.get('/pending', authenticateAdmin, requirePermission('content.moderate'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      contentType, 
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { status: 'pending' };
    if (contentType) filter.contentType = contentType;
    if (priority) filter.priority = priority;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const pendingContent = await ContentModeration.find(filter)
      .populate('userId', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ContentModeration.countDocuments(filter);

    res.json({
      success: true,
      data: pendingContent,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching pending content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending content' 
    });
  }
});

// Get content moderation queue statistics
router.get('/stats', authenticateAdmin, requirePermission('content.moderate'), async (req, res) => {
  try {
    const stats = await ContentModeration.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await ContentModeration.aggregate([
      {
        $match: { status: 'pending' }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const contentTypeStats = await ContentModeration.aggregate([
      {
        $match: { status: 'pending' }
      },
      {
        $group: {
          _id: '$contentType',
          count: { $sum: 1 }
        }
      }
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayStats = await ContentModeration.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats,
        priority: priorityStats,
        contentType: contentTypeStats,
        today: todayStats
      }
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch moderation statistics' 
    });
  }
});

// Get specific content item for detailed review
router.get('/content/:id', authenticateAdmin, requirePermission('content.moderate'), async (req, res) => {
  try {
    const contentItem = await ContentModeration.findById(req.params.id)
      .populate('userId', 'name email profile')
      .populate('moderatedBy', 'name email');

    if (!contentItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content item not found' 
      });
    }

    // Get the actual content based on type
    let actualContent = null;
    if (contentItem.contentType === 'food_image') {
      actualContent = await FoodRecognition.findById(contentItem.contentId);
    }

    res.json({
      success: true,
      data: {
        moderation: contentItem,
        content: actualContent
      }
    });
  } catch (error) {
    console.error('Error fetching content item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch content item' 
    });
  }
});

// Approve content
router.post('/content/:id/approve', authenticateAdmin, requirePermission('content.moderate'), async (req, res) => {
  try {
    const { moderationNotes, userFeedback } = req.body;

    const contentItem = await ContentModeration.findById(req.params.id);
    if (!contentItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content item not found' 
      });
    }

    if (contentItem.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Content has already been moderated' 
      });
    }

    // Update moderation status
    contentItem.status = 'approved';
    contentItem.moderatedBy = req.admin.id;
    contentItem.moderatedAt = new Date();
    contentItem.moderationReason = 'approved';
    contentItem.moderationNotes = moderationNotes;
    contentItem.userFeedback = userFeedback;

    await contentItem.save();

    // Log admin action
    await AdminActionLog.create({
      adminId: req.admin.id,
      action: 'content_approved',
      targetType: 'ContentModeration',
      targetId: contentItem._id,
      details: {
        contentType: contentItem.contentType,
        userId: contentItem.userId,
        moderationNotes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Content approved successfully',
      data: contentItem
    });
  } catch (error) {
    console.error('Error approving content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve content' 
    });
  }
});

// Reject content
router.post('/content/:id/reject', authenticateAdmin, requirePermission('content.moderate'), async (req, res) => {
  try {
    const { moderationNotes, userFeedback, reason } = req.body;

    if (!reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    const contentItem = await ContentModeration.findById(req.params.id);
    if (!contentItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content item not found' 
      });
    }

    if (contentItem.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Content has already been moderated' 
      });
    }

    // Update moderation status
    contentItem.status = 'rejected';
    contentItem.moderatedBy = req.admin.id;
    contentItem.moderatedAt = new Date();
    contentItem.moderationReason = reason;
    contentItem.moderationNotes = moderationNotes;
    contentItem.userFeedback = userFeedback;

    await contentItem.save();

    // Log admin action
    await AdminActionLog.create({
      adminId: req.admin.id,
      action: 'content_rejected',
      targetType: 'ContentModeration',
      targetId: contentItem._id,
      details: {
        contentType: contentItem.contentType,
        userId: contentItem.userId,
        reason,
        moderationNotes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Content rejected successfully',
      data: contentItem
    });
  } catch (error) {
    console.error('Error rejecting content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject content' 
    });
  }
});

// Flag content for further review
router.post('/content/:id/flag', authenticateAdmin, requirePermission('content.moderate'), async (req, res) => {
  try {
    const { moderationNotes, flagReason, priority } = req.body;

    const contentItem = await ContentModeration.findById(req.params.id);
    if (!contentItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content item not found' 
      });
    }

    // Update moderation status
    contentItem.status = 'flagged';
    contentItem.moderatedBy = req.admin.id;
    contentItem.moderatedAt = new Date();
    contentItem.moderationReason = flagReason;
    contentItem.moderationNotes = moderationNotes;
    if (priority) contentItem.priority = priority;

    await contentItem.save();

    // Log admin action
    await AdminActionLog.create({
      adminId: req.admin.id,
      action: 'content_flagged',
      targetType: 'ContentModeration',
      targetId: contentItem._id,
      details: {
        contentType: contentItem.contentType,
        userId: contentItem.userId,
        flagReason,
        moderationNotes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Content flagged successfully',
      data: contentItem
    });
  } catch (error) {
    console.error('Error flagging content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to flag content' 
    });
  }
});

// Batch approve multiple content items
router.post('/batch/approve', authenticateAdmin, requirePermission('content.moderate'), async (req, res) => {
  try {
    const { contentIds, moderationNotes } = req.body;

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content IDs array is required' 
      });
    }

    const batchId = new mongoose.Types.ObjectId().toString();

    // Update all content items
    const result = await ContentModeration.updateMany(
      { 
        _id: { $in: contentIds }, 
        status: 'pending' 
      },
      {
        $set: {
          status: 'approved',
          moderatedBy: req.admin.id,
          moderatedAt: new Date(),
          moderationReason: 'batch_approved',
          moderationNotes,
          batchId
        }
      }
    );

    // Log admin action
    await AdminActionLog.create({
      adminId: req.admin.id,
      action: 'content_batch_approved',
      targetType: 'ContentModeration',
      details: {
        batchId,
        contentIds,
        count: result.modifiedCount,
        moderationNotes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} content items approved successfully`,
      data: { 
        modifiedCount: result.modifiedCount,
        batchId 
      }
    });
  } catch (error) {
    console.error('Error batch approving content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to batch approve content' 
    });
  }
});

// Batch reject multiple content items
router.post('/batch/reject', authenticateAdmin, requirePermission('content.moderate'), async (req, res) => {
  try {
    const { contentIds, moderationNotes, reason } = req.body;

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content IDs array is required' 
      });
    }

    if (!reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    const batchId = new mongoose.Types.ObjectId().toString();

    // Update all content items
    const result = await ContentModeration.updateMany(
      { 
        _id: { $in: contentIds }, 
        status: 'pending' 
      },
      {
        $set: {
          status: 'rejected',
          moderatedBy: req.admin.id,
          moderatedAt: new Date(),
          moderationReason: reason,
          moderationNotes,
          batchId
        }
      }
    );

    // Log admin action
    await AdminActionLog.create({
      adminId: req.admin.id,
      action: 'content_batch_rejected',
      targetType: 'ContentModeration',
      details: {
        batchId,
        contentIds,
        count: result.modifiedCount,
        reason,
        moderationNotes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} content items rejected successfully`,
      data: { 
        modifiedCount: result.modifiedCount,
        batchId 
      }
    });
  } catch (error) {
    console.error('Error batch rejecting content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to batch reject content' 
    });
  }
});

// Get moderation history
router.get('/history', authenticateAdmin, requirePermission('content.moderate'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      contentType,
      moderatedBy,
      startDate,
      endDate
    } = req.query;

    const filter = { status: { $in: ['approved', 'rejected', 'flagged'] } };
    
    if (status) filter.status = status;
    if (contentType) filter.contentType = contentType;
    if (moderatedBy) filter.moderatedBy = moderatedBy;
    
    if (startDate || endDate) {
      filter.moderatedAt = {};
      if (startDate) filter.moderatedAt.$gte = new Date(startDate);
      if (endDate) filter.moderatedAt.$lte = new Date(endDate);
    }

    const history = await ContentModeration.find(filter)
      .populate('userId', 'name email')
      .populate('moderatedBy', 'name email')
      .sort({ moderatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ContentModeration.countDocuments(filter);

    res.json({
      success: true,
      data: history,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching moderation history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch moderation history' 
    });
  }
});

module.exports = router;