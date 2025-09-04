const express = require('express');
const { body, param } = require('express-validator');
const {
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
} = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation rules
const createReportValidation = [
  body('reportName').trim().notEmpty().withMessage('Report name is required'),
  body('reportType').isIn([
    'HOURS_OF_SERVICE', 'DRIVER_LOG', 'VEHICLE_USAGE', 'FUEL_EFFICIENCY',
    'COMPLIANCE_SUMMARY', 'IFTA_QUARTERLY', 'DVIR_SUMMARY', 'VIOLATION_REPORT',
    'SAFETY_METRICS', 'MAINTENANCE_DUE', 'DRIVER_SCORECARD', 'ASSET_UTILIZATION',
    'ROUTE_ANALYSIS', 'COST_ANALYSIS', 'INSPECTION_HISTORY', 'DRUG_ALCOHOL_TESTING',
    'TRAINING_COMPLETION', 'DOCUMENT_EXPIRATION', 'PERFORMANCE_DASHBOARD',
    'REGULATORY_FILING', 'CUSTOM_REPORT'
  ]).withMessage('Valid report type is required'),
  body('reportCategory').isIn(['OPERATIONAL', 'COMPLIANCE', 'FINANCIAL', 'SAFETY', 'MAINTENANCE', 'REGULATORY']).withMessage('Valid report category is required'),
  body('reportDescription').optional().trim().notEmpty().withMessage('Description cannot be empty if provided')
];

const updateReportValidation = [
  body('reportName').optional().trim().notEmpty().withMessage('Report name cannot be empty'),
  body('reportType').optional().isIn([
    'HOURS_OF_SERVICE', 'DRIVER_LOG', 'VEHICLE_USAGE', 'FUEL_EFFICIENCY',
    'COMPLIANCE_SUMMARY', 'IFTA_QUARTERLY', 'DVIR_SUMMARY', 'VIOLATION_REPORT',
    'SAFETY_METRICS', 'MAINTENANCE_DUE', 'DRIVER_SCORECARD', 'ASSET_UTILIZATION',
    'ROUTE_ANALYSIS', 'COST_ANALYSIS', 'INSPECTION_HISTORY', 'DRUG_ALCOHOL_TESTING',
    'TRAINING_COMPLETION', 'DOCUMENT_EXPIRATION', 'PERFORMANCE_DASHBOARD',
    'REGULATORY_FILING', 'CUSTOM_REPORT'
  ]).withMessage('Valid report type required'),
  body('reportCategory').optional().isIn(['OPERATIONAL', 'COMPLIANCE', 'FINANCIAL', 'SAFETY', 'MAINTENANCE', 'REGULATORY']).withMessage('Valid report category required')
];

const scheduleReportValidation = [
  body('frequency').isIn(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']).withMessage('Valid frequency is required'),
  body('scheduledTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
  body('timezone').optional().notEmpty().withMessage('Timezone cannot be empty if provided'),
  body('isActive').optional().isBoolean().withMessage('Active status must be boolean')
];

const executeReportValidation = [
  body('parameters').optional().isObject().withMessage('Parameters must be an object')
];

const cloneReportValidation = [
  body('newName').trim().notEmpty().withMessage('New report name is required')
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('Valid report ID is required')
];

const executionIdValidation = [
  param('executionId').isMongoId().withMessage('Valid execution ID is required')
];

// Routes

// GET /api/v1/reports - Get all reports
router.get('/', getReports);

// GET /api/v1/reports/statistics - Get report statistics
router.get('/statistics', getReportStatistics);

// GET /api/v1/reports/popular - Get popular reports
router.get('/popular', getPopularReports);

// GET /api/v1/reports/templates - Get report templates
router.get('/templates', getReportTemplates);

// GET /api/v1/reports/scheduled/due - Get scheduled reports due for execution
router.get('/scheduled/due', authorize('admin', 'manager'), getDueReports);

// GET /api/v1/reports/:id - Get specific report
router.get('/:id', mongoIdValidation, getReport);

// GET /api/v1/reports/:id/download/:executionId - Download report file
router.get('/:id/download/:executionId', 
  [...mongoIdValidation, ...executionIdValidation], 
  downloadReport
);

// POST /api/v1/reports - Create new report
router.post('/', createReportValidation, createReport);

// POST /api/v1/reports/:id/execute - Execute report
router.post('/:id/execute', 
  [...mongoIdValidation, ...executeReportValidation], 
  executeReport
);

// POST /api/v1/reports/:id/schedule - Schedule report
router.post('/:id/schedule', 
  [...mongoIdValidation, ...scheduleReportValidation, authorize('admin', 'manager')], 
  scheduleReport
);

// POST /api/v1/reports/:id/clone - Clone report
router.post('/:id/clone', 
  [...mongoIdValidation, ...cloneReportValidation], 
  cloneReport
);

// POST /api/v1/reports/:id/archive - Archive report
router.post('/:id/archive', mongoIdValidation, archiveReport);

// PUT /api/v1/reports/:id - Update report
router.put('/:id', 
  [...mongoIdValidation, ...updateReportValidation], 
  updateReport
);

// DELETE /api/v1/reports/:id - Delete report
router.delete('/:id', mongoIdValidation, deleteReport);

module.exports = router;
