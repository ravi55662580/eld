const mongoose = require('mongoose');

const complianceSchema = new mongoose.Schema({
  // Basic Information
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier',
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: false, // Some compliance items are carrier-wide
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: false, // Some compliance items are not vehicle-specific
    index: true
  },
  
  // Compliance Type and Category
  complianceType: {
    type: String,
    required: true,
    enum: [
      'HOURS_OF_SERVICE',
      'DRIVER_QUALIFICATION',
      'DRUG_ALCOHOL_TESTING',
      'VEHICLE_MAINTENANCE',
      'HAZMAT_COMPLIANCE',
      'IFTA_REPORTING',
      'IRP_REGISTRATION',
      'DOT_INSPECTION',
      'SAFETY_RATING',
      'ELD_MANDATE',
      'DRIVER_TRAINING',
      'RECORD_KEEPING',
      'COMMERCIAL_DRIVERS_LICENSE',
      'MEDICAL_CERTIFICATION',
      'INSURANCE_REQUIREMENTS',
      'PERMITS_LICENSING',
      'ENVIRONMENTAL_COMPLIANCE',
      'WEIGHT_SIZE_LIMITS',
      'CARGO_SECUREMENT',
      'ROADSIDE_INSPECTION',
      'AUDIT_COMPLIANCE',
      'OTHER'
    ],
    index: true
  },
  
  // Specific Regulation Reference
  regulation: {
    part: String, // e.g., "395", "390", "391"
    section: String, // e.g., "8", "15", "41"
    description: String,
    fullReference: String // e.g., "49 CFR 395.8"
  },
  
  // Compliance Status
  status: {
    type: String,
    required: true,
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'PENDING_REVIEW', 'CONDITIONAL', 'EXEMPT', 'UNKNOWN'],
    default: 'PENDING_REVIEW',
    index: true
  },
  
  // Assessment Details
  assessment: {
    assessmentDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assessmentMethod: {
      type: String,
      enum: ['AUTOMATED', 'MANUAL_REVIEW', 'INSPECTION', 'AUDIT', 'SELF_ASSESSMENT'],
      default: 'AUTOMATED'
    },
    nextReviewDate: {
      type: Date,
      index: true
    }
  },
  
  // Compliance Period
  compliancePeriod: {
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrencePattern: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']
    }
  },
  
  // Violation Details (if non-compliant)
  violations: [{
    violationType: {
      type: String,
      enum: [
        'HOURS_EXCEEDED',
        'LOG_MISSING',
        'LOG_FALSIFIED',
        'DRIVER_UNQUALIFIED',
        'VEHICLE_OUT_OF_SERVICE',
        'MAINTENANCE_OVERDUE',
        'INSPECTION_FAILED',
        'DRUG_TEST_FAILED',
        'LICENSE_EXPIRED',
        'MEDICAL_EXPIRED',
        'INSURANCE_LAPSED',
        'PERMIT_EXPIRED',
        'WEIGHT_EXCEEDED',
        'CARGO_UNSECURED',
        'ELD_MALFUNCTION',
        'RECORD_INCOMPLETE',
        'OTHER'
      ]
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    description: String,
    detectedDate: {
      type: Date,
      default: Date.now
    },
    basicaScore: Number, // BASIC (Behavior Analysis and Safety Improvement Categories) score impact
    fineAmount: Number,
    isOutOfService: {
      type: Boolean,
      default: false
    }
  }],
  
  // Corrective Actions
  correctiveActions: [{
    actionType: {
      type: String,
      enum: [
        'DRIVER_TRAINING',
        'POLICY_UPDATE',
        'SYSTEM_UPGRADE',
        'MAINTENANCE_PERFORMED',
        'DOCUMENTATION_UPDATED',
        'PROCESS_IMPROVED',
        'FINE_PAID',
        'LICENSE_RENEWED',
        'INSPECTION_SCHEDULED',
        'OTHER'
      ]
    },
    description: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED'],
      default: 'PENDING'
    },
    cost: Number,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    effectiveness: {
      type: String,
      enum: ['EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE', 'PENDING_EVALUATION']
    }
  }],
  
  // Risk Assessment
  riskAssessment: {
    riskLevel: {
      type: String,
      enum: ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
      default: 'MEDIUM'
    },
    riskFactors: [String],
    potentialImpact: {
      type: String,
      enum: ['MINIMAL', 'MINOR', 'MODERATE', 'MAJOR', 'SEVERE']
    },
    likelihood: {
      type: String,
      enum: ['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'ALMOST_CERTAIN']
    },
    mitigationStrategy: String,
    lastRiskReview: Date,
    nextRiskReview: Date
  },
  
  // Documentation
  supportingDocuments: [{
    documentType: {
      type: String,
      enum: [
        'LOG_RECORDS',
        'INSPECTION_REPORT',
        'MAINTENANCE_RECORD',
        'TRAINING_CERTIFICATE',
        'LICENSE_COPY',
        'MEDICAL_CERTIFICATE',
        'INSURANCE_POLICY',
        'PERMIT_COPY',
        'VIOLATION_NOTICE',
        'CORRECTIVE_ACTION_PROOF',
        'OTHER'
      ]
    },
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    expirationDate: Date
  }],
  
  // Inspection History
  inspectionHistory: [{
    inspectionDate: Date,
    inspectionType: {
      type: String,
      enum: ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6']
    },
    inspector: String,
    location: {
      state: String,
      city: String,
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    result: {
      type: String,
      enum: ['SATISFACTORY', 'CONDITIONAL', 'UNSATISFACTORY', 'OUT_OF_SERVICE']
    },
    violationsFound: Number,
    basicCategories: [{
      category: {
        type: String,
        enum: [
          'UNSAFE_DRIVING',
          'HOS_COMPLIANCE',
          'DRIVER_FITNESS',
          'CONTROLLED_SUBSTANCES',
          'VEHICLE_MAINTENANCE',
          'HAZMAT_COMPLIANCE',
          'CRASH_INDICATOR'
        ]
      },
      severity: Number,
      weight: Number
    }],
    reportNumber: String
  }],
  
  // Performance Metrics
  metrics: {
    complianceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    trendDirection: {
      type: String,
      enum: ['IMPROVING', 'STABLE', 'DECLINING']
    },
    benchmarkComparison: {
      industryAverage: Number,
      fleetRanking: Number,
      stateRanking: Number
    },
    kpis: [{
      metric: String,
      value: Number,
      target: Number,
      period: String
    }]
  },
  
  // Automated Monitoring
  monitoring: {
    isMonitored: {
      type: Boolean,
      default: true
    },
    monitoringFrequency: {
      type: String,
      enum: ['REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']
    },
    alertThresholds: [{
      parameter: String,
      threshold: Number,
      operator: {
        type: String,
        enum: ['GREATER_THAN', 'LESS_THAN', 'EQUALS', 'NOT_EQUALS']
      }
    }],
    lastMonitored: Date,
    nextMonitoringDue: Date
  },
  
  // Compliance Training
  trainingRequirements: [{
    trainingType: String,
    required: {
      type: Boolean,
      default: false
    },
    completedDate: Date,
    expirationDate: Date,
    certificateNumber: String,
    trainer: String,
    trainingProvider: String,
    hoursCompleted: Number,
    passingScore: Number,
    actualScore: Number
  }],
  
  // Financial Impact
  financialImpact: {
    finesTotal: {
      type: Number,
      default: 0
    },
    correctionCosts: {
      type: Number,
      default: 0
    },
    lostRevenue: {
      type: Number,
      default: 0
    },
    insurancePremiumImpact: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    }
  },
  
  // Notes and Comments
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['GENERAL', 'VIOLATION', 'CORRECTIVE_ACTION', 'TRAINING', 'INSPECTION']
    }
  }],
  
  // External System References
  externalReferences: [{
    systemName: String,
    referenceId: String,
    referenceType: String,
    url: String
  }],
  
  // Audit Trail
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    details: String,
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    ipAddress: String
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
complianceSchema.index({ carrierId: 1, complianceType: 1, status: 1 });
complianceSchema.index({ driverId: 1, complianceType: 1, 'compliancePeriod.endDate': -1 });
complianceSchema.index({ vehicleId: 1, complianceType: 1, status: 1 });
complianceSchema.index({ status: 1, 'assessment.nextReviewDate': 1 });
complianceSchema.index({ 'compliancePeriod.startDate': 1, 'compliancePeriod.endDate': 1 });
complianceSchema.index({ complianceType: 1, 'assessment.assessmentDate': -1 });
complianceSchema.index({ 'riskAssessment.riskLevel': 1, status: 1 });

// Virtual for days until next review
complianceSchema.virtual('daysUntilReview').get(function() {
  if (!this.assessment.nextReviewDate) return null;
  const today = new Date();
  const diffTime = this.assessment.nextReviewDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for compliance age in days
complianceSchema.virtual('complianceAge').get(function() {
  const today = new Date();
  const diffTime = today - this.assessment.assessmentDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for active violations count
complianceSchema.virtual('activeViolationsCount').get(function() {
  return this.violations.filter(v => !v.resolvedDate).length;
});

// Virtual for pending corrective actions count
complianceSchema.virtual('pendingActionsCount').get(function() {
  return this.correctiveActions.filter(a => 
    a.status === 'PENDING' || a.status === 'IN_PROGRESS'
  ).length;
});

// Pre-save middleware to calculate derived fields
complianceSchema.pre('save', function(next) {
  // Calculate total financial impact
  this.financialImpact.totalCost = 
    (this.financialImpact.finesTotal || 0) +
    (this.financialImpact.correctionCosts || 0) +
    (this.financialImpact.lostRevenue || 0) +
    (this.financialImpact.insurancePremiumImpact || 0);
  
  // Update compliance score based on violations and status
  this.calculateComplianceScore();
  
  // Set next review date if not provided
  if (!this.assessment.nextReviewDate) {
    this.setNextReviewDate();
  }
  
  next();
});

// Method to calculate compliance score
complianceSchema.methods.calculateComplianceScore = function() {
  let score = 100;
  
  // Deduct points for violations
  this.violations.forEach(violation => {
    switch (violation.severity) {
      case 'CRITICAL':
        score -= 25;
        break;
      case 'HIGH':
        score -= 15;
        break;
      case 'MEDIUM':
        score -= 10;
        break;
      case 'LOW':
        score -= 5;
        break;
    }
  });
  
  // Deduct points for overdue corrective actions
  const overdueActions = this.correctiveActions.filter(action => 
    action.status === 'OVERDUE'
  );
  score -= overdueActions.length * 5;
  
  // Adjust based on compliance status
  if (this.status === 'NON_COMPLIANT') {
    score -= 20;
  } else if (this.status === 'CONDITIONAL') {
    score -= 10;
  }
  
  this.metrics.complianceScore = Math.max(0, score);
};

// Method to set next review date
complianceSchema.methods.setNextReviewDate = function() {
  const today = new Date();
  let nextReview = new Date(today);
  
  // Set review frequency based on compliance type and risk level
  const riskLevel = this.riskAssessment.riskLevel;
  const complianceType = this.complianceType;
  
  let daysToAdd = 30; // Default monthly review
  
  if (riskLevel === 'VERY_HIGH' || riskLevel === 'HIGH') {
    daysToAdd = 7; // Weekly review for high risk
  } else if (riskLevel === 'MEDIUM') {
    daysToAdd = 14; // Bi-weekly review
  } else if (riskLevel === 'LOW' || riskLevel === 'VERY_LOW') {
    daysToAdd = 90; // Quarterly review for low risk
  }
  
  // Adjust based on compliance type
  if (complianceType === 'HOURS_OF_SERVICE') {
    daysToAdd = 7; // Weekly HOS reviews
  } else if (complianceType === 'DRUG_ALCOHOL_TESTING') {
    daysToAdd = 30; // Monthly drug/alcohol reviews
  }
  
  nextReview.setDate(nextReview.getDate() + daysToAdd);
  this.assessment.nextReviewDate = nextReview;
};

// Method to add violation
complianceSchema.methods.addViolation = function(violationData) {
  this.violations.push(violationData);
  this.status = 'NON_COMPLIANT';
  
  // Increase risk level if multiple violations
  if (this.violations.length > 3 && this.riskAssessment.riskLevel !== 'VERY_HIGH') {
    this.riskAssessment.riskLevel = 'HIGH';
  }
  
  this.auditLog.push({
    action: 'VIOLATION_ADDED',
    performedBy: violationData.detectedBy,
    details: `Violation added: ${violationData.violationType}`
  });
  
  return this.save();
};

// Method to add corrective action
complianceSchema.methods.addCorrectiveAction = function(actionData) {
  this.correctiveActions.push(actionData);
  
  this.auditLog.push({
    action: 'CORRECTIVE_ACTION_ADDED',
    performedBy: actionData.assignedTo,
    details: `Corrective action added: ${actionData.actionType}`
  });
  
  return this.save();
};

// Method to complete corrective action
complianceSchema.methods.completeCorrectiveAction = function(actionId, completedBy) {
  const action = this.correctiveActions.id(actionId);
  if (action) {
    action.status = 'COMPLETED';
    action.completedDate = new Date();
    action.verifiedBy = completedBy;
    action.verificationDate = new Date();
    
    this.auditLog.push({
      action: 'CORRECTIVE_ACTION_COMPLETED',
      performedBy: completedBy,
      details: `Corrective action completed: ${action.actionType}`
    });
    
    // Check if all corrective actions are completed
    const pendingActions = this.correctiveActions.filter(a => 
      a.status === 'PENDING' || a.status === 'IN_PROGRESS'
    );
    
    if (pendingActions.length === 0 && this.status === 'NON_COMPLIANT') {
      this.status = 'PENDING_REVIEW';
    }
  }
  
  return this.save();
};

// Method to update compliance status
complianceSchema.methods.updateStatus = function(newStatus, updatedBy, reason) {
  const oldStatus = this.status;
  this.status = newStatus;
  this.assessment.assessmentDate = new Date();
  this.assessment.assessedBy = updatedBy;
  
  this.auditLog.push({
    action: 'STATUS_UPDATED',
    performedBy: updatedBy,
    details: `Status changed from ${oldStatus} to ${newStatus}: ${reason}`,
    previousValue: oldStatus,
    newValue: newStatus
  });
  
  return this.save();
};

// Static method to get compliance summary
complianceSchema.statics.getComplianceSummary = async function(carrierId, filters = {}) {
  const matchStage = { carrierId: mongoose.Types.ObjectId(carrierId) };
  
  if (filters.complianceType) {
    matchStage.complianceType = filters.complianceType;
  }
  
  if (filters.startDate && filters.endDate) {
    matchStage['assessment.assessmentDate'] = {
      $gte: filters.startDate,
      $lte: filters.endDate
    };
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$metrics.complianceScore' },
        totalFines: { $sum: '$financialImpact.finesTotal' },
        totalViolations: { $sum: { $size: '$violations' } }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get upcoming reviews
complianceSchema.statics.getUpcomingReviews = async function(carrierId, days = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return this.find({
    carrierId: mongoose.Types.ObjectId(carrierId),
    'assessment.nextReviewDate': {
      $gte: today,
      $lte: futureDate
    }
  })
  .populate('driverId', 'firstName lastName')
  .populate('vehicleId', 'vehicleNumber')
  .sort({ 'assessment.nextReviewDate': 1 });
};

// Static method to get compliance trends
complianceSchema.statics.getComplianceTrends = async function(carrierId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const pipeline = [
    {
      $match: {
        carrierId: mongoose.Types.ObjectId(carrierId),
        'assessment.assessmentDate': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$assessment.assessmentDate' },
          month: { $month: '$assessment.assessmentDate' },
          type: '$complianceType'
        },
        compliantCount: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLIANT'] }, 1, 0] }
        },
        nonCompliantCount: {
          $sum: { $cond: [{ $eq: ['$status', 'NON_COMPLIANT'] }, 1, 0] }
        },
        avgScore: { $avg: '$metrics.complianceScore' },
        totalRecords: { $sum: 1 }
      }
    },
    {
      $addFields: {
        complianceRate: {
          $multiply: [
            { $divide: ['$compliantCount', '$totalRecords'] },
            100
          ]
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.type': 1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Compliance', complianceSchema);
