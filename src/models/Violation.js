const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
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
    required: true,
    index: true
  },
  logBookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LogBook'
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  
  // Violation Details
  violationType: {
    type: String,
    required: true,
    enum: [
      // Hours of Service Violations
      '11_HOUR_DRIVING',
      '14_HOUR_DUTY',
      '10_HOUR_OFF_DUTY',
      '34_HOUR_RESTART',
      '70_HOUR_8_DAY',
      '60_HOUR_7_DAY',
      
      // Form & Manner Violations
      'MISSING_LOG',
      'INCOMPLETE_LOG',
      'FALSIFIED_LOG',
      'LATE_LOG_CERTIFICATION',
      'MISSING_SUPPORTING_DOCUMENTS',
      
      // ELD Technical Violations
      'ELD_MALFUNCTION',
      'ELD_DATA_TRANSFER_FAILURE',
      'ELD_AUTHENTICATION_FAILURE',
      'MISSING_ELD_RECORD',
      
      // DVIR Violations
      'MISSING_DVIR',
      'INCOMPLETE_DVIR',
      'UNSAFE_VEHICLE_OPERATION',
      
      // Drug & Alcohol Violations
      'FAILED_DRUG_TEST',
      'FAILED_ALCOHOL_TEST',
      'REFUSED_TESTING',
      
      // Other DOT Violations
      'OVERWEIGHT_VIOLATION',
      'SPEEDING_VIOLATION',
      'IMPROPER_HAZMAT_HANDLING',
      'MISSING_PERMIT',
      'DRIVER_QUALIFICATION_VIOLATION'
    ],
    index: true
  },
  
  // Violation Classification
  violationCategory: {
    type: String,
    enum: ['HOS', 'FORM_MANNER', 'VEHICLE', 'DRIVER_QUALIFICATION', 'DRUG_ALCOHOL', 'OTHER'],
    required: true,
    index: true
  },
  
  severity: {
    type: String,
    enum: ['WARNING', 'MINOR', 'MAJOR', 'CRITICAL', 'OUT_OF_SERVICE'],
    default: 'WARNING',
    index: true
  },
  
  // Timing Information
  violationDate: {
    type: Date,
    required: true,
    index: true
  },
  violationTime: String,
  detectedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Violation Details
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  ruleReference: {
    section: String,  // e.g., "395.8"
    description: String,
    url: String
  },
  
  // Quantitative Data
  actualValue: Number,  // e.g., 12.5 hours driven
  allowedValue: Number, // e.g., 11 hours maximum
  excessAmount: Number, // e.g., 1.5 hours over
  units: String,        // e.g., "hours", "miles"
  
  // Location Information
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  
  // Resolution and Status
  status: {
    type: String,
    enum: ['OPEN', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'RESOLVED', 'DISPUTED', 'CLOSED'],
    default: 'OPEN',
    index: true
  },
  
  // Resolution Details
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolutionType: {
      type: String,
      enum: ['CORRECTED', 'WAIVED', 'PENALTY_ASSESSED', 'TRAINING_COMPLETED', 'FALSE_POSITIVE']
    },
    resolutionNotes: String,
    correctionDeadline: Date,
    penaltyAmount: Number
  },
  
  // Driver Response
  driverResponse: {
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: Date,
    driverComments: String,
    driverSignature: String,
    disputed: {
      type: Boolean,
      default: false
    },
    disputeReason: String,
    disputeNotes: String
  },
  
  // Enforcement Information
  enforcement: {
    isEnforceable: {
      type: Boolean,
      default: false
    },
    inspectionId: String,
    officerName: String,
    officerBadge: String,
    agency: String,
    citationNumber: String,
    courtDate: Date,
    fineAmount: Number,
    csaPoints: Number
  },
  
  // Prevention and Training
  preventionMeasures: [{
    measure: String,
    implementedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    implementedAt: Date,
    effectivenessRating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  
  trainingRequired: {
    type: Boolean,
    default: false
  },
  trainingCompleted: {
    type: Boolean,
    default: false
  },
  trainingCompletedAt: Date,
  trainingType: String,
  
  // Impact Assessment
  impact: {
    safetyRisk: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    operationalImpact: String,
    customerImpact: String,
    financialImpact: Number
  },
  
  // Recurrence Tracking
  isRecurrence: {
    type: Boolean,
    default: false
  },
  previousViolations: [{
    violationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Violation'
    },
    date: Date,
    daysBetween: Number
  }],
  
  // Automatic Detection
  detectionMethod: {
    type: String,
    enum: ['AUTOMATIC', 'MANUAL_AUDIT', 'DRIVER_REPORTED', 'INSPECTION', 'THIRD_PARTY'],
    default: 'AUTOMATIC'
  },
  
  // Suppression (for system-generated violations that may not be actual violations)
  suppressed: {
    type: Boolean,
    default: false
  },
  suppressionReason: String,
  suppressedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  suppressedAt: Date,
  
  // Notification and Communication
  notifications: [{
    type: {
      type: String,
      enum: ['EMAIL', 'SMS', 'IN_APP', 'PHONE_CALL']
    },
    recipient: String,
    sentAt: Date,
    acknowledged: Boolean,
    acknowledgedAt: Date
  }],
  
  // Audit Trail
  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    notes: String
  }],
  
  // Related Documents
  attachments: [{
    filename: String,
    originalName: String,
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Integration Data
  externalIds: {
    inspectionId: String,
    carrierSystemId: String,
    regulatoryId: String
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
violationSchema.index({ carrierId: 1, violationDate: -1 });
violationSchema.index({ driverId: 1, violationDate: -1 });
violationSchema.index({ violationType: 1, violationDate: -1 });
violationSchema.index({ severity: 1, status: 1 });
violationSchema.index({ status: 1, violationDate: -1 });
violationSchema.index({ detectedAt: -1 });
violationSchema.index({ 'resolution.resolvedAt': -1 });

// Virtual for days since violation
violationSchema.virtual('daysSinceViolation').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.violationDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
violationSchema.virtual('isOverdue').get(function() {
  if (this.resolution.correctionDeadline && this.status === 'OPEN') {
    return new Date() > this.resolution.correctionDeadline;
  }
  return false;
});

// Virtual for formatted date
violationSchema.virtual('formattedDate').get(function() {
  return this.violationDate.toISOString().split('T')[0];
});

// Method to acknowledge violation
violationSchema.methods.acknowledge = function(driverId, signature, comments) {
  this.driverResponse.acknowledged = true;
  this.driverResponse.acknowledgedAt = new Date();
  this.driverResponse.driverComments = comments;
  this.driverResponse.driverSignature = signature;
  
  if (this.status === 'OPEN') {
    this.status = 'ACKNOWLEDGED';
  }
  
  this.auditTrail.push({
    action: 'ACKNOWLEDGED',
    performedBy: driverId,
    notes: 'Violation acknowledged by driver'
  });
  
  return this.save();
};

// Method to dispute violation
violationSchema.methods.dispute = function(driverId, reason, notes) {
  this.driverResponse.disputed = true;
  this.driverResponse.disputeReason = reason;
  this.driverResponse.disputeNotes = notes;
  this.status = 'DISPUTED';
  
  this.auditTrail.push({
    action: 'DISPUTED',
    performedBy: driverId,
    notes: `Violation disputed: ${reason}`
  });
  
  return this.save();
};

// Method to resolve violation
violationSchema.methods.resolve = function(resolvedBy, resolutionType, notes, penaltyAmount) {
  this.resolution.resolvedBy = resolvedBy;
  this.resolution.resolvedAt = new Date();
  this.resolution.resolutionType = resolutionType;
  this.resolution.resolutionNotes = notes;
  this.resolution.penaltyAmount = penaltyAmount;
  this.status = 'RESOLVED';
  
  this.auditTrail.push({
    action: 'RESOLVED',
    performedBy: resolvedBy,
    notes: `Violation resolved: ${resolutionType}`
  });
  
  return this.save();
};

// Method to check for recurrence
violationSchema.methods.checkRecurrence = async function() {
  const similarViolations = await this.constructor.find({
    driverId: this.driverId,
    violationType: this.violationType,
    violationDate: {
      $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
    },
    _id: { $ne: this._id }
  }).sort({ violationDate: -1 });
  
  if (similarViolations.length > 0) {
    this.isRecurrence = true;
    this.previousViolations = similarViolations.map(v => ({
      violationId: v._id,
      date: v.violationDate,
      daysBetween: Math.ceil((this.violationDate - v.violationDate) / (1000 * 60 * 60 * 24))
    }));
  }
  
  return this.save();
};

// Static method to get violation statistics
violationSchema.statics.getStatistics = async function(carrierId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        carrierId: mongoose.Types.ObjectId(carrierId),
        violationDate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalViolations: { $sum: 1 },
        openViolations: {
          $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] }
        },
        resolvedViolations: {
          $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
        },
        criticalViolations: {
          $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
        },
        hosViolations: {
          $sum: { $cond: [{ $eq: ['$violationCategory', 'HOS'] }, 1, 0] }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalViolations: 0,
    openViolations: 0,
    resolvedViolations: 0,
    criticalViolations: 0,
    hosViolations: 0
  };
};

// Static method to get violations by driver
violationSchema.statics.getViolationsByDriver = async function(carrierId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        carrierId: mongoose.Types.ObjectId(carrierId),
        violationDate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$driverId',
        totalViolations: { $sum: 1 },
        criticalViolations: {
          $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
        },
        openViolations: {
          $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'drivers',
        localField: '_id',
        foreignField: '_id',
        as: 'driver'
      }
    },
    {
      $unwind: '$driver'
    },
    {
      $sort: { totalViolations: -1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Violation', violationSchema);
