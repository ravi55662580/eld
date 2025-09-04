const express = require('express');
const { body, param } = require('express-validator');
const {
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
} = require('../controllers/complianceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation rules
const createComplianceValidation = [
  body('complianceType').isIn([
    'HOURS_OF_SERVICE', 'DRIVER_QUALIFICATION', 'DRUG_ALCOHOL_TESTING', 'VEHICLE_MAINTENANCE',
    'HAZMAT_COMPLIANCE', 'IFTA_REPORTING', 'IRP_REGISTRATION', 'DOT_INSPECTION',
    'SAFETY_RATING', 'ELD_MANDATE', 'DRIVER_TRAINING', 'RECORD_KEEPING',
    'COMMERCIAL_DRIVERS_LICENSE', 'MEDICAL_CERTIFICATION', 'INSURANCE_REQUIREMENTS',
    'PERMITS_LICENSING', 'ENVIRONMENTAL_COMPLIANCE', 'WEIGHT_SIZE_LIMITS',
    'CARGO_SECUREMENT', 'ROADSIDE_INSPECTION', 'AUDIT_COMPLIANCE', 'OTHER'
  ]).withMessage('Valid compliance type is required'),
  body('compliancePeriod.startDate').isISO8601().withMessage('Valid start date is required'),
  body('compliancePeriod.endDate').isISO8601().withMessage('Valid end date is required'),
  body('driverId').optional().isMongoId().withMessage('Valid driver ID required'),
  body('vehicleId').optional().isMongoId().withMessage('Valid vehicle ID required')
];

const updateComplianceValidation = [
  body('complianceType').optional().isIn([
    'HOURS_OF_SERVICE', 'DRIVER_QUALIFICATION', 'DRUG_ALCOHOL_TESTING', 'VEHICLE_MAINTENANCE',
    'HAZMAT_COMPLIANCE', 'IFTA_REPORTING', 'IRP_REGISTRATION', 'DOT_INSPECTION',
    'SAFETY_RATING', 'ELD_MANDATE', 'DRIVER_TRAINING', 'RECORD_KEEPING',
    'COMMERCIAL_DRIVERS_LICENSE', 'MEDICAL_CERTIFICATION', 'INSURANCE_REQUIREMENTS',
    'PERMITS_LICENSING', 'ENVIRONMENTAL_COMPLIANCE', 'WEIGHT_SIZE_LIMITS',
    'CARGO_SECUREMENT', 'ROADSIDE_INSPECTION', 'AUDIT_COMPLIANCE', 'OTHER'
  ]).withMessage('Valid compliance type required'),
  body('status').optional().isIn(['COMPLIANT', 'NON_COMPLIANT', 'PENDING_REVIEW', 'CONDITIONAL', 'EXEMPT', 'UNKNOWN']).withMessage('Invalid status')
];

const violationValidation = [
  body('violationType').isIn([
    'HOURS_EXCEEDED', 'LOG_MISSING', 'LOG_FALSIFIED', 'DRIVER_UNQUALIFIED',
    'VEHICLE_OUT_OF_SERVICE', 'MAINTENANCE_OVERDUE', 'INSPECTION_FAILED',
    'DRUG_TEST_FAILED', 'LICENSE_EXPIRED', 'MEDICAL_EXPIRED', 'INSURANCE_LAPSED',
    'PERMIT_EXPIRED', 'WEIGHT_EXCEEDED', 'CARGO_UNSECURED', 'ELD_MALFUNCTION',
    'RECORD_INCOMPLETE', 'OTHER'
  ]).withMessage('Valid violation type is required'),
  body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid severity is required'),
  body('description').notEmpty().withMessage('Description is required')
];

const correctiveActionValidation = [
  body('actionType').isIn([
    'DRIVER_TRAINING', 'POLICY_UPDATE', 'SYSTEM_UPGRADE', 'MAINTENANCE_PERFORMED',
    'DOCUMENTATION_UPDATED', 'PROCESS_IMPROVED', 'FINE_PAID', 'LICENSE_RENEWED',
    'INSPECTION_SCHEDULED', 'OTHER'
  ]).withMessage('Valid action type is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date required'),
  body('assignedTo').optional().isMongoId().withMessage('Valid user ID required')
];

const statusUpdateValidation = [
  body('status').isIn(['COMPLIANT', 'NON_COMPLIANT', 'PENDING_REVIEW', 'CONDITIONAL', 'EXEMPT', 'UNKNOWN']).withMessage('Valid status is required'),
  body('reason').notEmpty().withMessage('Reason for status change is required')
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('Valid compliance record ID is required')
];

const actionIdValidation = [
  param('actionId').isMongoId().withMessage('Valid action ID is required')
];

// Routes

// GET /api/v1/compliance - Get all compliance records
router.get('/', getComplianceRecords);

// GET /api/v1/compliance/summary - Get compliance summary
router.get('/summary', getComplianceSummary);

// GET /api/v1/compliance/upcoming-reviews - Get upcoming reviews
router.get('/upcoming-reviews', getUpcomingReviews);

// GET /api/v1/compliance/trends - Get compliance trends
router.get('/trends', authorize('admin', 'manager'), getComplianceTrends);

// GET /api/v1/compliance/dashboard - Get compliance dashboard
router.get('/dashboard', authorize('admin', 'manager'), getComplianceDashboard);

// GET /api/v1/compliance/export - Export compliance records
router.get('/export', authorize('admin', 'manager'), exportComplianceRecords);

// GET /api/v1/compliance/:id - Get specific compliance record
router.get('/:id', mongoIdValidation, getComplianceRecord);

// POST /api/v1/compliance - Create new compliance record
router.post('/', createComplianceValidation, createComplianceRecord);

// POST /api/v1/compliance/:id/violations - Add violation to compliance record
router.post('/:id/violations', 
  [...mongoIdValidation, ...violationValidation], 
  addViolation
);

// POST /api/v1/compliance/:id/corrective-actions - Add corrective action
router.post('/:id/corrective-actions', 
  [...mongoIdValidation, ...correctiveActionValidation, authorize('admin', 'manager')], 
  addCorrectiveAction
);

// PUT /api/v1/compliance/:id - Update compliance record
router.put('/:id', 
  [...mongoIdValidation, ...updateComplianceValidation], 
  updateComplianceRecord
);

// PUT /api/v1/compliance/:id/status - Update compliance status
router.put('/:id/status', 
  [...mongoIdValidation, ...statusUpdateValidation, authorize('admin', 'manager')], 
  updateComplianceStatus
);

// PUT /api/v1/compliance/:id/corrective-actions/:actionId/complete - Complete corrective action
router.put('/:id/corrective-actions/:actionId/complete', 
  [...mongoIdValidation, ...actionIdValidation], 
  completeCorrectiveAction
);

// DELETE /api/v1/compliance/:id - Delete compliance record (admin only)
router.delete('/:id', 
  [...mongoIdValidation, authorize('admin')], 
  deleteComplianceRecord
);

module.exports = router;
