const express = require('express');
const router = express.Router();
const SupportTicket = require('../../models/SupportTicket');
const User = require('../../models/User');
const AdminUser = require('../../models/AdminUser');
const { authenticateAdmin, requirePermission } = require('../../middleware/adminAuth');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/support/overview
 * Get support tickets overview and statistics
 */
router.get('/overview', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get all tickets in timeframe
    const tickets = await SupportTicket.find({
      createdAt: { $gte: startDate }
    });

    // Calculate statistics
    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      byPriority: {
        critical: tickets.filter(t => t.priority === 'critical').length,
        high: tickets.filter(t => t.priority === 'high').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        low: tickets.filter(t => t.priority === 'low').length
      },
      byCategory: {
        technical: tickets.filter(t => t.category === 'technical').length,
        content: tickets.filter(t => t.category === 'content').length,
        account: tickets.filter(t => t.category === 'account').length,
        'health-related': tickets.filter(t => t.category === 'health-related').length,
        billing: tickets.filter(t => t.category === 'billing').length,
        'feature-request': tickets.filter(t => t.category === 'feature-request').length,
        other: tickets.filter(t => t.category === 'other').length
      },
      escalated: tickets.filter(t => t.isEscalated).length
    };

    // Calculate average response time
    const ticketsWithResponse = tickets.filter(t => t.firstResponseAt);
    const avgResponseTime = ticketsWithResponse.length > 0
      ? ticketsWithResponse.reduce((sum, t) => {
          return sum + (t.firstResponseAt - t.createdAt);
        }, 0) / ticketsWithResponse.length / 1000 / 60 // minutes
      : 0;

    // Calculate average resolution time
    const resolvedTickets = tickets.filter(t => t.resolvedAt);
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          return sum + (t.resolvedAt - t.createdAt);
        }, 0) / resolvedTickets.length / 1000 / 60 / 60 // hours
      : 0;

    stats.avgResponseTime = avgResponseTime.toFixed(1) + ' minutes';
    stats.avgResolutionTime = avgResolutionTime.toFixed(1) + ' hours';

    res.json({
      success: true,
      data: { stats, timeframe }
    });
  } catch (error) {
    console.error('Error fetching support overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support overview'
    });
  }
});

/**
 * GET /api/admin/support/tickets
 * Get paginated list of support tickets with filters
 */
router.get('/tickets', requirePermission('view_analytics'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        query.assignedTo = null;
      } else {
        query.assignedTo = assignedTo;
      }
    }
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('userId', 'name email')
        .populate('assignedTo', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      SupportTicket.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets'
    });
  }
});

/**
 * GET /api/admin/support/tickets/:id
 * Get detailed ticket information
 */
router.get('/tickets/:id', requirePermission('view_analytics'), async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'name email age gender healthConditions')
      .populate('assignedTo', 'name email role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      data: { ticket }
    });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket details'
    });
  }
});

/**
 * POST /api/admin/support/tickets
 * Create a new support ticket (admin-initiated)
 */
router.post('/tickets', requirePermission('manage_users'), async (req, res) => {
  try {
    const { userId, subject, description, category, priority = 'medium' } = req.body;

    if (!userId || !subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const ticket = await SupportTicket.create({
      userId: user._id,
      userEmail: user.email,
      subject,
      description,
      category,
      priority,
      messages: [{
        sender: 'admin',
        senderEmail: req.admin.email,
        message: description,
        isInternal: false
      }]
    });

    res.json({
      success: true,
      message: 'Ticket created successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket'
    });
  }
});

/**
 * PUT /api/admin/support/tickets/:id
 * Update ticket details
 */
router.put('/tickets/:id', requirePermission('manage_users'), async (req, res) => {
  try {
    const { status, priority, category, tags } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (category) ticket.category = category;
    if (tags) ticket.tags = tags;

    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket'
    });
  }
});

/**
 * POST /api/admin/support/tickets/:id/assign
 * Assign ticket to admin
 */
router.post('/tickets/:id/assign', requirePermission('manage_users'), async (req, res) => {
  try {
    const { adminId } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    let admin;
    if (adminId === 'self') {
      admin = req.admin;
    } else {
      admin = await AdminUser.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }
    }

    await ticket.assignTo(admin._id, admin.email);

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket'
    });
  }
});

/**
 * POST /api/admin/support/tickets/:id/messages
 * Add message to ticket
 */
router.post('/tickets/:id/messages', requirePermission('manage_users'), async (req, res) => {
  try {
    const { message, isInternal = false } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.addMessage('admin', req.admin.email, message, isInternal);

    res.json({
      success: true,
      message: 'Message added successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message'
    });
  }
});

/**
 * POST /api/admin/support/tickets/:id/escalate
 * Escalate ticket
 */
router.post('/tickets/:id/escalate', requirePermission('manage_users'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.escalate(reason || 'Escalated by admin');

    res.json({
      success: true,
      message: 'Ticket escalated successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Error escalating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to escalate ticket'
    });
  }
});

/**
 * POST /api/admin/support/tickets/:id/resolve
 * Mark ticket as resolved
 */
router.post('/tickets/:id/resolve', requirePermission('manage_users'), async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.resolve();

    res.json({
      success: true,
      message: 'Ticket resolved successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Error resolving ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve ticket'
    });
  }
});

/**
 * POST /api/admin/support/tickets/:id/close
 * Close ticket
 */
router.post('/tickets/:id/close', requirePermission('manage_users'), async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.close();

    res.json({
      success: true,
      message: 'Ticket closed successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close ticket'
    });
  }
});

/**
 * GET /api/admin/support/metrics
 * Get support metrics and SLA tracking
 */
router.get('/metrics', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const tickets = await SupportTicket.find({
      createdAt: { $gte: startDate }
    }).populate('assignedTo', 'name email');

    // Calculate metrics
    const metrics = {
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => ['open', 'in-progress', 'waiting-user', 'waiting-admin'].includes(t.status)).length,
      resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      
      // Response time metrics
      firstResponseRate: 0,
      avgFirstResponseTime: 0,
      
      // Resolution metrics
      resolutionRate: 0,
      avgResolutionTime: 0,
      
      // By admin
      byAdmin: {},
      
      // SLA compliance
      slaCompliance: {
        responseTime: { met: 0, missed: 0, target: 60 }, // 60 minutes
        resolutionTime: { met: 0, missed: 0, target: 24 } // 24 hours
      }
    };

    // Calculate response metrics
    const ticketsWithResponse = tickets.filter(t => t.firstResponseAt);
    metrics.firstResponseRate = tickets.length > 0 
      ? ((ticketsWithResponse.length / tickets.length) * 100).toFixed(1) + '%'
      : '0%';

    if (ticketsWithResponse.length > 0) {
      const totalResponseTime = ticketsWithResponse.reduce((sum, t) => {
        const responseTime = (t.firstResponseAt - t.createdAt) / 1000 / 60; // minutes
        
        // Check SLA
        if (responseTime <= 60) {
          metrics.slaCompliance.responseTime.met++;
        } else {
          metrics.slaCompliance.responseTime.missed++;
        }
        
        return sum + responseTime;
      }, 0);
      
      metrics.avgFirstResponseTime = (totalResponseTime / ticketsWithResponse.length).toFixed(1) + ' minutes';
    }

    // Calculate resolution metrics
    const resolvedTickets = tickets.filter(t => t.resolvedAt);
    metrics.resolutionRate = tickets.length > 0
      ? ((resolvedTickets.length / tickets.length) * 100).toFixed(1) + '%'
      : '0%';

    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((sum, t) => {
        const resolutionTime = (t.resolvedAt - t.createdAt) / 1000 / 60 / 60; // hours
        
        // Check SLA
        if (resolutionTime <= 24) {
          metrics.slaCompliance.resolutionTime.met++;
        } else {
          metrics.slaCompliance.resolutionTime.missed++;
        }
        
        return sum + resolutionTime;
      }, 0);
      
      metrics.avgResolutionTime = (totalResolutionTime / resolvedTickets.length).toFixed(1) + ' hours';
    }

    // Calculate by admin
    tickets.forEach(ticket => {
      if (ticket.assignedTo) {
        const adminEmail = ticket.assignedToEmail || ticket.assignedTo.email;
        if (!metrics.byAdmin[adminEmail]) {
          metrics.byAdmin[adminEmail] = {
            total: 0,
            open: 0,
            resolved: 0
          };
        }
        metrics.byAdmin[adminEmail].total++;
        if (['open', 'in-progress', 'waiting-user', 'waiting-admin'].includes(ticket.status)) {
          metrics.byAdmin[adminEmail].open++;
        } else if (ticket.status === 'resolved' || ticket.status === 'closed') {
          metrics.byAdmin[adminEmail].resolved++;
        }
      }
    });

    res.json({
      success: true,
      data: { metrics, analyzedDays: parseInt(days) }
    });
  } catch (error) {
    console.error('Error calculating support metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate support metrics'
    });
  }
});

/**
 * GET /api/admin/support/admins
 * Get list of admins for assignment
 */
router.get('/admins', requirePermission('view_analytics'), async (req, res) => {
  try {
    const admins = await AdminUser.find({ isActive: true })
      .select('name email role')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { admins }
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admins'
    });
  }
});

module.exports = router;
