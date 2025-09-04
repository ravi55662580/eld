const LogBook = require('../models/LogBook');
const Driver = require('../models/Driver');
const Asset = require('../models/Asset');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Get all log books for a carrier
 * GET /api/v1/logbooks
 */
const getLogBooks = asyncHandler(async (req, res) => {
  let query = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  // Additional filters
  const { driverId, vehicleId, startDate, endDate, status } = req.query;
  
  if (driverId) query.driverId = driverId;
  if (vehicleId) query.vehicleId = vehicleId;
  if (status) query.status = status;
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;
  
  const logBooks = await LogBook.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('primaryVehicle', 'number vin make model')
    .populate('carrierId', 'name dotNumber')
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await LogBook.countDocuments(query);
  
  res.json({
    success: true,
    data: {
      logBooks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Get a specific log book
 * GET /api/v1/logbooks/:id
 */
const getLogBook = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const logBook = await LogBook.findOne(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('primaryVehicle', 'number vin make model')
    .populate('carrierId', 'name dotNumber')
    .populate('coDriverId', 'firstName lastName licenseNumber');
  
  if (!logBook) {
    return res.status(404).json({
      success: false,
      message: 'Log book not found'
    });
  }
  
  res.json({
    success: true,
    data: { logBook }
  });
});

/**
 * Create a new log book entry
 * POST /api/v1/logbooks
 */
const createLogBook = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  
  // Set carrier ID from user context
  req.body.carrierId = req.user.carrierId;
  
  // If user is a driver, set driverId
  if (req.user.role === 'driver' && req.user.driverId) {
    req.body.driverId = req.user.driverId;
  }
  
  // Verify driver exists and belongs to carrier
  const driver = await Driver.findOne({
    _id: req.body.driverId,
    carrierId: req.user.carrierId
  });
  
  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'Driver not found or not associated with your carrier'
    });
  }
  
  // Verify vehicle exists and belongs to carrier (if provided)
  if (req.body.vehicleId) {
    const vehicle = await Asset.findOne({
      _id: req.body.vehicleId,
      carrierId: req.user.carrierId,
      type: 'VEHICLE'
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or not associated with your carrier'
      });
    }
  }
  
  const logBook = await LogBook.create(req.body);
  
  // Populate the response
  await logBook.populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' },
    { path: 'carrierId', select: 'name dotNumber' }
  ]);
  
  res.status(201).json({
    success: true,
    message: 'Log book created successfully',
    data: { logBook }
  });
});

/**
 * Update a log book entry
 * PUT /api/v1/logbooks/:id
 */
const updateLogBook = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  // Remove fields that shouldn't be updated directly
  delete req.body.carrierId;
  delete req.body.createdAt;
  delete req.body.updatedAt;
  
  const logBook = await LogBook.findOneAndUpdate(query, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' },
    { path: 'carrierId', select: 'name dotNumber' }
  ]);
  
  if (!logBook) {
    return res.status(404).json({
      success: false,
      message: 'Log book not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Log book updated successfully',
    data: { logBook }
  });
});

/**
 * Delete a log book entry
 * DELETE /api/v1/logbooks/:id
 */
const deleteLogBook = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only admins and managers can delete
  if (req.user.role !== 'admin') {
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete log books'
      });
    }
    query.carrierId = req.user.carrierId;
  }
  
  const logBook = await LogBook.findOneAndDelete(query);
  
  if (!logBook) {
    return res.status(404).json({
      success: false,
      message: 'Log book not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Log book deleted successfully'
  });
});

/**
 * Add duty status event to a log book
 * POST /api/v1/logbooks/:id/duty-events
 */
const addDutyEvent = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const logBook = await LogBook.findOne(query);
  
  if (!logBook) {
    return res.status(404).json({
      success: false,
      message: 'Log book not found'
    });
  }
  
  // Add the duty event
  await logBook.addDutyEvent(req.body);
  
  // Populate and return updated log book
  await logBook.populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' }
  ]);
  
  res.json({
    success: true,
    message: 'Duty event added successfully',
    data: { logBook }
  });
});

/**
 * Certify a log book
 * POST /api/v1/logbooks/:id/certify
 */
const certifyLogBook = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const logBook = await LogBook.findOne(query);
  
  if (!logBook) {
    return res.status(404).json({
      success: false,
      message: 'Log book not found'
    });
  }
  
  // Certify the log book
  await logBook.certifyLog(req.user._id);
  
  res.json({
    success: true,
    message: 'Log book certified successfully',
    data: { logBook }
  });
});

/**
 * Get HOS summary for a driver
 * GET /api/v1/logbooks/hos-summary/:driverId
 */
const getHOSSummary = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { date } = req.query;
  
  // Role-based access control
  if (req.user.role === 'driver' && req.user.driverId !== driverId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this driver\'s HOS summary'
    });
  }
  
  // Verify driver belongs to user's carrier
  if (req.user.role !== 'admin') {
    const driver = await Driver.findOne({
      _id: driverId,
      carrierId: req.user.carrierId
    });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
  }
  
  const targetDate = date ? new Date(date) : new Date();
  const summary = await LogBook.getHOSSummary(driverId, targetDate);
  
  res.json({
    success: true,
    data: { summary }
  });
});

/**
 * Get violations for log books
 * GET /api/v1/logbooks/violations
 */
const getViolations = asyncHandler(async (req, res) => {
  let matchStage = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    matchStage.driverId = mongoose.Types.ObjectId(req.user.driverId);
  } else if (req.user.role !== 'admin') {
    matchStage.carrierId = mongoose.Types.ObjectId(req.user.carrierId);
  }
  
  // Date range filtering
  const { startDate, endDate, severity } = req.query;
  if (startDate && endDate) {
    matchStage.logDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const violations = await LogBook.getViolations(matchStage, severity);
  
  res.json({
    success: true,
    data: { violations }
  });
});

/**
 * Get driver statistics
 * GET /api/v1/logbooks/statistics/:driverId
 */
const getDriverStatistics = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { startDate, endDate } = req.query;
  
  // Role-based access control
  if (req.user.role === 'driver' && req.user.driverId !== driverId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this driver\'s statistics'
    });
  }
  
  // Verify driver belongs to user's carrier
  if (req.user.role !== 'admin') {
    const driver = await Driver.findOne({
      _id: driverId,
      carrierId: req.user.carrierId
    });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
  }
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const end = endDate ? new Date(endDate) : new Date();
  
  const statistics = await LogBook.getDriverStatistics(driverId, start, end);
  
  res.json({
    success: true,
    data: { statistics }
  });
});

/**
 * Export log books for FMCSA
 * GET /api/v1/logbooks/export/fmcsa
 */
const exportForFMCSA = asyncHandler(async (req, res) => {
  const { driverId, startDate, endDate, format = 'json' } = req.query;
  
  let query = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  if (driverId) query.driverId = driverId;
  if (startDate && endDate) {
    query.logDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const logBooks = await LogBook.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin')
    .populate('carrierId', 'name dotNumber')
    .sort({ logDate: 1, 'dutyEvents.timestamp': 1 });
  
  // Format for FMCSA export
  const exportData = {
    exportDate: new Date().toISOString(),
    totalRecords: logBooks.length,
    dateRange: {
      start: startDate,
      end: endDate
    },
    logBooks: logBooks.map(log => ({
      logDate: log.logDate,
      driver: {
        firstName: log.driverId.firstName,
        lastName: log.driverId.lastName,
        licenseNumber: log.driverId.licenseNumber
      },
      vehicle: log.vehicleId ? {
        vehicleNumber: log.vehicleId.vehicleNumber,
        vin: log.vehicleId.vin
      } : null,
      dutyEvents: log.dutyEvents,
      hosCalculations: log.hosCalculations,
      certification: log.certification,
      totalMiles: log.totalMiles,
      engineHours: log.engineHours
    }))
  };
  
  if (format === 'csv') {
    // TODO: Implement CSV export
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fmcsa-logs.csv');
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=fmcsa-logs.json');
  }
  
  res.json({
    success: true,
    data: exportData
  });
});

module.exports = {
  getLogBooks,
  getLogBook,
  createLogBook,
  updateLogBook,
  deleteLogBook,
  addDutyEvent,
  certifyLogBook,
  getHOSSummary,
  getViolations,
  getDriverStatistics,
  exportForFMCSA
};
