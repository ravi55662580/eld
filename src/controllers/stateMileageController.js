const StateMileage = require('../models/StateMileage');
const Driver = require('../models/Driver');
const Asset = require('../models/Asset');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const { applyRoleFiltering } = require('../utils/roleFiltering');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Get all state mileage records for a carrier
 * GET /api/v1/state-mileage
 */
const getStateMileageRecords = asyncHandler(async (req, res) => {
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
    state,
    year,
    quarter,
    isSubmitted,
    isCompleted
  } = req.query;
  
  if (driverId) query.driverId = driverId;
  if (vehicleId) query.vehicleId = vehicleId;
  if (state) query.state = state;
  if (year) query['reportingPeriod.year'] = parseInt(year);
  if (quarter) query['reportingPeriod.quarter'] = quarter;
  if (isSubmitted !== undefined) query.isSubmitted = isSubmitted === 'true';
  if (isCompleted !== undefined) query.isCompleted = isCompleted === 'true';
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;
  
  const records = await StateMileage.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin')
    .populate('carrierId', 'name dotNumber')
    .sort({ 'reportingPeriod.year': -1, 'reportingPeriod.quarter': -1, state: 1 })
    .skip(skip)
    .limit(limit);
  
  const total = await StateMileage.countDocuments(query);
  
  res.json({
    success: true,
    data: {
      stateMileageRecords: records,
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
 * Get a specific state mileage record
 * GET /api/v1/state-mileage/:id
 */
const getStateMileageRecord = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const record = await StateMileage.findOne(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin make model')
    .populate('carrierId', 'name dotNumber')
    .populate('submittedBy', 'firstName lastName');
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'State mileage record not found'
    });
  }
  
  res.json({
    success: true,
    data: { stateMileageRecord: record }
  });
});

/**
 * Create a new state mileage record
 * POST /api/v1/state-mileage
 */
const createStateMileageRecord = asyncHandler(async (req, res) => {
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
  
  // Verify vehicle exists and belongs to carrier
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
  
  const record = await StateMileage.create(req.body);
  
  // Populate the response
  await record.populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' },
    { path: 'carrierId', select: 'name dotNumber' }
  ]);
  
  res.status(201).json({
    success: true,
    message: 'State mileage record created successfully',
    data: { stateMileageRecord: record }
  });
});

/**
 * Update a state mileage record
 * PUT /api/v1/state-mileage/:id
 */
const updateStateMileageRecord = asyncHandler(async (req, res) => {
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
  
  const record = await StateMileage.findOneAndUpdate(query, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' },
    { path: 'carrierId', select: 'name dotNumber' }
  ]);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'State mileage record not found'
    });
  }
  
  res.json({
    success: true,
    message: 'State mileage record updated successfully',
    data: { stateMileageRecord: record }
  });
});

/**
 * Delete a state mileage record
 * DELETE /api/v1/state-mileage/:id
 */
const deleteStateMileageRecord = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only admins and managers can delete
  if (req.user.role !== 'admin') {
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete state mileage records'
      });
    }
    query.carrierId = req.user.carrierId;
  }
  
  const record = await StateMileage.findOneAndDelete(query);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'State mileage record not found'
    });
  }
  
  res.json({
    success: true,
    message: 'State mileage record deleted successfully'
  });
});

/**
 * Add trip segment to state mileage record
 * POST /api/v1/state-mileage/:id/trip-segments
 */
const addTripSegment = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const record = await StateMileage.findOne(query);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'State mileage record not found'
    });
  }
  
  // Add trip segment
  await record.addTripSegment(req.body);
  
  res.json({
    success: true,
    message: 'Trip segment added successfully',
    data: { stateMileageRecord: record }
  });
});

/**
 * Add fuel purchase to state mileage record
 * POST /api/v1/state-mileage/:id/fuel-purchases
 */
const addFuelPurchase = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const record = await StateMileage.findOne(query);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'State mileage record not found'
    });
  }
  
  // Add fuel purchase
  await record.addFuelPurchase(req.body);
  
  res.json({
    success: true,
    message: 'Fuel purchase added successfully',
    data: { stateMileageRecord: record }
  });
});

/**
 * Submit state mileage record
 * POST /api/v1/state-mileage/:id/submit
 */
const submitStateMileageRecord = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const record = await StateMileage.findOne(query);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'State mileage record not found'
    });
  }
  
  // Submit the record
  await record.submit(req.user._id);
  
  res.json({
    success: true,
    message: 'State mileage record submitted successfully',
    data: { stateMileageRecord: record }
  });
});

/**
 * Validate data quality of state mileage record
 * POST /api/v1/state-mileage/:id/validate
 */
const validateDataQuality = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const record = await StateMileage.findOne(query);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'State mileage record not found'
    });
  }
  
  // Validate data quality
  await record.validateDataQuality();
  
  res.json({
    success: true,
    message: 'Data quality validation completed',
    data: { 
      stateMileageRecord: record,
      dataQuality: record.dataQuality
    }
  });
});

/**
 * Get IFTA summary for a carrier
 * GET /api/v1/state-mileage/ifta-summary
 */
const getIFTASummary = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { year, quarter } = req.query;
  
  if (!year || !quarter) {
    return res.status(400).json({
      success: false,
      message: 'Year and quarter are required for IFTA summary'
    });
  }
  
  const summary = await StateMileage.getIFTASummary(carrierId, parseInt(year), quarter);
  
  res.json({
    success: true,
    data: { summary }
  });
});

/**
 * Get mileage statistics
 * GET /api/v1/state-mileage/statistics
 */
const getMileageStatistics = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
  const end = endDate ? new Date(endDate) : new Date();
  
  const statistics = await StateMileage.getMileageStatistics(carrierId, start, end);
  
  res.json({
    success: true,
    data: { statistics }
  });
});

/**
 * Get quarterly report status
 * GET /api/v1/state-mileage/quarterly-status
 */
const getQuarterlyStatus = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { year, quarter } = req.query;
  
  if (!year || !quarter) {
    return res.status(400).json({
      success: false,
      message: 'Year and quarter are required'
    });
  }
  
  // Get all records for the quarter
  const records = await StateMileage.find({
    carrierId: mongoose.Types.ObjectId(carrierId),
    'reportingPeriod.year': parseInt(year),
    'reportingPeriod.quarter': quarter
  }).populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'vehicleNumber');
  
  // Calculate status summary
  const statusSummary = {
    totalRecords: records.length,
    completedRecords: records.filter(r => r.isCompleted).length,
    submittedRecords: records.filter(r => r.isSubmitted).length,
    recordsWithGaps: records.filter(r => r.dataQuality.hasGaps).length,
    averageAccuracy: records.length > 0 ? 
      records.reduce((sum, r) => sum + r.dataQuality.accuracy, 0) / records.length : 0,
    totalMiles: records.reduce((sum, r) => sum + r.totalMiles, 0),
    totalIftaMiles: records.reduce((sum, r) => sum + r.iftaMiles, 0),
    totalFuelGallons: records.reduce((sum, r) => sum + r.totalGallonsPurchased, 0),
    totalTaxDue: records.reduce((sum, r) => sum + r.netTaxDue, 0),
    stateBreakdown: {}
  };
  
  // Group by state
  records.forEach(record => {
    if (!statusSummary.stateBreakdown[record.state]) {
      statusSummary.stateBreakdown[record.state] = {
        totalMiles: 0,
        iftaMiles: 0,
        fuelGallons: 0,
        taxDue: 0,
        isCompleted: false,
        isSubmitted: false
      };
    }
    
    const stateData = statusSummary.stateBreakdown[record.state];
    stateData.totalMiles += record.totalMiles;
    stateData.iftaMiles += record.iftaMiles;
    stateData.fuelGallons += record.totalGallonsPurchased;
    stateData.taxDue += record.netTaxDue;
    stateData.isCompleted = stateData.isCompleted || record.isCompleted;
    stateData.isSubmitted = stateData.isSubmitted || record.isSubmitted;
  });
  
  res.json({
    success: true,
    data: { 
      quarterlyStatus: statusSummary,
      records: records
    }
  });
});

/**
 * Export state mileage data for IFTA
 * GET /api/v1/state-mileage/export
 */
const exportIFTAData = asyncHandler(async (req, res) => {
  let query = {};
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const { year, quarter, format = 'json', carrierId } = req.query;
  
  if (req.user.role === 'admin' && carrierId) {
    query.carrierId = carrierId;
  }
  
  if (!year || !quarter) {
    return res.status(400).json({
      success: false,
      message: 'Year and quarter are required for IFTA export'
    });
  }
  
  query['reportingPeriod.year'] = parseInt(year);
  query['reportingPeriod.quarter'] = quarter;
  
  const records = await StateMileage.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin')
    .populate('carrierId', 'name dotNumber')
    .sort({ state: 1 });
  
  // Format for IFTA export
  const exportData = {
    exportDate: new Date().toISOString(),
    reportingPeriod: `${year}-${quarter}`,
    totalRecords: records.length,
    carrier: records[0]?.carrierId || null,
    summary: {
      totalMiles: records.reduce((sum, r) => sum + r.totalMiles, 0),
      totalIftaMiles: records.reduce((sum, r) => sum + r.iftaMiles, 0),
      totalGallons: records.reduce((sum, r) => sum + r.totalGallonsPurchased, 0),
      totalTaxDue: records.reduce((sum, r) => sum + r.netTaxDue, 0)
    },
    stateRecords: records.map(record => ({
      state: record.state,
      stateFullName: record.stateFullName,
      totalMiles: record.totalMiles,
      iftaMiles: record.iftaMiles,
      nonIftaMiles: record.nonIftaMiles,
      totalGallonsPurchased: record.totalGallonsPurchased,
      fuelTaxPaid: record.fuelTaxPaid,
      fuelTaxOwed: record.fuelTaxOwed,
      netTaxDue: record.netTaxDue,
      averageMPG: record.averageMPG,
      isCompleted: record.isCompleted,
      isSubmitted: record.isSubmitted,
      dataQuality: record.dataQuality
    }))
  };
  
  if (format === 'csv') {
    const { convertToCSV, formatStateMileageForCSV } = require('../utils/csvExporter');
    const csvData = formatStateMileageForCSV(mileageData);
    const csvContent = convertToCSV(csvData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ifta-${year}-${quarter}.csv`);
    return res.send(csvContent);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=ifta-${year}-${quarter}.json`);
  }
  
  res.json({
    success: true,
    data: exportData
  });
});

module.exports = {
  getStateMileageRecords,
  getStateMileageRecord,
  createStateMileageRecord,
  updateStateMileageRecord,
  deleteStateMileageRecord,
  addTripSegment,
  addFuelPurchase,
  submitStateMileageRecord,
  validateDataQuality,
  getIFTASummary,
  getMileageStatistics,
  getQuarterlyStatus,
  exportIFTAData
};
