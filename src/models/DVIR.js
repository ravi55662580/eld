const mongoose = require('mongoose');

const defectSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'BRAKE_SYSTEM', 'COUPLING_DEVICE', 'EXHAUST_SYSTEM', 'FRAME', 
      'FUEL_SYSTEM', 'HORN', 'LIGHTS', 'MIRRORS', 'STEERING', 'SUSPENSION',
      'TIRES', 'WHEELS_RIMS', 'WINDSHIELD_WIPERS', 'EMERGENCY_EQUIPMENT',
      'OTHER'
    ]
  },
  component: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  severity: {
    type: String,
    enum: ['MINOR', 'MAJOR', 'CRITICAL'],
    default: 'MINOR'
  },
  location: {
    type: String,
    enum: ['FRONT', 'REAR', 'LEFT', 'RIGHT', 'CENTER', 'GENERAL']
  },
  isRepairRequired: {
    type: Boolean,
    default: false
  },
  repairStatus: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED'],
    default: 'PENDING'
  },
  repairedBy: String,
  repairedDate: Date,
  repairNotes: String,
  photos: [String], // Photo file paths
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const inspectionItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  item: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    enum: ['SATISFACTORY', 'NEEDS_ATTENTION', 'DEFECTIVE', 'NOT_APPLICABLE'],
    default: 'SATISFACTORY'
  },
  notes: String,
  photos: [String]
}, { _id: true });

const dvirSchema = new mongoose.Schema({
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
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
    index: true
  },
  
  // Inspection Details
  inspectionType: {
    type: String,
    enum: ['PRE_TRIP', 'POST_TRIP', 'EN_ROUTE'],
    default: 'PRE_TRIP'
  },
  inspectionDate: {
    type: Date,
    required: true,
    index: true
  },
  inspectionTime: {
    type: String,
    required: true
  },
  
  // Vehicle Information
  tractorNumber: String,
  trailerNumber: String,
  odometer: {
    type: Number,
    required: true,
    min: 0
  },
  engineHours: Number,
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    city: String,
    state: String
  },
  
  // Overall Vehicle Condition
  vehicleCondition: {
    type: String,
    enum: ['SATISFACTORY', 'DEFECTS_FOUND', 'NOT_INSPECTED'],
    default: 'NOT_INSPECTED'
  },
  
  // Inspection Items (Checklist)
  inspectionItems: [inspectionItemSchema],
  
  // Defects Found
  defects: [defectSchema],
  defectCount: {
    type: Number,
    default: 0
  },
  
  // Driver Certification
  driverRemarks: {
    type: String,
    maxlength: 1000
  },
  driverSignature: String, // Base64 encoded signature
  driverName: String,
  driverLicense: String,
  certifiedAt: Date,
  
  // Mechanic/Maintenance Review
  mechanicReview: {
    reviewed: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    mechanicNotes: String,
    mechanicSignature: String,
    actionTaken: {
      type: String,
      enum: ['NO_ACTION_REQUIRED', 'REPAIRS_COMPLETED', 'REPAIRS_SCHEDULED', 'VEHICLE_OUT_OF_SERVICE'],
      default: 'NO_ACTION_REQUIRED'
    }
  },
  
  // Compliance and Status
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'REVIEWED', 'COMPLETED'],
    default: 'DRAFT'
  },
  isCompliant: {
    type: Boolean,
    default: true
  },
  requiresFollowUp: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  
  // Template Information
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DVIRTemplate'
  },
  templateName: String,
  
  // File Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Workflow tracking
  workflowStatus: {
    type: String,
    enum: ['PENDING_DRIVER', 'PENDING_MAINTENANCE', 'PENDING_APPROVAL', 'COMPLETED'],
    default: 'PENDING_DRIVER'
  },
  
  // Co-driver information
  coDriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  coDriverSignature: String,
  coDriverCertifiedAt: Date
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
dvirSchema.index({ carrierId: 1, inspectionDate: -1 });
dvirSchema.index({ driverId: 1, inspectionDate: -1 });
dvirSchema.index({ vehicleId: 1, inspectionDate: -1 });
dvirSchema.index({ status: 1, inspectionDate: -1 });
dvirSchema.index({ vehicleCondition: 1 });
dvirSchema.index({ workflowStatus: 1 });

// Virtual for formatted inspection date
dvirSchema.virtual('formattedDate').get(function() {
  return this.inspectionDate.toISOString().split('T')[0];
});

// Virtual for critical defects count
dvirSchema.virtual('criticalDefectsCount').get(function() {
  return this.defects.filter(defect => defect.severity === 'CRITICAL').length;
});

// Virtual for repair required count
dvirSchema.virtual('repairRequiredCount').get(function() {
  return this.defects.filter(defect => defect.isRepairRequired).length;
});

// Method to calculate overall vehicle condition
dvirSchema.methods.calculateVehicleCondition = function() {
  if (this.defects.length === 0) {
    this.vehicleCondition = 'SATISFACTORY';
  } else {
    const criticalDefects = this.defects.filter(d => d.severity === 'CRITICAL');
    if (criticalDefects.length > 0) {
      this.vehicleCondition = 'DEFECTS_FOUND';
      this.requiresFollowUp = true;
    } else {
      this.vehicleCondition = 'DEFECTS_FOUND';
    }
  }
  
  this.defectCount = this.defects.length;
  return this.vehicleCondition;
};

// Method to add defect
dvirSchema.methods.addDefect = function(defectData) {
  this.defects.push(defectData);
  this.calculateVehicleCondition();
  return this.save();
};

// Method to complete inspection
dvirSchema.methods.completeInspection = function(driverData) {
  this.driverName = driverData.name;
  this.driverLicense = driverData.license;
  this.driverSignature = driverData.signature;
  this.certifiedAt = new Date();
  this.status = 'SUBMITTED';
  
  if (this.defects.length > 0) {
    this.workflowStatus = 'PENDING_MAINTENANCE';
  } else {
    this.workflowStatus = 'COMPLETED';
    this.status = 'COMPLETED';
  }
  
  this.calculateVehicleCondition();
  return this.save();
};

// Method to review by mechanic
dvirSchema.methods.submitMechanicReview = function(reviewData) {
  this.mechanicReview = {
    reviewed: true,
    reviewedBy: reviewData.reviewedBy,
    reviewedAt: new Date(),
    mechanicNotes: reviewData.notes,
    mechanicSignature: reviewData.signature,
    actionTaken: reviewData.actionTaken
  };
  
  this.status = 'REVIEWED';
  if (reviewData.actionTaken === 'NO_ACTION_REQUIRED') {
    this.workflowStatus = 'COMPLETED';
    this.status = 'COMPLETED';
  }
  
  return this.save();
};

// Static method to get DVIR statistics
dvirSchema.statics.getStatistics = async function(carrierId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        carrierId: mongoose.Types.ObjectId(carrierId),
        inspectionDate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalInspections: { $sum: 1 },
        satisfactoryInspections: {
          $sum: { $cond: [{ $eq: ['$vehicleCondition', 'SATISFACTORY'] }, 1, 0] }
        },
        inspectionsWithDefects: {
          $sum: { $cond: [{ $eq: ['$vehicleCondition', 'DEFECTS_FOUND'] }, 1, 0] }
        },
        totalDefects: { $sum: '$defectCount' },
        pendingReviews: {
          $sum: { $cond: [{ $eq: ['$workflowStatus', 'PENDING_MAINTENANCE'] }, 1, 0] }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalInspections: 0,
    satisfactoryInspections: 0,
    inspectionsWithDefects: 0,
    totalDefects: 0,
    pendingReviews: 0
  };
};

module.exports = mongoose.model('DVIR', dvirSchema);
