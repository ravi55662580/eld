const mongoose = require('mongoose');

const logEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['ON_DUTY', 'OFF_DUTY', 'DRIVING', 'SLEEPER_BERTH', 'PERSONAL_CONVEYANCE', 'YARD_MOVE']
  },
  eventCode: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4', '5', '6'] // 1=OFF_DUTY, 2=SLEEPER, 3=DRIVING, 4=ON_DUTY, 5=PERSONAL, 6=YARD
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number, // Duration in minutes
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    city: String,
    state: String
  },
  odometer: {
    type: Number,
    min: 0
  },
  engineHours: Number,
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  trailerNumber: String,
  annotation: {
    type: String,
    maxlength: 60 // FMCSA requirement
  },
  editRequestReason: String,
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  editedAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  certifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  certifiedAt: Date,
  malfunction: {
    type: Boolean,
    default: false
  },
  dataError: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const logBookSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  // Daily totals and calculations
  totalDriving: {
    type: Number,
    default: 0 // Total driving time in minutes
  },
  totalOnDuty: {
    type: Number,
    default: 0 // Total on-duty time in minutes
  },
  totalSleeperBerth: {
    type: Number,
    default: 0
  },
  totalOffDuty: {
    type: Number,
    default: 0
  },
  // HOS compliance calculations
  cycleDutyTime: {
    type: Number,
    default: 0 // 7/8-day cycle duty time
  },
  remaining11Hour: {
    type: Number,
    default: 660 // 11 hours in minutes
  },
  remaining14Hour: {
    type: Number,
    default: 840 // 14 hours in minutes
  },
  remaining70Hour: {
    type: Number,
    default: 4200 // 70 hours in minutes
  },
  remaining60Hour: {
    type: Number,
    default: 3600 // 60 hours in minutes
  },
  // Log events for the day
  events: [logEventSchema],
  // Violation tracking
  violations: [{
    type: {
      type: String,
      enum: ['11_HOUR_DRIVING', '14_HOUR_DUTY', '10_HOUR_OFF_DUTY', '70_HOUR_CYCLE', '60_HOUR_CYCLE']
    },
    severity: {
      type: String,
      enum: ['WARNING', 'VIOLATION'],
      default: 'WARNING'
    },
    description: String,
    timestamp: Date,
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  // Certification status
  isCertified: {
    type: Boolean,
    default: false
  },
  certifiedAt: Date,
  certificationSignature: String,
  // Recap information
  recap: {
    day1: Number,
    day2: Number,
    day3: Number,
    day4: Number,
    day5: Number,
    day6: Number,
    day7: Number,
    day8: Number
  },
  // Vehicle information
  primaryVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  coDriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  // Trip information
  shippingDocuments: [String],
  totalMiles: {
    type: Number,
    default: 0
  },
  totalKilometers: {
    type: Number,
    default: 0
  },
  // Exemptions
  exemptions: [{
    type: {
      type: String,
      enum: ['ADVERSE_DRIVING', 'SHORT_HAUL', 'PERSONAL_CONVEYANCE', 'YARD_MOVE']
    },
    startTime: Date,
    endTime: Date,
    reason: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
logBookSchema.index({ driverId: 1, date: 1 }, { unique: true });
logBookSchema.index({ carrierId: 1, date: -1 });
logBookSchema.index({ date: -1, driverId: 1 });

// Virtual for formatted date
logBookSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Virtual for total duty time
logBookSchema.virtual('totalDutyTime').get(function() {
  return this.totalOnDuty + this.totalDriving;
});

// Virtual for remaining duty time
logBookSchema.virtual('remainingDutyTime').get(function() {
  return Math.max(0, 840 - this.totalDutyTime); // 14 hours max
});

// Method to calculate HOS compliance
logBookSchema.methods.calculateHOS = function() {
  // Calculate daily totals from events
  let driving = 0, onDuty = 0, sleeper = 0, offDuty = 0;
  
  this.events.forEach(event => {
    if (event.duration) {
      switch(event.eventType) {
        case 'DRIVING':
          driving += event.duration;
          break;
        case 'ON_DUTY':
          onDuty += event.duration;
          break;
        case 'SLEEPER_BERTH':
          sleeper += event.duration;
          break;
        case 'OFF_DUTY':
          offDuty += event.duration;
          break;
      }
    }
  });
  
  this.totalDriving = driving;
  this.totalOnDuty = onDuty;
  this.totalSleeperBerth = sleeper;
  this.totalOffDuty = offDuty;
  
  // Calculate remaining times
  this.remaining11Hour = Math.max(0, 660 - driving);
  this.remaining14Hour = Math.max(0, 840 - (driving + onDuty));
  
  return {
    totalDriving: driving,
    totalOnDuty: onDuty,
    totalDutyTime: driving + onDuty,
    remaining11Hour: this.remaining11Hour,
    remaining14Hour: this.remaining14Hour
  };
};

// Method to add log event
logBookSchema.methods.addEvent = function(eventData) {
  // Validate event sequence
  const lastEvent = this.events[this.events.length - 1];
  if (lastEvent && !lastEvent.endTime) {
    lastEvent.endTime = eventData.startTime;
    lastEvent.duration = Math.floor((lastEvent.endTime - lastEvent.startTime) / (1000 * 60));
  }
  
  this.events.push(eventData);
  this.calculateHOS();
  
  return this.save();
};

// Method to check for violations
logBookSchema.methods.checkViolations = function() {
  const violations = [];
  
  // 11-hour driving limit
  if (this.totalDriving > 660) {
    violations.push({
      type: '11_HOUR_DRIVING',
      severity: 'VIOLATION',
      description: '11-hour driving limit exceeded',
      timestamp: new Date()
    });
  }
  
  // 14-hour duty limit
  if (this.totalDriving + this.totalOnDuty > 840) {
    violations.push({
      type: '14_HOUR_DUTY',
      severity: 'VIOLATION',
      description: '14-hour duty limit exceeded',
      timestamp: new Date()
    });
  }
  
  this.violations = violations;
  return violations;
};

module.exports = mongoose.model('LogBook', logBookSchema);
