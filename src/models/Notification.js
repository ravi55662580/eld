const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Notification name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'HOS_VIOLATION',
      'DVIR_REQUIRED', 
      'MAINTENANCE_DUE',
      'LICENSE_EXPIRY',
      'REGISTRATION_EXPIRY',
      'INSURANCE_EXPIRY',
      'DRIVER_INACTIVE',
      'ASSET_INACTIVE',
      'SYSTEM_ALERT',
      'CUSTOM'
    ]
  },
  homeBase: {
    type: String,
    enum: ['Home Terminal', 'Other Terminal', 'All'],
    default: 'All'
  },
  emails: [{
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide valid email addresses'
    ]
  }],
  recipients: {
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    drivers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    }],
    roles: [{
      type: String,
      enum: ['admin', 'manager', 'driver', 'dispatcher']
    }]
  },
  conditions: {
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    frequency: {
      type: String,
      enum: ['immediate', 'hourly', 'daily', 'weekly'],
      default: 'immediate'
    },
    triggers: [{
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains']
      },
      value: String
    }]
  },
  template: {
    subject: {
      type: String,
      required: [true, 'Email subject template is required'],
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    body: {
      type: String,
      required: [true, 'Email body template is required'],
      maxlength: [2000, 'Body cannot exceed 2000 characters']
    },
    variables: [{
      name: String,
      description: String
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastTriggered: Date,
  triggerCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ carrierId: 1, isActive: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ 'conditions.severity': 1 });

module.exports = mongoose.model('Notification', notificationSchema);
