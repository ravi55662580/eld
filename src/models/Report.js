const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Basic Information
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier',
    required: true,
    index: true
  },
  reportName: {
    type: String,
    required: true,
    trim: true
  },
  reportDescription: String,
  
  // Report Type and Category
  reportType: {
    type: String,
    required: true,
    enum: [
      'HOURS_OF_SERVICE',
      'DRIVER_LOG',
      'VEHICLE_USAGE',
      'FUEL_EFFICIENCY',
      'COMPLIANCE_SUMMARY',
      'IFTA_QUARTERLY',
      'DVIR_SUMMARY',
      'VIOLATION_REPORT',
      'SAFETY_METRICS',
      'MAINTENANCE_DUE',
      'DRIVER_SCORECARD',
      'ASSET_UTILIZATION',
      'ROUTE_ANALYSIS',
      'COST_ANALYSIS',
      'INSPECTION_HISTORY',
      'DRUG_ALCOHOL_TESTING',
      'TRAINING_COMPLETION',
      'DOCUMENT_EXPIRATION',
      'PERFORMANCE_DASHBOARD',
      'REGULATORY_FILING',
      'CUSTOM_REPORT'
    ],
    index: true
  },
  
  reportCategory: {
    type: String,
    enum: ['OPERATIONAL', 'COMPLIANCE', 'FINANCIAL', 'SAFETY', 'MAINTENANCE', 'REGULATORY'],
    required: true,
    index: true
  },
  
  // Report Configuration
  configuration: {
    // Data Sources
    dataSources: [{
      sourceType: {
        type: String,
        enum: ['LOGBOOK', 'DVIR', 'FUEL_RECEIPT', 'VIOLATION', 'STATE_MILEAGE', 'COMPLIANCE', 'DRIVER', 'ASSET', 'CARRIER']
      },
      collection: String,
      fields: [String],
      filters: mongoose.Schema.Types.Mixed
    }],
    
    // Report Parameters
    parameters: [{
      name: String,
      type: {
        type: String,
        enum: ['DATE_RANGE', 'DRIVER_SELECTION', 'VEHICLE_SELECTION', 'STATE_SELECTION', 'DROPDOWN', 'TEXT', 'NUMBER', 'BOOLEAN']
      },
      label: String,
      required: {
        type: Boolean,
        default: false
      },
      defaultValue: mongoose.Schema.Types.Mixed,
      options: [String], // For dropdown parameters
      validation: {
        min: Number,
        max: Number,
        pattern: String
      }
    }],
    
    // Grouping and Aggregation
    groupBy: [String],
    aggregations: [{
      field: String,
      operation: {
        type: String,
        enum: ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'DISTINCT_COUNT']
      },
      alias: String
    }],
    
    // Sorting
    sortBy: [{
      field: String,
      direction: {
        type: String,
        enum: ['ASC', 'DESC'],
        default: 'ASC'
      }
    }],
    
    // Filtering
    filters: [{
      field: String,
      operator: {
        type: String,
        enum: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'STARTS_WITH', 'IN', 'NOT_IN', 'BETWEEN']
      },
      value: mongoose.Schema.Types.Mixed,
      values: [mongoose.Schema.Types.Mixed] // For IN, NOT_IN operators
    }],
    
    // Formatting
    formatting: {
      numberFormat: {
        decimals: {
          type: Number,
          default: 2
        },
        thousandsSeparator: {
          type: String,
          default: ','
        },
        decimalSeparator: {
          type: String,
          default: '.'
        }
      },
      dateFormat: {
        type: String,
        default: 'MM/DD/YYYY'
      },
      currencyFormat: {
        symbol: {
          type: String,
          default: '$'
        },
        position: {
          type: String,
          enum: ['PREFIX', 'SUFFIX'],
          default: 'PREFIX'
        }
      }
    }
  },
  
  // Schedule Configuration
  schedule: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'],
      default: 'ONCE'
    },
    scheduledTime: String, // HH:MM format
    scheduledDays: [String], // For weekly: ['MONDAY', 'WEDNESDAY'], for monthly: ['1', '15']
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    nextRunDate: Date,
    lastRunDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // Output Configuration
  output: {
    format: {
      type: String,
      enum: ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
      default: 'PDF'
    },
    template: String, // Custom template name or ID
    includeCharts: {
      type: Boolean,
      default: false
    },
    chartTypes: [{
      type: String,
      enum: ['BAR', 'LINE', 'PIE', 'AREA', 'SCATTER', 'HISTOGRAM']
    }],
    pageSize: {
      type: String,
      enum: ['A4', 'LETTER', 'LEGAL', 'A3'],
      default: 'LETTER'
    },
    orientation: {
      type: String,
      enum: ['PORTRAIT', 'LANDSCAPE'],
      default: 'PORTRAIT'
    }
  },
  
  // Distribution
  distribution: {
    recipients: [{
      type: {
        type: String,
        enum: ['EMAIL', 'FTP', 'API_WEBHOOK', 'FILE_SHARE']
      },
      address: String, // email, FTP URL, webhook URL, file path
      credentials: {
        username: String,
        password: String // Should be encrypted
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    subject: String,
    message: String,
    attachmentName: String
  },
  
  // Execution History
  executions: [{
    executedAt: {
      type: Date,
      default: Date.now
    },
    executedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    executionType: {
      type: String,
      enum: ['MANUAL', 'SCHEDULED', 'API'],
      default: 'MANUAL'
    },
    parameters: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'RUNNING'
    },
    startTime: Date,
    endTime: Date,
    duration: Number, // in milliseconds
    recordCount: Number,
    fileSize: Number, // in bytes
    fileName: String,
    filePath: String,
    downloadUrl: String,
    errorMessage: String,
    distributionStatus: [{
      recipient: String,
      status: {
        type: String,
        enum: ['PENDING', 'SENT', 'FAILED']
      },
      sentAt: Date,
      errorMessage: String
    }]
  }],
  
  // Performance Metrics
  performance: {
    averageExecutionTime: {
      type: Number,
      default: 0
    },
    totalExecutions: {
      type: Number,
      default: 0
    },
    successfulExecutions: {
      type: Number,
      default: 0
    },
    failedExecutions: {
      type: Number,
      default: 0
    },
    lastSuccessfulRun: Date,
    averageRecordCount: {
      type: Number,
      default: 0
    },
    averageFileSize: {
      type: Number,
      default: 0
    }
  },
  
  // Access Control
  access: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    allowedRoles: [{
      type: String,
      enum: ['admin', 'manager', 'dispatcher', 'driver', 'viewer']
    }],
    allowedUsers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permissions: [{
        type: String,
        enum: ['VIEW', 'EXECUTE', 'EDIT', 'DELETE', 'SCHEDULE']
      }]
    }]
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  changeHistory: [{
    version: Number,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changeType: {
      type: String,
      enum: ['CREATED', 'UPDATED', 'SCHEDULED', 'UNSCHEDULED', 'ARCHIVED', 'RESTORED']
    },
    description: String,
    previousConfiguration: mongoose.Schema.Types.Mixed
  }],
  
  // Metadata
  tags: [String],
  isTemplate: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedDate: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Custom Fields for extensibility
  customFields: mongoose.Schema.Types.Mixed,
  
  // Usage Statistics
  usage: {
    viewCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    lastAccessed: Date,
    topUsers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      accessCount: Number,
      lastAccess: Date
    }]
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
reportSchema.index({ carrierId: 1, reportType: 1, isArchived: 1 });
reportSchema.index({ carrierId: 1, reportCategory: 1, 'schedule.isScheduled': 1 });
reportSchema.index({ 'access.createdBy': 1, isArchived: 1 });
reportSchema.index({ 'schedule.nextRunDate': 1, 'schedule.isActive': 1 });
reportSchema.index({ reportType: 1, reportCategory: 1 });
reportSchema.index({ tags: 1 });
reportSchema.index({ isTemplate: 1, isArchived: 1 });

// Virtual for success rate
reportSchema.virtual('successRate').get(function() {
  if (this.performance.totalExecutions === 0) return 100;
  return ((this.performance.successfulExecutions / this.performance.totalExecutions) * 100).toFixed(2);
});

// Virtual for next scheduled run
reportSchema.virtual('nextScheduledRun').get(function() {
  return this.schedule.isScheduled && this.schedule.isActive ? this.schedule.nextRunDate : null;
});

// Virtual for is overdue
reportSchema.virtual('isOverdue').get(function() {
  if (!this.schedule.isScheduled || !this.schedule.isActive) return false;
  return this.schedule.nextRunDate < new Date();
});

// Pre-save middleware
reportSchema.pre('save', function(next) {
  // Update performance averages
  if (this.performance.totalExecutions > 0) {
    const completedExecutions = this.executions.filter(e => e.status === 'COMPLETED');
    
    if (completedExecutions.length > 0) {
      this.performance.averageExecutionTime = completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length;
      this.performance.averageRecordCount = completedExecutions.reduce((sum, e) => sum + (e.recordCount || 0), 0) / completedExecutions.length;
      this.performance.averageFileSize = completedExecutions.reduce((sum, e) => sum + (e.fileSize || 0), 0) / completedExecutions.length;
    }
  }
  
  next();
});

// Method to execute report
reportSchema.methods.execute = async function(parameters = {}, executedBy) {
  const execution = {
    executedBy: executedBy,
    executionType: executedBy ? 'MANUAL' : 'SCHEDULED',
    parameters: parameters,
    startTime: new Date(),
    status: 'RUNNING'
  };
  
  this.executions.push(execution);
  this.performance.totalExecutions += 1;
  
  // Update usage statistics
  this.usage.viewCount += 1;
  this.usage.lastAccessed = new Date();
  
  return this.save();
};

// Method to complete execution
reportSchema.methods.completeExecution = function(executionId, result) {
  const execution = this.executions.id(executionId);
  if (execution) {
    execution.status = result.status || 'COMPLETED';
    execution.endTime = new Date();
    execution.duration = execution.endTime - execution.startTime;
    execution.recordCount = result.recordCount;
    execution.fileSize = result.fileSize;
    execution.fileName = result.fileName;
    execution.filePath = result.filePath;
    execution.downloadUrl = result.downloadUrl;
    execution.errorMessage = result.errorMessage;
    
    if (execution.status === 'COMPLETED') {
      this.performance.successfulExecutions += 1;
      this.performance.lastSuccessfulRun = execution.endTime;
      this.usage.downloadCount += 1;
    } else if (execution.status === 'FAILED') {
      this.performance.failedExecutions += 1;
    }
  }
  
  return this.save();
};

// Method to schedule report
reportSchema.methods.scheduleReport = function(scheduleConfig, scheduledBy) {
  this.schedule = { ...this.schedule.toObject(), ...scheduleConfig, isScheduled: true };
  this.calculateNextRunDate();
  
  this.changeHistory.push({
    version: this.version,
    changedBy: scheduledBy,
    changeType: 'SCHEDULED',
    description: `Report scheduled to run ${scheduleConfig.frequency}`
  });
  
  return this.save();
};

// Method to calculate next run date
reportSchema.methods.calculateNextRunDate = function() {
  if (!this.schedule.isScheduled || !this.schedule.isActive) {
    this.schedule.nextRunDate = null;
    return;
  }
  
  const now = new Date();
  let nextRun = new Date(now);
  
  switch (this.schedule.frequency) {
    case 'DAILY':
      nextRun.setDate(nextRun.getDate() + 1);
      break;
      
    case 'WEEKLY':
      nextRun.setDate(nextRun.getDate() + 7);
      break;
      
    case 'MONTHLY':
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
      
    case 'QUARTERLY':
      nextRun.setMonth(nextRun.getMonth() + 3);
      break;
      
    case 'ANNUALLY':
      nextRun.setFullYear(nextRun.getFullYear() + 1);
      break;
      
    default:
      this.schedule.nextRunDate = null;
      return;
  }
  
  // Set specific time if provided
  if (this.schedule.scheduledTime) {
    const [hours, minutes] = this.schedule.scheduledTime.split(':');
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  this.schedule.nextRunDate = nextRun;
};

// Method to clone report
reportSchema.methods.cloneReport = function(newName, clonedBy) {
  const clonedReport = this.toObject();
  delete clonedReport._id;
  delete clonedReport.createdAt;
  delete clonedReport.updatedAt;
  delete clonedReport.executions;
  delete clonedReport.performance;
  delete clonedReport.usage;
  delete clonedReport.changeHistory;
  
  clonedReport.reportName = newName;
  clonedReport.access.createdBy = clonedBy;
  clonedReport.schedule.isScheduled = false;
  clonedReport.schedule.isActive = false;
  clonedReport.version = 1;
  
  return new this.constructor(clonedReport);
};

// Method to archive report
reportSchema.methods.archive = function(archivedBy) {
  this.isArchived = true;
  this.archivedDate = new Date();
  this.archivedBy = archivedBy;
  this.schedule.isActive = false;
  
  this.changeHistory.push({
    version: this.version,
    changedBy: archivedBy,
    changeType: 'ARCHIVED',
    description: 'Report archived'
  });
  
  return this.save();
};

// Static method to get scheduled reports due for execution
reportSchema.statics.getDueReports = function() {
  const now = new Date();
  return this.find({
    'schedule.isScheduled': true,
    'schedule.isActive': true,
    'schedule.nextRunDate': { $lte: now },
    isArchived: false
  });
};

// Static method to get report statistics
reportSchema.statics.getReportStatistics = async function(carrierId) {
  const pipeline = [
    {
      $match: {
        carrierId: mongoose.Types.ObjectId(carrierId),
        isArchived: false
      }
    },
    {
      $group: {
        _id: '$reportCategory',
        count: { $sum: 1 },
        scheduledCount: {
          $sum: { $cond: ['$schedule.isScheduled', 1, 0] }
        },
        avgExecutions: { $avg: '$performance.totalExecutions' },
        avgSuccessRate: { $avg: '$performance.successfulExecutions' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get popular reports
reportSchema.statics.getPopularReports = function(carrierId, limit = 10) {
  return this.find({
    carrierId: mongoose.Types.ObjectId(carrierId),
    isArchived: false
  })
  .sort({ 'usage.viewCount': -1, 'performance.totalExecutions': -1 })
  .limit(limit)
  .populate('access.createdBy', 'firstName lastName');
};

module.exports = mongoose.model('Report', reportSchema);
