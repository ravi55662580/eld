const mongoose = require('mongoose');

const fuelReceiptSchema = new mongoose.Schema({
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
    required: true
  },
  
  // Receipt Information
  referenceId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  
  // Purchase Details
  purchaseDate: {
    type: Date,
    required: true,
    index: true
  },
  purchaseTime: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  
  // Location Information
  location: {
    stationName: String,
    address: String,
    city: String,
    state: {
      type: String,
      required: true,
      index: true
    },
    zipCode: String,
    latitude: Number,
    longitude: Number
  },
  
  // Vehicle Information
  tractorNumber: {
    type: String,
    required: true
  },
  trailerNumber: String,
  odometer: {
    type: Number,
    required: true,
    min: 0
  },
  engineHours: Number,
  
  // Fuel Information
  fuelType: {
    type: String,
    required: true,
    enum: ['DIESEL', 'GASOLINE', 'DEF', 'BIODIESEL', 'CNG', 'LNG'],
    default: 'DIESEL'
  },
  fuelGrade: {
    type: String,
    enum: ['REGULAR', 'PREMIUM', 'ULTRA_LOW_SULFUR', 'OFF_ROAD']
  },
  
  // Quantity and Pricing
  gallonsPurchased: {
    type: Number,
    required: true,
    min: 0
  },
  litersPurchased: {
    type: Number,
    min: 0
  },
  pricePerGallon: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerLiter: Number,
  
  // Financial Information
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CREDIT_CARD', 'FUEL_CARD', 'COMPANY_ACCOUNT', 'CHECK'],
    default: 'FUEL_CARD'
  },
  cardNumber: String, // Last 4 digits only
  authorizationCode: String,
  
  // Trip Information
  tripNumber: String,
  billOfLading: String,
  
  // Compliance and Tracking
  iftaReportable: {
    type: Boolean,
    default: true
  },
  ifta: {
    reportingPeriod: String,
    fuelTaxPaid: Number,
    fuelTaxOwed: Number,
    netTaxDue: Number
  },
  
  // Additional Details
  driverNotes: {
    type: String,
    maxlength: 500
  },
  internalNotes: {
    type: String,
    maxlength: 500
  },
  
  // Receipt Images/Attachments
  receiptImages: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Verification and Approval
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING_REVIEW'],
    default: 'SUBMITTED'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,
  
  // Expense Categories
  expenseCategory: {
    type: String,
    enum: ['FUEL', 'MAINTENANCE', 'TOLLS', 'PARKING', 'OTHER'],
    default: 'FUEL'
  },
  expenseCode: String,
  
  // Mileage Calculations
  previousOdometer: Number,
  milesDriven: Number,
  fuelEfficiency: Number, // MPG
  
  // Environmental Data
  co2Emissions: Number, // kg of CO2
  
  // Vendor Information
  vendor: {
    name: String,
    vendorId: String,
    chain: String, // Shell, BP, Pilot, etc.
    stationId: String
  },
  
  // Reconciliation
  reconciled: {
    type: Boolean,
    default: false
  },
  reconciledDate: Date,
  reconciledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Import/Export tracking
  importSource: {
    type: String,
    enum: ['MANUAL', 'FUEL_CARD', 'API', 'CSV_UPLOAD', 'MOBILE_APP']
  },
  originalData: mongoose.Schema.Types.Mixed,
  
  // Duplicate detection
  duplicateChecksum: String,
  isDuplicate: {
    type: Boolean,
    default: false
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FuelReceipt'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance and duplicate detection
fuelReceiptSchema.index({ carrierId: 1, purchaseDate: -1 });
fuelReceiptSchema.index({ driverId: 1, purchaseDate: -1 });
fuelReceiptSchema.index({ vehicleId: 1, purchaseDate: -1 });
fuelReceiptSchema.index({ referenceId: 1, carrierId: 1 });
fuelReceiptSchema.index({ timestamp: -1 });
fuelReceiptSchema.index({ 'location.state': 1, purchaseDate: -1 });
fuelReceiptSchema.index({ fuelType: 1 });
fuelReceiptSchema.index({ status: 1 });
fuelReceiptSchema.index({ duplicateChecksum: 1 });

// Virtual for total fuel expenses
fuelReceiptSchema.virtual('netCost').get(function() {
  return this.totalCost - this.discountAmount + this.taxAmount;
});

// Virtual for fuel efficiency calculation
fuelReceiptSchema.virtual('calculatedMPG').get(function() {
  if (this.milesDriven && this.gallonsPurchased) {
    return (this.milesDriven / this.gallonsPurchased).toFixed(2);
  }
  return 0;
});

// Virtual for formatted purchase date
fuelReceiptSchema.virtual('formattedDate').get(function() {
  return this.purchaseDate.toISOString().split('T')[0];
});

// Pre-save middleware to calculate derived fields
fuelReceiptSchema.pre('save', function(next) {
  // Convert gallons to liters if needed
  if (this.gallonsPurchased && !this.litersPurchased) {
    this.litersPurchased = this.gallonsPurchased * 3.78541;
  }
  
  // Calculate price per liter if needed
  if (this.pricePerGallon && !this.pricePerLiter) {
    this.pricePerLiter = this.pricePerGallon / 3.78541;
  }
  
  // Generate duplicate detection checksum
  this.duplicateChecksum = this.generateChecksum();
  
  // Set timestamp if not provided
  if (!this.timestamp) {
    this.timestamp = this.purchaseDate;
  }
  
  next();
});

// Method to generate checksum for duplicate detection
fuelReceiptSchema.methods.generateChecksum = function() {
  const crypto = require('crypto');
  const data = `${this.referenceId}-${this.purchaseDate}-${this.gallonsPurchased}-${this.totalCost}-${this.tractorNumber}`;
  return crypto.createHash('md5').update(data).digest('hex');
};

// Method to calculate fuel efficiency
fuelReceiptSchema.methods.calculateEfficiency = function() {
  if (this.previousOdometer && this.odometer && this.gallonsPurchased) {
    this.milesDriven = this.odometer - this.previousOdometer;
    this.fuelEfficiency = this.milesDriven / this.gallonsPurchased;
    return this.fuelEfficiency;
  }
  return 0;
};

// Static method to get fuel statistics
fuelReceiptSchema.statics.getFuelStatistics = async function(carrierId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        carrierId: mongoose.Types.ObjectId(carrierId),
        purchaseDate: {
          $gte: startDate,
          $lte: endDate
        },
        status: { $ne: 'REJECTED' }
      }
    },
    {
      $group: {
        _id: null,
        totalReceipts: { $sum: 1 },
        totalGallons: { $sum: '$gallonsPurchased' },
        totalCost: { $sum: '$totalCost' },
        averagePricePerGallon: { $avg: '$pricePerGallon' },
        totalMiles: { $sum: '$milesDriven' },
        fuelTypes: { $addToSet: '$fuelType' }
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
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalReceipts: 0,
    totalGallons: 0,
    totalCost: 0,
    averagePricePerGallon: 0,
    totalMiles: 0,
    averageMPG: 0,
    fuelTypes: []
  };
};

// Static method to get fuel data by state (for IFTA)
fuelReceiptSchema.statics.getIFTAData = async function(carrierId, reportingPeriod) {
  const pipeline = [
    {
      $match: {
        carrierId: mongoose.Types.ObjectId(carrierId),
        iftaReportable: true,
        'ifta.reportingPeriod': reportingPeriod,
        status: { $ne: 'REJECTED' }
      }
    },
    {
      $group: {
        _id: '$location.state',
        totalGallons: { $sum: '$gallonsPurchased' },
        totalCost: { $sum: '$totalCost' },
        totalTaxPaid: { $sum: '$ifta.fuelTaxPaid' },
        receiptCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to detect duplicates
fuelReceiptSchema.statics.findDuplicates = async function(checksum, excludeId) {
  const query = { 
    duplicateChecksum: checksum,
    isDuplicate: false
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

module.exports = mongoose.model('FuelReceipt', fuelReceiptSchema);
