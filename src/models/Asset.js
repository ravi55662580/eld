const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: [true, 'Asset type is required'],
    enum: ['Tractor', 'Trailer', 'Truck'],
    default: 'Tractor'
  },
  assetSubtype: {
    type: String,
    required: [true, 'Asset subtype is required'],
    enum: ['Truck', 'Semi', 'Box Truck'],
    default: 'Truck'
  },
  number: {
    type: String,
    required: [true, 'Asset number is required'],
    trim: true,
    maxlength: [20, 'Asset number cannot exceed 20 characters']
  },
  vin: {
    type: String,
    required: [true, 'VIN is required'],
    trim: true,
    minlength: [17, 'VIN must be exactly 17 characters'],
    maxlength: [17, 'VIN must be exactly 17 characters'],
    match: [/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format']
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['Diesel', 'Gasoline', 'Electric', 'Hybrid'],
    default: 'Diesel'
  },
  plate: {
    type: String,
    trim: true,
    maxlength: [15, 'License plate cannot exceed 15 characters']
  },
  registrationState: {
    type: String,
    required: [true, 'Registration state is required'],
    enum: ['CA', 'NY', 'TX', 'FL', 'WA', 'OR', 'AZ', 'NV', 'CO', 'IL', 'OH', 'PA', 'GA', 'NC', 'VA', 'MD', 'NJ', 'MA', 'CT', 'RI'],
    default: 'CA'
  },
  homeBase: {
    type: String,
    required: [true, 'Home base is required'],
    enum: ['Home Terminal', 'Other Terminal'],
    default: 'Home Terminal'
  },
  customDvirTemplate: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  ecmIdentifier: {
    type: String,
    trim: true,
    match: [/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, 'ECM Identifier must be in format XX:XX:XX:XX:XX:XX']
  },
  additionalEcmIdentifier: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  // Additional ELD-specific fields
  make: { type: String, trim: true },
  model: { type: String, trim: true },
  year: { 
    type: Number, 
    min: [1980, 'Year must be 1980 or later'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  color: { type: String, trim: true },
  mileage: { type: Number, min: 0, default: 0 },
  purchaseDate: Date,
  lastInspectionDate: Date,
  inspectionDueDate: Date,
  insuranceExpiryDate: Date,
  registrationExpiryDate: Date,
  
  // Tracking and telemetry
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: Date
  },
  
  // Maintenance records
  maintenanceSchedule: [{
    type: { type: String, required: true },
    dueDate: Date,
    dueMileage: Number,
    completed: { type: Boolean, default: false },
    completedDate: Date,
    notes: String
  }]
}, {
  timestamps: true
});

// Compound indexes for performance
assetSchema.index({ carrierId: 1, number: 1 }, { unique: true });
assetSchema.index({ carrierId: 1, active: 1 });
assetSchema.index({ vin: 1 }, { unique: true });
assetSchema.index({ plate: 1 });

// Virtual for full asset identifier
assetSchema.virtual('fullIdentifier').get(function() {
  return `${this.type} #${this.number}`;
});

// Virtual for maintenance status
assetSchema.virtual('maintenanceStatus').get(function() {
  const now = new Date();
  const overdueMaintenance = this.maintenanceSchedule.filter(item => 
    !item.completed && item.dueDate && item.dueDate < now
  );
  return {
    overdue: overdueMaintenance.length,
    upcoming: this.maintenanceSchedule.filter(item => 
      !item.completed && item.dueDate && item.dueDate > now && item.dueDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    ).length
  };
});

module.exports = mongoose.model('Asset', assetSchema);
