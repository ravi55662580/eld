const mongoose = require('mongoose');

const stateMileageSchema = new mongoose.Schema({
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
  
  // Reporting Period
  reportingPeriod: {
    quarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Q4'],
      required: true
    },
    year: {
      type: Number,
      required: true,
      min: 2020,
      max: 2050
    }
  },
  
  // Date Range
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
  
  // State Information
  state: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        const validStates = [
          'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
          'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
          'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
          'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
          'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
          'ON', 'QC', 'NS', 'NB', 'MB', 'BC', 'PE', 'SK', 'AB', 'NL' // Canadian provinces
        ];
        return validStates.includes(v);
      },
      message: 'Invalid state/province code'
    }
  },
  stateFullName: String,
  
  // Mileage Data
  totalMiles: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalKilometers: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // IFTA vs Non-IFTA Miles
  iftaMiles: {
    type: Number,
    default: 0,
    min: 0
  },
  nonIftaMiles: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Fuel Information
  totalGallonsPurchased: {
    type: Number,
    default: 0,
    min: 0
  },
  totalLitersPurchased: {
    type: Number,
    default: 0,
    min: 0
  },
  totalFuelCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Tax Information
  stateFuelTaxRate: {
    type: Number,
    default: 0,
    min: 0
  },
  fuelTaxPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  fuelTaxOwed: {
    type: Number,
    default: 0
  },
  netTaxDue: {
    type: Number,
    default: 0
  },
  
  // Trip Segments in this state
  tripSegments: [{
    startLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      city: String
    },
    endLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      city: String
    },
    startTime: Date,
    endTime: Date,
    miles: {
      type: Number,
      min: 0
    },
    kilometers: {
      type: Number,
      min: 0
    },
    startOdometer: Number,
    endOdometer: Number,
    routeId: String,
    isIFTA: {
      type: Boolean,
      default: true
    }
  }],
  
  // Fuel Purchases in this state
  fuelPurchases: [{
    fuelReceiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FuelReceipt'
    },
    purchaseDate: Date,
    gallons: Number,
    cost: Number,
    taxPaid: Number,
    location: {
      city: String,
      address: String,
      latitude: Number,
      longitude: Number
    }
  }],
  
  // Calculations and Metrics
  averageMPG: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Compliance Status
  isCompleted: {
    type: Boolean,
    default: false
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  submittedDate: Date,
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Validation and Quality Check
  dataQuality: {
    hasGaps: {
      type: Boolean,
      default: false
    },
    gapDetails: [String],
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    lastValidated: Date,
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Adjustments
  adjustments: [{
    adjustmentType: {
      type: String,
      enum: ['MILEAGE_CORRECTION', 'FUEL_CORRECTION', 'TAX_ADJUSTMENT', 'OTHER']
    },
    originalValue: Number,
    adjustedValue: Number,
    reason: String,
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adjustedAt: {
      type: Date,
      default: Date.now
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  }],
  
  // Distance Calculation Method
  calculationMethod: {
    type: String,
    enum: ['GPS', 'HUBOMETER', 'MANUAL', 'ESTIMATED'],
    default: 'GPS'
  },
  
  // Border Crossings (for international operations)
  borderCrossings: [{
    crossingTime: Date,
    fromState: String,
    toState: String,
    port: String,
    direction: {
      type: String,
      enum: ['ENTERING', 'EXITING']
    },
    odometer: Number
  }],
  
  // Supporting Documentation
  supportingDocuments: [{
    documentType: {
      type: String,
      enum: ['FUEL_RECEIPT', 'TRIP_RECORD', 'BORDER_CROSSING', 'OTHER']
    },
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
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
    newValue: mongoose.Schema.Types.Mixed
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
stateMileageSchema.index({ carrierId: 1, 'reportingPeriod.year': 1, 'reportingPeriod.quarter': 1 });
stateMileageSchema.index({ driverId: 1, state: 1, startDate: -1 });
stateMileageSchema.index({ vehicleId: 1, state: 1, startDate: -1 });
stateMileageSchema.index({ state: 1, startDate: -1, endDate: -1 });
stateMileageSchema.index({ 'reportingPeriod.year': 1, 'reportingPeriod.quarter': 1, state: 1 });
stateMileageSchema.index({ isSubmitted: 1, submittedDate: -1 });

// Virtual for reporting period string
stateMileageSchema.virtual('reportingPeriodString').get(function() {
  return `${this.reportingPeriod.year}-${this.reportingPeriod.quarter}`;
});

// Virtual for fuel efficiency
stateMileageSchema.virtual('fuelEfficiency').get(function() {
  if (this.totalGallonsPurchased > 0) {
    return (this.totalMiles / this.totalGallonsPurchased).toFixed(2);
  }
  return 0;
});

// Virtual for tax rate per gallon
stateMileageSchema.virtual('effectiveTaxRate').get(function() {
  if (this.totalGallonsPurchased > 0) {
    return (this.fuelTaxPaid / this.totalGallonsPurchased).toFixed(4);
  }
  return 0;
});

// Pre-save middleware to calculate derived fields
stateMileageSchema.pre('save', function(next) {
  // Convert miles to kilometers if not provided
  if (this.totalMiles && !this.totalKilometers) {
    this.totalKilometers = this.totalMiles * 1.60934;
  }
  
  // Convert gallons to liters if not provided
  if (this.totalGallonsPurchased && !this.totalLitersPurchased) {
    this.totalLitersPurchased = this.totalGallonsPurchased * 3.78541;
  }
  
  // Calculate average MPG
  if (this.totalMiles > 0 && this.totalGallonsPurchased > 0) {
    this.averageMPG = this.totalMiles / this.totalGallonsPurchased;
  }
  
  // Calculate total miles from IFTA and non-IFTA
  if (this.iftaMiles >= 0 && this.nonIftaMiles >= 0) {
    this.totalMiles = this.iftaMiles + this.nonIftaMiles;
  }
  
  // Calculate net tax due
  this.netTaxDue = this.fuelTaxOwed - this.fuelTaxPaid;
  
  next();
});

// Method to add trip segment
stateMileageSchema.methods.addTripSegment = function(segmentData) {
  this.tripSegments.push(segmentData);
  
  // Recalculate totals
  this.recalculateTotals();
  
  return this.save();
};

// Method to add fuel purchase
stateMileageSchema.methods.addFuelPurchase = function(purchaseData) {
  this.fuelPurchases.push(purchaseData);
  
  // Update fuel totals
  this.totalGallonsPurchased = this.fuelPurchases.reduce((sum, purchase) => sum + (purchase.gallons || 0), 0);
  this.totalFuelCost = this.fuelPurchases.reduce((sum, purchase) => sum + (purchase.cost || 0), 0);
  this.fuelTaxPaid = this.fuelPurchases.reduce((sum, purchase) => sum + (purchase.taxPaid || 0), 0);
  
  return this.save();
};

// Method to recalculate totals
stateMileageSchema.methods.recalculateTotals = function() {
  // Calculate total miles from trip segments
  const totalSegmentMiles = this.tripSegments.reduce((sum, segment) => sum + (segment.miles || 0), 0);
  
  if (totalSegmentMiles > 0) {
    this.totalMiles = totalSegmentMiles;
  }
  
  // Calculate IFTA vs Non-IFTA miles
  this.iftaMiles = this.tripSegments
    .filter(segment => segment.isIFTA)
    .reduce((sum, segment) => sum + (segment.miles || 0), 0);
  
  this.nonIftaMiles = this.tripSegments
    .filter(segment => !segment.isIFTA)
    .reduce((sum, segment) => sum + (segment.miles || 0), 0);
};

// Method to submit for reporting
stateMileageSchema.methods.submit = function(submittedBy) {
  this.isSubmitted = true;
  this.submittedDate = new Date();
  this.submittedBy = submittedBy;
  this.isCompleted = true;
  
  this.auditLog.push({
    action: 'SUBMITTED',
    performedBy: submittedBy,
    details: `State mileage report submitted for ${this.state} ${this.reportingPeriodString}`
  });
  
  return this.save();
};

// Method to validate data quality
stateMileageSchema.methods.validateDataQuality = function() {
  const gaps = [];
  let accuracy = 100;
  
  // Check for missing data
  if (this.totalMiles === 0) {
    gaps.push('No mileage data recorded');
    accuracy -= 20;
  }
  
  if (this.totalGallonsPurchased === 0 && this.totalMiles > 0) {
    gaps.push('No fuel purchase data for recorded mileage');
    accuracy -= 15;
  }
  
  // Check for unrealistic fuel efficiency
  if (this.averageMPG > 15 || this.averageMPG < 3) {
    gaps.push('Unrealistic fuel efficiency detected');
    accuracy -= 10;
  }
  
  // Check for date range issues
  if (this.tripSegments.length > 0) {
    const segmentsOutsideRange = this.tripSegments.filter(segment => 
      segment.startTime < this.startDate || segment.endTime > this.endDate
    );
    if (segmentsOutsideRange.length > 0) {
      gaps.push('Trip segments found outside reporting period');
      accuracy -= 5;
    }
  }
  
  this.dataQuality = {
    hasGaps: gaps.length > 0,
    gapDetails: gaps,
    accuracy: Math.max(0, accuracy),
    lastValidated: new Date()
  };
  
  return this.save();
};

// Static method to get IFTA summary by quarter
stateMileageSchema.statics.getIFTASummary = async function(carrierId, year, quarter) {
  const pipeline = [
    {
      $match: {
        carrierId: mongoose.Types.ObjectId(carrierId),
        'reportingPeriod.year': year,
        'reportingPeriod.quarter': quarter
      }
    },
    {
      $group: {
        _id: '$state',
        totalMiles: { $sum: '$totalMiles' },
        iftaMiles: { $sum: '$iftaMiles' },
        nonIftaMiles: { $sum: '$nonIftaMiles' },
        totalGallons: { $sum: '$totalGallonsPurchased' },
        totalFuelCost: { $sum: '$totalFuelCost' },
        fuelTaxPaid: { $sum: '$fuelTaxPaid' },
        fuelTaxOwed: { $sum: '$fuelTaxOwed' },
        netTaxDue: { $sum: '$netTaxDue' }
      }
    },
    {
      $addFields: {
        averageMPG: {
          $cond: [
            { $gt: ['$totalGallons', 0] },
            { $divide: ['$totalMiles', '$totalGallons'] },
            0
          ]
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get mileage statistics
stateMileageSchema.statics.getMileageStatistics = async function(carrierId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        carrierId: mongoose.Types.ObjectId(carrierId),
        startDate: { $gte: startDate },
        endDate: { $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalMiles: { $sum: '$totalMiles' },
        totalIftaMiles: { $sum: '$iftaMiles' },
        totalNonIftaMiles: { $sum: '$nonIftaMiles' },
        totalGallons: { $sum: '$totalGallonsPurchased' },
        totalTaxDue: { $sum: '$netTaxDue' },
        stateCount: { $sum: 1 }
      }
    },
    {
      $addFields: {
        overallMPG: {
          $cond: [
            { $gt: ['$totalGallons', 0] },
            { $divide: ['$totalMiles', '$totalGallons'] },
            0
          ]
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalMiles: 0,
    totalIftaMiles: 0,
    totalNonIftaMiles: 0,
    totalGallons: 0,
    totalTaxDue: 0,
    stateCount: 0,
    overallMPG: 0
  };
};

module.exports = mongoose.model('StateMileage', stateMileageSchema);
