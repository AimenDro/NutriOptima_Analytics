const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  senderEmail: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number
  }],
  isInternal: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  
  // Issue details
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'content', 'account', 'health-related', 'billing', 'feature-request', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['open', 'in-progress', 'waiting-user', 'waiting-admin', 'resolved', 'closed'],
    default: 'open'
  },
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  assignedToEmail: String,
  
  // Communication
  messages: [messageSchema],
  
  // Metadata
  tags: [String],
  relatedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket'
  }],
  
  // SLA tracking
  firstResponseAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  
  // Escalation
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: Date,
  escalationReason: String,
  
  // Satisfaction
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  userFeedback: String
}, {
  timestamps: true
});

// Indexes
supportTicketSchema.index({ ticketNumber: 1 });
supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ category: 1, priority: 1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

// Generate ticket number
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Methods
supportTicketSchema.methods.addMessage = function(sender, senderEmail, message, isInternal = false) {
  this.messages.push({
    sender,
    senderEmail,
    message,
    isInternal
  });
  
  // Update status based on sender
  if (sender === 'user' && this.status === 'waiting-user') {
    this.status = 'waiting-admin';
  } else if (sender === 'admin' && this.status === 'waiting-admin') {
    this.status = 'waiting-user';
  }
  
  // Track first response
  if (sender === 'admin' && !this.firstResponseAt) {
    this.firstResponseAt = new Date();
  }
  
  return this.save();
};

supportTicketSchema.methods.assignTo = function(adminId, adminEmail) {
  this.assignedTo = adminId;
  this.assignedToEmail = adminEmail;
  if (this.status === 'open') {
    this.status = 'in-progress';
  }
  return this.save();
};

supportTicketSchema.methods.escalate = function(reason) {
  this.isEscalated = true;
  this.escalatedAt = new Date();
  this.escalationReason = reason;
  this.priority = 'critical';
  return this.save();
};

supportTicketSchema.methods.resolve = function() {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  return this.save();
};

supportTicketSchema.methods.close = function() {
  this.status = 'closed';
  this.closedAt = new Date();
  return this.save();
};

// Static methods
supportTicketSchema.statics.getOpenTickets = function() {
  return this.find({ 
    status: { $in: ['open', 'in-progress', 'waiting-user', 'waiting-admin'] }
  }).sort({ priority: -1, createdAt: 1 });
};

supportTicketSchema.statics.getTicketsByAdmin = function(adminId) {
  return this.find({ assignedTo: adminId })
    .sort({ priority: -1, createdAt: -1 });
};

supportTicketSchema.statics.getCriticalTickets = function() {
  return this.find({ 
    priority: 'critical',
    status: { $in: ['open', 'in-progress', 'waiting-admin'] }
  }).sort({ createdAt: 1 });
};

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;
