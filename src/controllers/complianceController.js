const Compliance = require('../models/Compliance');
const Driver = require('../models/Driver');
const Asset = require('../models/Asset');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Get all compliance records for a carrier
 * GET /api/v1/compliance
 */
const getComplianceRecords = asyncHandler(async (req, res) => {
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
    complianceType,
    status,
    riskLevel,
    startDate,
    endDate
  } = req.query;
  
  if (driverId) query.driverId = driverId;
  if (vehicleId) query.vehicleId = vehicleId;
  if (complianceType) query.complianceType = complianceType;
  if (status) query.status = status;
  if (riskLevel) query['riskAssessment.riskLevel'] = riskLevel;
  
  if (startDate && endDate) {
    query['assessment.assessmentDate'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;
  
  const records = await Compliance.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin')
    .populate('carrierId', 'name dotNumber')
    .populate('assessment.assessedBy', 'firstName lastName')
    .sort({ 'assessment.assessmentDate': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Compliance.countDocuments(query);
  
  res.json({
    success: true,
    data: {
      complianceRecords: records,
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
 * Get a specific compliance record
 * GET /api/v1/compliance/:id
 */
const getComplianceRecord = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const record = await Compliance.findOne(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin make model')
    .populate('carrierId', 'name dotNumber')
    .populate('assessment.assessedBy', 'firstName lastName')
    .populate('correctiveActions.assignedTo', 'firstName lastName')
    .populate('correctiveActions.verifiedBy', 'firstName lastName');
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }
  
  res.json({
    success: true,
    data: { complianceRecord: record }
  });
});

/**
 * Create a new compliance record
 * POST /api/v1/compliance
 */
const createComplianceRecord = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  
  // Set carrier ID and assessor from user context
  req.body.carrierId = req.user.carrierId;
  req.body.assessment = {
    ...req.body.assessment,
    assessedBy: req.user._id
  };
  
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
  
  const record = await Compliance.create(req.body);
  
  // Populate the response
  await record.populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' },
    { path: 'carrierId', select: 'name dotNumber' },
    { path: 'assessment.assessedBy', select: 'firstName lastName' }
  ]);
  
  res.status(201).json({
    success: true,
    message: 'Compliance record created successfully',
    data: { complianceRecord: record }
  });
});

/**
 * Update a compliance record
 * PUT /api/v1/compliance/:id
 */
const updateComplianceRecord = asyncHandler(async (req, res) => {
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
  
  const record = await Compliance.findOneAndUpdate(query, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' },
    { path: 'carrierId', select: 'name dotNumber' },
    { path: 'assessment.assessedBy', select: 'firstName lastName' }
  ]);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Compliance record updated successfully',
    data: { complianceRecord: record }
  });
});

/**
 * Delete a compliance record
 * DELETE /api/v1/compliance/:id
 */
const deleteComplianceRecord = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only admins can delete
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete compliance records'
    });
  }
  
  const record = await Compliance.findOneAndDelete(query);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Compliance record deleted successfully'
  });
});

/**
 * Add violation to compliance record
 * POST /api/v1/compliance/:id/violations
 */
const addViolation = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const record = await Compliance.findOne(query);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }
  
  // Add violation
  await record.addViolation(req.body);
  
  res.json({
    success: true,
    message: 'Violation added to compliance record',
    data: { complianceRecord: record }
  });
});

/**
 * Add corrective action to compliance record
 * POST /api/v1/compliance/:id/corrective-actions
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
  
  const record = await Compliance.findOne(query);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }
  
  // Add corrective action
  await record.addCorrectiveAction(req.body);
  
  res.json({
    success: true,
    message: 'Corrective action added successfully',
    data: { complianceRecord: record }
  });
});

/**
 * Complete corrective action
 * PUT /api/v1/compliance/:id/corrective-actions/:actionId/complete
 */
const completeCorrectiveAction = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const record = await Compliance.findOne(query);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }
  
  // Complete corrective action
  await record.completeCorrectiveAction(req.params.actionId, req.user._id);
  
  res.json({
    success: true,
    message: 'Corrective action completed successfully',
    data: { complianceRecord: record }
  });
});

/**
 * Update compliance status
 * PUT /api/v1/compliance/:id/status
 */
const updateComplianceStatus = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only managers and admins can update status
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update compliance status'
    });
  }
  
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const record = await Compliance.findOne(query);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Compliance record not found'
    });
  }
  
  const { status, reason } = req.body;
  
  // Update status
  await record.updateStatus(status, req.user._id, reason);
  
  res.json({
    success: true,
    message: 'Compliance status updated successfully',
    data: { complianceRecord: record }
  });
});

/**
 * Get compliance summary
 * GET /api/v1/compliance/summary
 */
const getComplianceSummary = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { complianceType, startDate, endDate } = req.query;
  
  const filters = {};
  if (complianceType) filters.complianceType = complianceType;
  if (startDate && endDate) {
    filters.startDate = new Date(startDate);
    filters.endDate = new Date(endDate);
  }
  
  const summary = await Compliance.getComplianceSummary(carrierId, filters);
  
  res.json({
    success: true,
    data: { summary }
  });
});

/**
 * Get upcoming reviews
 * GET /api/v1/compliance/upcoming-reviews
 */
const getUpcomingReviews = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { days = 30 } = req.query;
  
  const upcomingReviews = await Compliance.getUpcomingReviews(carrierId, parseInt(days));
  
  res.json({
    success: true,
    data: { upcomingReviews }
  });
});

/**
 * Get compliance trends
 * GET /api/v1/compliance/trends
 */
const getComplianceTrends = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { months = 12 } = req.query;
  
  const trends = await Compliance.getComplianceTrends(carrierId, parseInt(months));
  
  res.json({
    success: true,
    data: { trends }
  });
});

/**
 * Get compliance dashboard
 * GET /api/v1/compliance/dashboard
 */
const getComplianceDashboard = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  // Get various compliance metrics
  const [summary, upcomingReviews, trends] = await Promise.all([
    Compliance.getComplianceSummary(carrierId),
    Compliance.getUpcomingReviews(carrierId, 7), // Next 7 days
    Compliance.getComplianceTrends(carrierId, 6) // Last 6 months
  ]);
  
  // Get high-risk items
  const highRiskItems = await Compliance.find({
    carrierId: mongoose.Types.ObjectId(carrierId),
    'riskAssessment.riskLevel': { $in: ['HIGH', 'VERY_HIGH'] },
    status: { $in: ['NON_COMPLIANT', 'PENDING_REVIEW'] }
  })
  .populate('driverId', 'firstName lastName')
  .populate('vehicleId', 'vehicleNumber')
  .limit(10)
  .sort({ 'riskAssessment.riskLevel': -1, 'assessment.assessmentDate': -1 });
  
  // Get overdue actions
  const overdueActions = await Compliance.find({
    carrierId: mongoose.Types.ObjectId(carrierId),
    'correctiveActions.status': 'OVERDUE'
  })
  .populate('driverId', 'firstName lastName')
  .populate('correctiveActions.assignedTo', 'firstName lastName')
  .limit(10)
  .sort({ 'correctiveActions.dueDate': 1 });
  
  const dashboard = {
    summary: summary[0] || {},
    upcomingReviews,
    trends,
    highRiskItems,
    overdueActions: overdueActions.map(record => ({
      complianceRecord: record,
      overdueActions: record.correctiveActions.filter(action => action.status === 'OVERDUE')
    }))
  };
  
  res.json({
    success: true,
    data: { dashboard }
  });
});

/**
 * Export compliance records
 * GET /api/v1/compliance/export
 */
const exportComplianceRecords = asyncHandler(async (req, res) => {
  let query = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const { 
    startDate, 
    endDate, 
    format = 'json', 
    complianceType, 
    status,
    riskLevel
  } = req.query;
  
  if (startDate && endDate) {
    query['assessment.assessmentDate'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (complianceType) query.complianceType = complianceType;
  if (status) query.status = status;
  if (riskLevel) query['riskAssessment.riskLevel'] = riskLevel;
  
  const records = await Compliance.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin')
    .populate('carrierId', 'name dotNumber')
    .populate('assessment.assessedBy', 'firstName lastName')
    .sort({ 'assessment.assessmentDate': -1 });
  
  // Format for export
  const exportData = {
    exportDate: new Date().toISOString(),
    totalRecords: records.length,
    dateRange: {
      start: startDate,
      end: endDate
    },
    complianceRecords: records.map(record => ({
      complianceType: record.complianceType,
      status: record.status,
      assessmentDate: record.assessment.assessmentDate,
      nextReviewDate: record.assessment.nextReviewDate,
      driver: record.driverId ? {
        firstName: record.driverId.firstName,
        lastName: record.driverId.lastName,
        licenseNumber: record.driverId.licenseNumber
      } : null,
      vehicle: record.vehicleId ? {
        vehicleNumber: record.vehicleId.vehicleNumber,
        vin: record.vehicleId.vin
      } : null,
      regulation: record.regulation,
      riskLevel: record.riskAssessment.riskLevel,
      complianceScore: record.metrics.complianceScore,
      violationsCount: record.violations.length,
      activeActionsCount: record.correctiveActions.filter(a => 
        ['PENDING', 'IN_PROGRESS'].includes(a.status)
      ).length,
      financialImpact: record.financialImpact.totalCost
    }))
  };
  
  if (format === 'csv') {
    const { convertToCSV, formatComplianceForCSV } = require('../utils/csvExporter');
    const csvData = formatComplianceForCSV(complianceRecords);
    const csvContent = convertToCSV(csvData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=compliance-records.csv');
    return res.send(csvContent);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=compliance-records.json');
  }
  
  res.json({
    success: true,
    data: exportData
  });
});

module.exports = {
  getComplianceRecords,
  getComplianceRecord,
  createComplianceRecord,
  updateComplianceRecord,
  deleteComplianceRecord,
  addViolation,
  addCorrectiveAction,
  completeCorrectiveAction,
  updateComplianceStatus,
  getComplianceSummary,
  getUpcomingReviews,
  getComplianceTrends,
  getComplianceDashboard,
  exportComplianceRecords
};
