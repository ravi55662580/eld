const DVIR = require('../models/DVIR');
const Driver = require('../models/Driver');
const Asset = require('../models/Asset');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const { applyRoleFiltering } = require('../utils/roleFiltering');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Get all DVIRs for a carrier
 * GET /api/v1/dvirs
 */
const getDVIRs = asyncHandler(async (req, res) => {
  let query = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  // Additional filters
  const { driverId, vehicleId, startDate, endDate, status, inspectionType, hasDefects } = req.query;
  
  if (driverId) query.driverId = driverId;
  if (vehicleId) query.vehicleId = vehicleId;
  if (status) query.status = status;
  if (inspectionType) query.inspectionType = inspectionType;
  if (hasDefects !== undefined) {
    query['defects.0'] = hasDefects === 'true' ? { $exists: true } : { $exists: false };
  }
  
  if (startDate && endDate) {
    query.inspectionDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;
  
  const dvirs = await DVIR.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin make model')
    .populate('carrierId', 'name dotNumber')
    .populate('mechanicId', 'firstName lastName')
    .sort({ inspectionDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await DVIR.countDocuments(query);
  
  res.json({
    success: true,
    data: {
      dvirs,
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
 * Get a specific DVIR
 * GET /api/v1/dvirs/:id
 */
const getDVIR = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const dvir = await DVIR.findOne(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin make model year')
    .populate('carrierId', 'name dotNumber')
    .populate('mechanicId', 'firstName lastName')
    .populate('supervisorId', 'firstName lastName');
  
  if (!dvir) {
    return res.status(404).json({
      success: false,
      message: 'DVIR not found'
    });
  }
  
  res.json({
    success: true,
    data: { dvir }
  });
});

/**
 * Create a new DVIR
 * POST /api/v1/dvirs
 */
const createDVIR = asyncHandler(async (req, res) => {
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
  
  const dvir = await DVIR.create(req.body);
  
  // Populate the response
  await dvir.populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin make model' },
    { path: 'carrierId', select: 'name dotNumber' }
  ]);
  
  res.status(201).json({
    success: true,
    message: 'DVIR created successfully',
    data: { dvir }
  });
});

/**
 * Update a DVIR
 * PUT /api/v1/dvirs/:id
 */
const updateDVIR = asyncHandler(async (req, res) => {
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
  
  const dvir = await DVIR.findOneAndUpdate(query, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin make model' },
    { path: 'carrierId', select: 'name dotNumber' },
    { path: 'mechanicId', select: 'firstName lastName' }
  ]);
  
  if (!dvir) {
    return res.status(404).json({
      success: false,
      message: 'DVIR not found'
    });
  }
  
  res.json({
    success: true,
    message: 'DVIR updated successfully',
    data: { dvir }
  });
});

/**
 * Delete a DVIR
 * DELETE /api/v1/dvirs/:id
 */
const deleteDVIR = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only admins and managers can delete
  if (req.user.role !== 'admin') {
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete DVIRs'
      });
    }
    query.carrierId = req.user.carrierId;
  }
  
  const dvir = await DVIR.findOneAndDelete(query);
  
  if (!dvir) {
    return res.status(404).json({
      success: false,
      message: 'DVIR not found'
    });
  }
  
  res.json({
    success: true,
    message: 'DVIR deleted successfully'
  });
});

/**
 * Add defect to a DVIR
 * POST /api/v1/dvirs/:id/defects
 */
const addDefect = asyncHandler(async (req, res) => {
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
  
  const dvir = await DVIR.findOne(query);
  
  if (!dvir) {
    return res.status(404).json({
      success: false,
      message: 'DVIR not found'
    });
  }
  
  // Add the defect
  await dvir.addDefect(req.body);
  
  // Populate and return updated DVIR
  await dvir.populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin make model' }
  ]);
  
  res.json({
    success: true,
    message: 'Defect added successfully',
    data: { dvir }
  });
});

/**
 * Update defect status
 * PUT /api/v1/dvirs/:id/defects/:defectId
 */
const updateDefect = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const dvir = await DVIR.findOne(query);
  
  if (!dvir) {
    return res.status(404).json({
      success: false,
      message: 'DVIR not found'
    });
  }
  
  // Update the defect
  await dvir.updateDefect(req.params.defectId, req.body, req.user._id);
  
  res.json({
    success: true,
    message: 'Defect updated successfully',
    data: { dvir }
  });
});

/**
 * Sign DVIR (driver signature)
 * POST /api/v1/dvirs/:id/sign
 */
const signDVIR = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const dvir = await DVIR.findOne(query);
  
  if (!dvir) {
    return res.status(404).json({
      success: false,
      message: 'DVIR not found'
    });
  }
  
  // Sign the DVIR
  await dvir.signDVIR(req.user._id, req.body.signature, req.body.signatureMethod);
  
  res.json({
    success: true,
    message: 'DVIR signed successfully',
    data: { dvir }
  });
});

/**
 * Approve DVIR (supervisor approval)
 * POST /api/v1/dvirs/:id/approve
 */
const approveDVIR = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only managers and admins can approve
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to approve DVIRs'
    });
  }
  
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const dvir = await DVIR.findOne(query);
  
  if (!dvir) {
    return res.status(404).json({
      success: false,
      message: 'DVIR not found'
    });
  }
  
  // Approve the DVIR
  await dvir.approve(req.user._id, req.body.comments);
  
  res.json({
    success: true,
    message: 'DVIR approved successfully',
    data: { dvir }
  });
});

/**
 * Get DVIR statistics
 * GET /api/v1/dvirs/statistics
 */
const getDVIRStatistics = asyncHandler(async (req, res) => {
  let matchStage = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    matchStage.driverId = mongoose.Types.ObjectId(req.user.driverId);
  } else if (req.user.role !== 'admin') {
    matchStage.carrierId = mongoose.Types.ObjectId(req.user.carrierId);
  }
  
  // Date range filtering
  const { startDate, endDate, carrierId } = req.query;
  
  if (startDate && endDate) {
    matchStage.inspectionDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (carrierId && req.user.role === 'admin') {
    matchStage.carrierId = mongoose.Types.ObjectId(carrierId);
  }
  
  const statistics = await DVIR.getDVIRStatistics(matchStage);
  
  res.json({
    success: true,
    data: { statistics }
  });
});

/**
 * Get outstanding defects
 * GET /api/v1/dvirs/outstanding-defects
 */
const getOutstandingDefects = asyncHandler(async (req, res) => {
  let query = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const { vehicleId, severity } = req.query;
  
  if (vehicleId) query.vehicleId = vehicleId;
  
  // Find DVIRs with unresolved defects
  query['defects.status'] = { $in: ['IDENTIFIED', 'IN_REPAIR'] };
  
  const dvirs = await DVIR.find(query)
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'vehicleNumber vin make model')
    .populate('mechanicId', 'firstName lastName')
    .sort({ inspectionDate: -1 });
  
  // Extract and filter defects
  let outstandingDefects = [];
  
  dvirs.forEach(dvir => {
    const unresolved = dvir.defects.filter(defect => 
      ['IDENTIFIED', 'IN_REPAIR'].includes(defect.status) &&
      (!severity || defect.severity === severity)
    );
    
    unresolved.forEach(defect => {
      outstandingDefects.push({
        dvirId: dvir._id,
        defectId: defect._id,
        inspectionDate: dvir.inspectionDate,
        driver: dvir.driverId,
        vehicle: dvir.vehicleId,
        mechanic: dvir.mechanicId,
        component: defect.component,
        defectType: defect.defectType,
        description: defect.description,
        severity: defect.severity,
        status: defect.status,
        identifiedDate: defect.identifiedDate,
        estimatedCost: defect.estimatedCost,
        isOutOfService: defect.isOutOfService
      });
    });
  });
  
  res.json({
    success: true,
    data: { 
      outstandingDefects,
      total: outstandingDefects.length
    }
  });
});

/**
 * Get DVIR compliance report
 * GET /api/v1/dvirs/compliance-report
 */
const getComplianceReport = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  const report = await DVIR.getComplianceReport(carrierId, start, end);
  
  res.json({
    success: true,
    data: { report }
  });
});

/**
 * Get defect trends
 * GET /api/v1/dvirs/defect-trends
 */
const getDefectTrends = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { months = 6 } = req.query;
  
  const trends = await DVIR.getDefectTrends(carrierId, parseInt(months));
  
  res.json({
    success: true,
    data: { trends }
  });
});

/**
 * Export DVIRs
 * GET /api/v1/dvirs/export
 */
const exportDVIRs = asyncHandler(async (req, res) => {
  let query = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const { startDate, endDate, format = 'json', vehicleId, driverId } = req.query;
  
  if (startDate && endDate) {
    query.inspectionDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (vehicleId) query.vehicleId = vehicleId;
  if (driverId) query.driverId = driverId;
  
  const dvirs = await DVIR.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin make model')
    .populate('carrierId', 'name dotNumber')
    .populate('mechanicId', 'firstName lastName')
    .sort({ inspectionDate: -1 });
  
  // Format for export
  const exportData = {
    exportDate: new Date().toISOString(),
    totalRecords: dvirs.length,
    dateRange: {
      start: startDate,
      end: endDate
    },
    dvirs: dvirs.map(dvir => ({
      inspectionDate: dvir.inspectionDate,
      inspectionType: dvir.inspectionType,
      driver: {
        firstName: dvir.driverId.firstName,
        lastName: dvir.driverId.lastName,
        licenseNumber: dvir.driverId.licenseNumber
      },
      vehicle: {
        vehicleNumber: dvir.vehicleId.vehicleNumber,
        vin: dvir.vehicleId.vin,
        make: dvir.vehicleId.make,
        model: dvir.vehicleId.model
      },
      odometer: dvir.odometer,
      location: dvir.location,
      defectsFound: dvir.defects.length,
      defects: dvir.defects,
      status: dvir.status,
      isSigned: dvir.driverSignature.isSigned,
      isApproved: dvir.supervisorApproval.isApproved
    }))
  };
  
  if (format === 'csv') {
    const { convertToCSV, formatDVIRForCSV } = require('../utils/csvExporter');
    const csvData = formatDVIRForCSV(dvirs);
    const csvContent = convertToCSV(csvData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=dvirs.csv');
    return res.send(csvContent);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=dvirs.json');
  }
  
  res.json({
    success: true,
    data: exportData
  });
});

module.exports = {
  getDVIRs,
  getDVIR,
  createDVIR,
  updateDVIR,
  deleteDVIR,
  addDefect,
  updateDefect,
  signDVIR,
  approveDVIR,
  getDVIRStatistics,
  getOutstandingDefects,
  getComplianceReport,
  getDefectTrends,
  exportDVIRs
};
