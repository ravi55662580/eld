const Violation = require('../models/Violation');
const Driver = require('../models/Driver');
const Asset = require('../models/Asset');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const { applyRoleFiltering } = require('../utils/roleFiltering');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Get all violations for a carrier
 * GET /api/v1/violations
 */
const getViolations = asyncHandler(async (req, res) => {
  let query = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  // Additional filters
  const { 
    driverId, 
    vehicleId, 
    startDate, 
    endDate, 
    violationType,
    severity,
    status,
    isResolved
  } = req.query;
  
  if (driverId) query.driverId = driverId;
  if (vehicleId) query.vehicleId = vehicleId;
  if (violationType) query.violationType = violationType;
  if (severity) query.severity = severity;
  if (status) query.status = status;
  if (isResolved !== undefined) query.isResolved = isResolved === 'true';
  
  if (startDate && endDate) {
    query.violationDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;
  
  const violations = await Violation.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin')
    .populate('carrierId', 'name dotNumber')
    .sort({ violationDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Violation.countDocuments(query);
  
  res.json({
    success: true,
    data: {
      violations,
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
 * Get a specific violation
 * GET /api/v1/violations/:id
 */
const getViolation = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const violation = await Violation.findOne(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin make model')
    .populate('carrierId', 'name dotNumber');
  
  if (!violation) {
    return res.status(404).json({
      success: false,
      message: 'Violation not found'
    });
  }
  
  res.json({
    success: true,
    data: { violation }
  });
});

/**
 * Create a new violation
 * POST /api/v1/violations
 */
const createViolation = asyncHandler(async (req, res) => {
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
  req.body.detectedBy = req.user._id;
  
  // Verify driver exists and belongs to carrier (if provided)
  if (req.body.driverId) {
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
  
  const violation = await Violation.create(req.body);
  
  // Populate the response
  await violation.populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' },
    { path: 'carrierId', select: 'name dotNumber' }
  ]);
  
  res.status(201).json({
    success: true,
    message: 'Violation created successfully',
    data: { violation }
  });
});

/**
 * Update a violation
 * PUT /api/v1/violations/:id
 */
const updateViolation = asyncHandler(async (req, res) => {
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
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  // Remove fields that shouldn't be updated directly
  delete req.body.carrierId;
  delete req.body.createdAt;
  delete req.body.updatedAt;
  
  const violation = await Violation.findOneAndUpdate(query, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' },
    { path: 'carrierId', select: 'name dotNumber' }
  ]);
  
  if (!violation) {
    return res.status(404).json({
      success: false,
      message: 'Violation not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Violation updated successfully',
    data: { violation }
  });
});

/**
 * Delete a violation
 * DELETE /api/v1/violations/:id
 */
const deleteViolation = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only admins can delete
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete violations'
    });
  }
  
  const violation = await Violation.findOneAndDelete(query);
  
  if (!violation) {
    return res.status(404).json({
      success: false,
      message: 'Violation not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Violation deleted successfully'
  });
});

/**
 * Resolve a violation
 * POST /api/v1/violations/:id/resolve
 */
const resolveViolation = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const violation = await Violation.findOne(query);
  
  if (!violation) {
    return res.status(404).json({
      success: false,
      message: 'Violation not found'
    });
  }
  
  // Resolve the violation
  await violation.resolve(req.user._id, req.body.resolution, req.body.notes);
  
  res.json({
    success: true,
    message: 'Violation resolved successfully',
    data: { violation }
  });
});

/**
 * Contest a violation
 * POST /api/v1/violations/:id/contest
 */
const contestViolation = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const violation = await Violation.findOne(query);
  
  if (!violation) {
    return res.status(404).json({
      success: false,
      message: 'Violation not found'
    });
  }
  
  // Contest the violation
  await violation.contest(req.user._id, req.body.reason, req.body.evidence);
  
  res.json({
    success: true,
    message: 'Violation contested successfully',
    data: { violation }
  });
});

/**
 * Add corrective action to violation
 * POST /api/v1/violations/:id/corrective-actions
 */
const addCorrectiveAction = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only managers and admins
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to add corrective actions'
    });
  }
  
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const violation = await Violation.findOne(query);
  
  if (!violation) {
    return res.status(404).json({
      success: false,
      message: 'Violation not found'
    });
  }
  
  // Add corrective action
  await violation.addCorrectiveAction(req.body, req.user._id);
  
  res.json({
    success: true,
    message: 'Corrective action added successfully',
    data: { violation }
  });
});

/**
 * Get violation statistics
 * GET /api/v1/violations/statistics
 */
const getViolationStatistics = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  const statistics = await Violation.getViolationStatistics(carrierId, start, end);
  
  res.json({
    success: true,
    data: { statistics }
  });
});

/**
 * Get violation trends
 * GET /api/v1/violations/trends
 */
const getViolationTrends = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { months = 12 } = req.query;
  const trends = await Violation.getViolationTrends(carrierId, parseInt(months));
  
  res.json({
    success: true,
    data: { trends }
  });
});

/**
 * Get driver safety score
 * GET /api/v1/violations/safety-score/:driverId
 */
const getDriverSafetyScore = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  
  // Role-based access control
  if (req.user.role === 'driver' && req.user.driverId !== driverId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this driver\'s safety score'
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
  
  const safetyScore = await Violation.getDriverSafetyScore(driverId);
  
  res.json({
    success: true,
    data: { safetyScore }
  });
});

/**
 * Export violations
 * GET /api/v1/violations/export
 */
const exportViolations = asyncHandler(async (req, res) => {
  let query = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const { startDate, endDate, format = 'json', violationType, severity } = req.query;
  
  if (startDate && endDate) {
    query.violationDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (violationType) query.violationType = violationType;
  if (severity) query.severity = severity;
  
  const violations = await Violation.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin')
    .populate('carrierId', 'name dotNumber')
    .sort({ violationDate: -1 });
  
  // Format for export
  const exportData = {
    exportDate: new Date().toISOString(),
    totalRecords: violations.length,
    dateRange: {
      start: startDate,
      end: endDate
    },
    violations: violations.map(violation => ({
      violationDate: violation.violationDate,
      violationType: violation.violationType,
      severity: violation.severity,
      driver: violation.driverId ? {
        firstName: violation.driverId.firstName,
        lastName: violation.driverId.lastName,
        licenseNumber: violation.driverId.licenseNumber
      } : null,
      vehicle: violation.vehicleId ? {
        vehicleNumber: violation.vehicleId.vehicleNumber,
        vin: violation.vehicleId.vin
      } : null,
      description: violation.description,
      regulation: violation.regulation,
      fineAmount: violation.penalty.fineAmount,
      isResolved: violation.isResolved,
      status: violation.status,
      location: violation.location
    }))
  };
  
  if (format === 'csv') {
    const { convertToCSV, formatViolationsForCSV } = require('../utils/csvExporter');
    const csvData = formatViolationsForCSV(violations);
    const csvContent = convertToCSV(csvData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=violations.csv');
    return res.send(csvContent);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=violations.json');
  }
  
  res.json({
    success: true,
    data: exportData
  });
});

module.exports = {
  getViolations,
  getViolation,
  createViolation,
  updateViolation,
  deleteViolation,
  resolveViolation,
  contestViolation,
  addCorrectiveAction,
  getViolationStatistics,
  getViolationTrends,
  getDriverSafetyScore,
  exportViolations
};
