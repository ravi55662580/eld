const Report = require('../models/Report');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Get all reports for a carrier
 * GET /api/v1/reports
 */
const getReports = asyncHandler(async (req, res) => {
  let query = {};
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  // Additional filters
  const { 
    reportType,
    reportCategory,
    isScheduled,
    isTemplate,
    isArchived,
    createdBy
  } = req.query;
  
  if (reportType) query.reportType = reportType;
  if (reportCategory) query.reportCategory = reportCategory;
  if (isScheduled !== undefined) query['schedule.isScheduled'] = isScheduled === 'true';
  if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';
  if (isArchived !== undefined) query.isArchived = isArchived === 'true';
  if (createdBy) query['access.createdBy'] = createdBy;
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;
  
  const reports = await Report.find(query)
    .populate('carrierId', 'name dotNumber')
    .populate('access.createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Report.countDocuments(query);
  
  res.json({
    success: true,
    data: {
      reports,
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
 * Get a specific report
 * GET /api/v1/reports/:id
 */
const getReport = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const report = await Report.findOne(query)
    .populate('carrierId', 'name dotNumber')
    .populate('access.createdBy', 'firstName lastName')
    .populate('access.allowedUsers.userId', 'firstName lastName')
    .populate('executions.executedBy', 'firstName lastName')
    .populate('changeHistory.changedBy', 'firstName lastName');
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  // Update usage statistics
  report.usage.viewCount += 1;
  report.usage.lastAccessed = new Date();
  
  // Update user access statistics
  const userAccess = report.usage.topUsers.find(u => u.userId.toString() === req.user._id.toString());
  if (userAccess) {
    userAccess.accessCount += 1;
    userAccess.lastAccess = new Date();
  } else {
    report.usage.topUsers.push({
      userId: req.user._id,
      accessCount: 1,
      lastAccess: new Date()
    });
  }
  
  await report.save();
  
  res.json({
    success: true,
    data: { report }
  });
});

/**
 * Create a new report
 * POST /api/v1/reports
 */
const createReport = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  
  // Set carrier ID and creator from user context
  req.body.carrierId = req.user.carrierId;
  req.body.access = {
    ...req.body.access,
    createdBy: req.user._id
  };
  
  const report = await Report.create(req.body);
  
  // Populate the response
  await report.populate([
    { path: 'carrierId', select: 'name dotNumber' },
    { path: 'access.createdBy', select: 'firstName lastName' }
  ]);
  
  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: { report }
  });
});

/**
 * Update a report
 * PUT /api/v1/reports/:id
 */
const updateReport = asyncHandler(async (req, res) => {
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
  
  const existingReport = await Report.findOne(query);
  
  if (!existingReport) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  // Store previous configuration for change history
  const previousConfig = {
    configuration: existingReport.configuration,
    schedule: existingReport.schedule,
    output: existingReport.output,
    distribution: existingReport.distribution
  };
  
  // Remove fields that shouldn't be updated directly
  delete req.body.carrierId;
  delete req.body.createdAt;
  delete req.body.updatedAt;
  delete req.body.executions;
  delete req.body.usage;
  
  // Update version and add change history
  req.body.version = existingReport.version + 1;
  req.body.changeHistory = existingReport.changeHistory;
  req.body.changeHistory.push({
    version: req.body.version,
    changedBy: req.user._id,
    changeType: 'UPDATED',
    description: 'Report configuration updated',
    previousConfiguration: previousConfig
  });
  
  const report = await Report.findOneAndUpdate(query, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'carrierId', select: 'name dotNumber' },
    { path: 'access.createdBy', select: 'firstName lastName' }
  ]);
  
  res.json({
    success: true,
    message: 'Report updated successfully',
    data: { report }
  });
});

/**
 * Delete a report
 * DELETE /api/v1/reports/:id
 */
const deleteReport = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
    query['access.createdBy'] = req.user._id; // Users can only delete their own reports
  }
  
  const report = await Report.findOneAndDelete(query);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found or not authorized to delete'
    });
  }
  
  res.json({
    success: true,
    message: 'Report deleted successfully'
  });
});

/**
 * Execute a report
 * POST /api/v1/reports/:id/execute
 */
const executeReport = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const report = await Report.findOne(query);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  // Execute the report
  await report.execute(req.body.parameters || {}, req.user._id);
  
  // TODO: Implement actual report generation logic
  // This would typically:
  // 1. Query data based on report configuration
  // 2. Apply filters and aggregations
  // 3. Format data according to output settings
  // 4. Generate file (PDF, Excel, CSV, etc.)
  // 5. Store file and provide download link
  // 6. Send to distribution recipients if configured
  
  // For now, simulate execution completion
  const executionId = report.executions[report.executions.length - 1]._id;
  await report.completeExecution(executionId, {
    status: 'COMPLETED',
    recordCount: 100,
    fileSize: 1024000,
    fileName: `${report.reportName}-${new Date().toISOString().split('T')[0]}.json`,
    filePath: '/reports/generated/',
    downloadUrl: `/api/v1/reports/${report._id}/download/${executionId}`
  });
  
  res.json({
    success: true,
    message: 'Report execution started successfully',
    data: { 
      report,
      executionId
    }
  });
});

/**
 * Schedule a report
 * POST /api/v1/reports/:id/schedule
 */
const scheduleReport = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering - only managers and admins can schedule
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to schedule reports'
    });
  }
  
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const report = await Report.findOne(query);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  // Schedule the report
  await report.scheduleReport(req.body, req.user._id);
  
  res.json({
    success: true,
    message: 'Report scheduled successfully',
    data: { report }
  });
});

/**
 * Clone a report
 * POST /api/v1/reports/:id/clone
 */
const cloneReport = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const originalReport = await Report.findOne(query);
  
  if (!originalReport) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  const { newName } = req.body;
  
  if (!newName) {
    return res.status(400).json({
      success: false,
      message: 'New report name is required'
    });
  }
  
  // Clone the report
  const clonedReport = originalReport.cloneReport(newName, req.user._id);
  await clonedReport.save();
  
  // Populate the response
  await clonedReport.populate([
    { path: 'carrierId', select: 'name dotNumber' },
    { path: 'access.createdBy', select: 'firstName lastName' }
  ]);
  
  res.status(201).json({
    success: true,
    message: 'Report cloned successfully',
    data: { report: clonedReport }
  });
});

/**
 * Archive a report
 * POST /api/v1/reports/:id/archive
 */
const archiveReport = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
    query['access.createdBy'] = req.user._id;
  }
  
  const report = await Report.findOne(query);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found or not authorized'
    });
  }
  
  // Archive the report
  await report.archive(req.user._id);
  
  res.json({
    success: true,
    message: 'Report archived successfully',
    data: { report }
  });
});

/**
 * Get scheduled reports due for execution
 * GET /api/v1/reports/scheduled/due
 */
const getDueReports = asyncHandler(async (req, res) => {
  // Only admins and managers can view due reports
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view scheduled reports'
    });
  }
  
  const dueReports = await Report.getDueReports();
  
  res.json({
    success: true,
    data: { dueReports }
  });
});

/**
 * Get report statistics
 * GET /api/v1/reports/statistics
 */
const getReportStatistics = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const statistics = await Report.getReportStatistics(carrierId);
  
  res.json({
    success: true,
    data: { statistics }
  });
});

/**
 * Get popular reports
 * GET /api/v1/reports/popular
 */
const getPopularReports = asyncHandler(async (req, res) => {
  let carrierId = req.user.carrierId;
  
  // Admin can specify carrier
  if (req.user.role === 'admin' && req.query.carrierId) {
    carrierId = req.query.carrierId;
  }
  
  const { limit = 10 } = req.query;
  
  const popularReports = await Report.getPopularReports(carrierId, parseInt(limit));
  
  res.json({
    success: true,
    data: { popularReports }
  });
});

/**
 * Get report templates
 * GET /api/v1/reports/templates
 */
const getReportTemplates = asyncHandler(async (req, res) => {
  let query = { isTemplate: true, isArchived: false };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    // Show public templates and user's own templates
    query.$or = [
      { 'access.isPublic': true },
      { carrierId: req.user.carrierId }
    ];
  }
  
  const templates = await Report.find(query)
    .populate('carrierId', 'name dotNumber')
    .populate('access.createdBy', 'firstName lastName')
    .sort({ 'usage.viewCount': -1, createdAt: -1 });
  
  res.json({
    success: true,
    data: { templates }
  });
});

/**
 * Download report file
 * GET /api/v1/reports/:id/download/:executionId
 */
const downloadReport = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.carrierId = req.user.carrierId;
  }
  
  const report = await Report.findOne(query);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  const execution = report.executions.id(req.params.executionId);
  
  if (!execution) {
    return res.status(404).json({
      success: false,
      message: 'Execution not found'
    });
  }
  
  if (execution.status !== 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'Report execution not completed'
    });
  }
  
  // TODO: Implement actual file download
  // This would typically:
  // 1. Check file exists
  // 2. Set appropriate headers
  // 3. Stream file to response
  
  // For now, return file info
  res.json({
    success: true,
    message: 'File download would start here',
    data: {
      fileName: execution.fileName,
      fileSize: execution.fileSize,
      downloadUrl: execution.downloadUrl
    }
  });
});

module.exports = {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  executeReport,
  scheduleReport,
  cloneReport,
  archiveReport,
  getDueReports,
  getReportStatistics,
  getPopularReports,
  getReportTemplates,
  downloadReport
};
