const express = require('express');
const User = require('../../models/User');
const DailyTracking = require('../../models/DailyTracking');
const HealthAlert = require('../../models/HealthAlert');
const AdminActionLog = require('../../models/AdminActionLog');
const { authenticateAdmin, requirePermission, logAdminAction } = require('../../middleware/adminAuth');

const router = express.Router();

// Get all users with pagination and filtering
router.get('/', authenticateAdmin, requirePermission('users.read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      healthCondition = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter query
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== 'all') {
      filter.isActive = status === 'active';
    }
    
    if (healthCondition) {
      filter.healthConditions = { $in: [healthCondition] };
    }

    // Build sort query
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password') // Exclude password field
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    // Get additional stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      // Get recent activity count
      const recentActivity = await DailyTracking.countDocuments({
        userId: user._id,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });
      
      // Get health alerts count
      const alertsCount = await HealthAlert.countDocuments({
        userId: user._id,
        acknowledged: false
      });
      
      return {
        ...userObj,
        stats: {
          recentActivity,
          unacknowledgedAlerts: alertsCount,
          lastActive: userObj.lastLogin || userObj.updatedAt
        }
      };
    }));

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'USERS_FETCH_ERROR', message: 'Failed to fetch users.' }
    });
  }
});

// Get single user details
router.get('/:userId', authenticateAdmin, requirePermission('users.read'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
      });
    }

    // Get user activity timeline
    const recentActivity = await DailyTracking.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('date totalCalories totalProtein totalCarbs totalFat createdAt');

    // Get user health alerts
    const healthAlerts = await HealthAlert.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user statistics
    const stats = {
      totalDays: await DailyTracking.countDocuments({ userId }),
      totalAlerts: await HealthAlert.countDocuments({ userId }),
      criticalAlerts: await HealthAlert.countDocuments({ userId, severity: 'critical' }),
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0
    };

    // Calculate averages
    const avgStats = await DailyTracking.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          avgCalories: { $avg: '$totalCalories' },
          avgProtein: { $avg: '$totalProtein' },
          avgCarbs: { $avg: '$totalCarbs' },
          avgFat: { $avg: '$totalFat' }
        }
      }
    ]);

    if (avgStats.length > 0) {
      stats.avgCalories = Math.round(avgStats[0].avgCalories || 0);
      stats.avgProtein = Math.round(avgStats[0].avgProtein || 0);
      stats.avgCarbs = Math.round(avgStats[0].avgCarbs || 0);
      stats.avgFat = Math.round(avgStats[0].avgFat || 0);
    }

    res.json({
      success: true,
      data: {
        user: user.toObject(),
        recentActivity,
        healthAlerts,
        stats
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'USER_DETAILS_ERROR', message: 'Failed to fetch user details.' }
    });
  }
});

// Update user information
router.put('/:userId', authenticateAdmin, requirePermission('users.update'), logAdminAction('user_update'), async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated via admin
    delete updateData.password;
    delete updateData._id;
    delete updateData.__v;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
      });
    }

    res.json({
      success: true,
      data: { user: user.toObject() },
      message: 'User updated successfully.'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'USER_UPDATE_ERROR', message: 'Failed to update user.' }
    });
  }
});

// Block/Unblock user
router.patch('/:userId/status', authenticateAdmin, requirePermission('users.update'), logAdminAction('user_status_change'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isActive: Boolean(isActive),
        updatedAt: new Date(),
        ...(reason && { statusChangeReason: reason })
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
      });
    }

    const action = isActive ? 'activated' : 'blocked';
    
    res.json({
      success: true,
      data: { user: user.toObject() },
      message: `User ${action} successfully.`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'USER_STATUS_ERROR', message: 'Failed to update user status.' }
    });
  }
});

// Delete user (soft delete)
router.delete('/:userId', authenticateAdmin, requirePermission('users.delete'), logAdminAction('user_delete'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent = false } = req.body;
    
    if (permanent) {
      // Hard delete - remove all user data
      await Promise.all([
        User.findByIdAndDelete(userId),
        DailyTracking.deleteMany({ userId }),
        HealthAlert.deleteMany({ userId })
      ]);
      
      res.json({
        success: true,
        message: 'User and all associated data permanently deleted.'
      });
    } else {
      // Soft delete - mark as inactive
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
        });
      }
      
      res.json({
        success: true,
        data: { user: user.toObject() },
        message: 'User deactivated successfully.'
      });
    }

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'USER_DELETE_ERROR', message: 'Failed to delete user.' }
    });
  }
});

// Bulk operations
router.post('/bulk', authenticateAdmin, requirePermission('users.update'), logAdminAction('user_bulk_operation'), async (req, res) => {
  try {
    const { operation, userIds, data } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'User IDs array is required.' }
      });
    }

    let result;
    
    switch (operation) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true, updatedAt: new Date() }
        );
        break;
        
      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false, updatedAt: new Date() }
        );
        break;
        
      case 'delete':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false, deletedAt: new Date(), updatedAt: new Date() }
        );
        break;
        
      case 'update':
        if (!data) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'Update data is required.' }
          });
        }
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { ...data, updatedAt: new Date() }
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPERATION', message: 'Invalid bulk operation.' }
        });
    }

    res.json({
      success: true,
      data: {
        operation,
        affectedUsers: result.modifiedCount,
        totalRequested: userIds.length
      },
      message: `Bulk ${operation} completed successfully.`
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'BULK_OPERATION_ERROR', message: 'Failed to perform bulk operation.' }
    });
  }
});

// Get user statistics summary
router.get('/stats/summary', authenticateAdmin, requirePermission('users.read'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      totalUsers,
      activeUsers,
      newUsers,
      blockedUsers,
      usersWithAlerts,
      topHealthConditions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ isActive: false }),
      HealthAlert.distinct('userId', { acknowledged: false }).then(ids => ids.length),
      User.aggregate([
        { $unwind: '$healthConditions' },
        { $group: { _id: '$healthConditions', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          newUsers,
          blockedUsers,
          usersWithAlerts,
          inactiveUsers: totalUsers - activeUsers
        },
        topHealthConditions,
        timeframe
      }
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'USER_STATS_ERROR', message: 'Failed to fetch user statistics.' }
    });
  }
});

module.exports = router;