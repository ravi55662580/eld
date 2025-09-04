const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier',
    required: true,
    index: true
  },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  username: { type: String, required: true, trim: true, unique: true },
  licenseNumber: { type: String, required: true, trim: true },
  licenseState: { type: String, default: 'CA' },
  homeBase: { type: String, default: 'Home Terminal' },
  active: { type: Boolean, default: true },
  dvirAccess: { type: String, enum: ['DVIR', 'No Access', 'Read Only'], default: 'DVIR' },
  units: { type: String, enum: ['Miles/Gallons', 'Kilometers/Liters'], default: 'Miles/Gallons' },
  registrationState: { type: String, default: 'CA' },
  settings: {
    personalUse: { type: Boolean, default: true },
    yardMove: { type: Boolean, default: true },
    exemption: { type: Boolean, default: false },
    dvirWifiOnly: { type: Boolean, default: false },
    allowExemption: { type: Boolean, default: false },
    allowDvirPhoto: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Indexes for performance
driverSchema.index({ carrierId: 1, username: 1 });

module.exports = mongoose.model('Driver', driverSchema);
