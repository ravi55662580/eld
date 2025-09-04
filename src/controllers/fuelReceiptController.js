const FuelReceipt = require('../models/FuelReceipt');
const Driver = require('../models/Driver');
const Asset = require('../models/Asset');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Get all fuel receipts for a carrier
 * GET /api/v1/fuel-receipts
 */
const getFuelReceipts = asyncHandler(async (req, res) => {
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
    state, 
    vendor,
    fuelType,
    minAmount,
    maxAmount,
    isDuplicate,
    isDisputed
  } = req.query;
  
  if (driverId) query.driverId = driverId;
  if (vehicleId) query.vehicleId = vehicleId;
  if (state) query.location.state = state;
  if (vendor) query.vendor.name = new RegExp(vendor, 'i');
  if (fuelType) query.fuelType = fuelType;
  if (isDuplicate !== undefined) query.isDuplicate = isDuplicate === 'true';
  if (isDisputed !== undefined) query.isDisputed = isDisputed === 'true';
  
  if (startDate && endDate) {
    query.purchaseDateTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (minAmount || maxAmount) {
    query.totalAmount = {};
    if (minAmount) query.totalAmount.$gte = parseFloat(minAmount);
    if (maxAmount) query.totalAmount.$lte = parseFloat(maxAmount);
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;
  
  const fuelReceipts = await FuelReceipt.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin')
    .populate('carrierId', 'name dotNumber')
    .sort({ purchaseDateTime: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await FuelReceipt.countDocuments(query);
  
  res.json({
    success: true,
    data: {
      fuelReceipts,
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
 * Get a specific fuel receipt
 * GET /api/v1/fuel-receipts/:id
 */
const getFuelReceipt = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const fuelReceipt = await FuelReceipt.findOne(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin make model')
    .populate('carrierId', 'name dotNumber');
  
  if (!fuelReceipt) {
    return res.status(404).json({
      success: false,
      message: 'Fuel receipt not found'
    });
  }
  
  res.json({
    success: true,
    data: { fuelReceipt }
  });
});

/**
 * Create a new fuel receipt
 * POST /api/v1/fuel-receipts
 */
const createFuelReceipt = asyncHandler(async (req, res) => {
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
  
  const fuelReceipt = await FuelReceipt.create(req.body);
  
  // Populate the response
  await fuelReceipt.populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' },
    { path: 'carrierId', select: 'name dotNumber' }
  ]);
  
  res.status(201).json({
    success: true,
    message: 'Fuel receipt created successfully',
    data: { fuelReceipt }
  });
});

/**
 * Update a fuel receipt
 * PUT /api/v1/fuel-receipts/:id
 */
const updateFuelReceipt = asyncHandler(async (req, res) => {
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
  
  const fuelReceipt = await FuelReceipt.findOneAndUpdate(query, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'driverId', select: 'firstName lastName licenseNumber' },
    { path: 'vehicleId', select: 'vehicleNumber vin' },
    { path: 'carrierId', select: 'name dotNumber' }
  ]);
  
  if (!fuelReceipt) {
    return res.status(404).json({
      success: false,
      message: 'Fuel receipt not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Fuel receipt updated successfully',
    data: { fuelReceipt }
  });
});

/**
 * Delete a fuel receipt
 * DELETE /api/v1/fuel-receipts/:id
 */
const deleteFuelReceipt = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only admins and managers can delete
  if (req.user.role !== 'admin') {
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete fuel receipts'
      });
    }
    query.carrierId = req.user.carrierId;
  }
  
  const fuelReceipt = await FuelReceipt.findOneAndDelete(query);
  
  if (!fuelReceipt) {
    return res.status(404).json({
      success: false,
      message: 'Fuel receipt not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Fuel receipt deleted successfully'
  });
});

/**
 * Flag fuel receipt as duplicate
 * POST /api/v1/fuel-receipts/:id/flag-duplicate
 */
const flagDuplicate = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const fuelReceipt = await FuelReceipt.findOne(query);
  
  if (!fuelReceipt) {
    return res.status(404).json({
      success: false,
      message: 'Fuel receipt not found'
    });
  }
  
  // Flag as duplicate
  await fuelReceipt.flagAsDuplicate(req.user._id, req.body.reason);
  
  res.json({
    success: true,
    message: 'Fuel receipt flagged as duplicate',
    data: { fuelReceipt }
  });
});

/**
 * Resolve duplicate flag
 * POST /api/v1/fuel-receipts/:id/resolve-duplicate
 */
const resolveDuplicate = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only managers and admins can resolve
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to resolve duplicate flags'
    });
  }
  
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const fuelReceipt = await FuelReceipt.findOne(query);
  
  if (!fuelReceipt) {
    return res.status(404).json({
      success: false,
      message: 'Fuel receipt not found'
    });
  }
  
  // Resolve duplicate
  await fuelReceipt.resolveDuplicate(req.user._id, req.body.resolution, req.body.notes);
  
  res.json({
    success: true,
    message: 'Duplicate flag resolved',
    data: { fuelReceipt }
  });
});

/**
 * Dispute fuel receipt
 * POST /api/v1/fuel-receipts/:id/dispute
 */
const disputeFuelReceipt = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const fuelReceipt = await FuelReceipt.findOne(query);
  
  if (!fuelReceipt) {
    return res.status(404).json({
      success: false,
      message: 'Fuel receipt not found'
    });
  }
  
  // Dispute the receipt
  await fuelReceipt.dispute(req.user._id, req.body.reason, req.body.description);
  
  res.json({
    success: true,
    message: 'Fuel receipt disputed successfully',
    data: { fuelReceipt }
  });
});

/**
 * Get fuel statistics
 * GET /api/v1/fuel-receipts/statistics
 */
const getFuelStatistics = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { startDate, endDate, driverId, vehicleId } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  const statistics = await FuelReceipt.getFuelStatistics(carrierId, start, end, driverId, vehicleId);
  
  res.json({
    success: true,
    data: { statistics }
  });
});

/**
 * Get IFTA summary
 * GET /api/v1/fuel-receipts/ifta-summary
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
  
  const summary = await FuelReceipt.getIFTASummary(carrierId, parseInt(year), quarter);
  
  res.json({
    success: true,
    data: { summary }
  });
});

/**
 * Get duplicate detection results
 * GET /api/v1/fuel-receipts/duplicates
 */
const getDuplicates = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { startDate, endDate, includeResolved = false } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  const duplicates = await FuelReceipt.findPotentialDuplicates(carrierId, start, end);
  
  // Filter out resolved duplicates if not requested
  let filteredDuplicates = duplicates;
  if (!includeResolved) {
    filteredDuplicates = duplicates.filter(group => 
      group.receipts.some(receipt => receipt.isDuplicate && !receipt.duplicateInfo.isResolved)
    );
  }
  
  res.json({
    success: true,
    data: { 
      duplicates: filteredDuplicates,
      total: filteredDuplicates.length
    }
  });
});

/**
 * Get fuel efficiency report
 * GET /api/v1/fuel-receipts/efficiency-report
 */
const getEfficiencyReport = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { startDate, endDate, groupBy = 'vehicle' } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  const report = await FuelReceipt.getEfficiencyReport(carrierId, start, end, groupBy);
  
  res.json({
    success: true,
    data: { report }
  });
});

/**
 * Get fuel spending trends
 * GET /api/v1/fuel-receipts/spending-trends
 */
const getSpendingTrends = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { months = 6, groupBy = 'month' } = req.query;
  
  const trends = await FuelReceipt.getSpendingTrends(carrierId, parseInt(months), groupBy);
  
  res.json({
    success: true,
    data: { trends }
  });
});

/**
 * Upload fuel receipt image
 * POST /api/v1/fuel-receipts/:id/upload-image
 */
const uploadReceiptImage = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const fuelReceipt = await FuelReceipt.findOne(query);
  
  if (!fuelReceipt) {
    return res.status(404).json({
      success: false,
      message: 'Fuel receipt not found'
    });
  }
  
  // TODO: Implement file upload logic
  // This would typically use multer middleware and cloud storage
  
  const { filename, fileSize, uploadPath } = req.body;
  
  fuelReceipt.attachments.push({
    type: 'IMAGE',
    filename,
    fileSize,
    uploadPath,
    uploadedBy: req.user._id,
    uploadedAt: new Date()
  });
  
  await fuelReceipt.save();
  
  res.json({
    success: true,
    message: 'Receipt image uploaded successfully',
    data: { fuelReceipt }
  });
});

/**
 * Export fuel receipts
 * GET /api/v1/fuel-receipts/export
 */
const exportFuelReceipts = asyncHandler(async (req, res) => {
  let query = {};
  
  // Role-based filtering
  if (req.user.role === 'driver') {
    query.driverId = req.user.driverId;
  } else if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const { startDate, endDate, format = 'json', state, driverId, vehicleId } = req.query;
  
  if (startDate && endDate) {
    query.purchaseDateTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (state) query['location.state'] = state;
  if (driverId) query.driverId = driverId;
  if (vehicleId) query.vehicleId = vehicleId;
  
  const fuelReceipts = await FuelReceipt.find(query)
    .populate('driverId', 'firstName lastName licenseNumber')
    .populate('vehicleId', 'vehicleNumber vin')
    .populate('carrierId', 'name dotNumber')
    .sort({ purchaseDateTime: -1 });
  
  // Format for export
  const exportData = {
    exportDate: new Date().toISOString(),
    totalRecords: fuelReceipts.length,
    dateRange: {
      start: startDate,
      end: endDate
    },
    totalAmount: fuelReceipts.reduce((sum, receipt) => sum + receipt.totalAmount, 0),
    totalGallons: fuelReceipts.reduce((sum, receipt) => sum + receipt.quantity.gallons, 0),
    fuelReceipts: fuelReceipts.map(receipt => ({
      receiptNumber: receipt.receiptNumber,
      purchaseDateTime: receipt.purchaseDateTime,
      driver: {
        firstName: receipt.driverId.firstName,
        lastName: receipt.driverId.lastName,
        licenseNumber: receipt.driverId.licenseNumber
      },
      vehicle: receipt.vehicleId ? {
        vehicleNumber: receipt.vehicleId.vehicleNumber,
        vin: receipt.vehicleId.vin
      } : null,
      location: receipt.location,
      vendor: receipt.vendor,
      fuelType: receipt.fuelType,
      quantity: receipt.quantity,
      pricing: receipt.pricing,
      totalAmount: receipt.totalAmount,
      taxes: receipt.taxes,
      payment: receipt.payment,
      odometer: receipt.odometer,
      isDuplicate: receipt.isDuplicate,
      isDisputed: receipt.isDisputed
    }))
  };
  
  if (format === 'csv') {
    // TODO: Implement CSV export
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fuel-receipts.csv');
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=fuel-receipts.json');
  }
  
  res.json({
    success: true,
    data: exportData
  });
});

module.exports = {
  getFuelReceipts,
  getFuelReceipt,
  createFuelReceipt,
  updateFuelReceipt,
  deleteFuelReceipt,
  flagDuplicate,
  resolveDuplicate,
  disputeFuelReceipt,
  getFuelStatistics,
  getIFTASummary,
  getDuplicates,
  getEfficiencyReport,
  getSpendingTrends,
  uploadReceiptImage,
  exportFuelReceipts
};
