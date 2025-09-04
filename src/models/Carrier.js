const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'United States' }
}, { _id: false });

const carrierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Carrier name is required'],
    trim: true,
    maxlength: [100, 'Carrier name cannot exceed 100 characters']
  },
  dotNumber: {
    type: String,
    required: [true, 'DOT number is required'],
    unique: true,
    trim: true,
    match: [/^\d{1,8}$/, 'DOT number must be 1-8 digits']
  },
  mcNumber: {
    type: String,
    trim: true,
    match: [/^MC-?\d{1,8}$/, 'MC number format is invalid']
  },
  address: {
    type: addressSchema,
    required: [true, 'Address is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\//, 'Website must start with http:// or https://']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  timezone: {
    type: String,
    default: 'America/New_York',
    enum: [
      'America/New_York',
      'America/Chicago', 
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu'
    ]
  },
  subscription: {
    type: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    isActive: { type: Boolean, default: true }
  },
  settings: {
    maxDrivers: { type: Number, default: 50 },
    maxAssets: { type: Number, default: 25 },
    allowPersonalUse: { type: Boolean, default: true },
    requireDVIR: { type: Boolean, default: true },
    hosRuleset: {
      type: String,
      enum: ['60-hour/7-day', '70-hour/8-day'],
      default: '70-hour/8-day'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
carrierSchema.index({ dotNumber: 1 });
carrierSchema.index({ name: 1 });
carrierSchema.index({ isActive: 1 });
carrierSchema.index({ 'subscription.isActive': 1 });

// Virtual for full address
carrierSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
});

module.exports = mongoose.model('Carrier', carrierSchema);
