const express = require('express');
const { body, param } = require('express-validator');
const {
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
} = require('../controllers/violationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation rules
const createViolationValidation = [
  body('violationType').isIn([
    'HOS_VIOLATION', 'DRUG_ALCOHOL', 'VEHICLE_MAINTENANCE', 'DRIVER_QUALIFICATION', 
    'ELD_TECHNICAL', 'HAZMAT', 'WEIGHT_SIZE', 'DVIR_VIOLATION', 'OTHER'
  ]).withMessage('Valid violation type is required'),
  body('violationDate').isISO8601().withMessage('Valid violation date is required'),
  body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid severity is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('driverId').optional().isMongoId().withMessage('Valid driver ID required'),
  body('vehicleId').optional().isMongoId().withMessage('Valid vehicle ID required'),
  body('location.state').optional().isLength({ min: 2, max: 2 }).withMessage('Valid state code required')
];

const updateViolationValidation = [
  body('violationDate').optional().isISO8601().withMessage('Valid violation date required'),
  body('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid severity required'),
  body('status').optional().isIn(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CONTESTED', 'DISMISSED']).withMessage('Invalid status')
];

const resolveViolationValidation = [
  body('resolution').notEmpty().withMessage('Resolution is required'),
  body('notes').optional().notEmpty().withMessage('Notes cannot be empty if provided')
];

const contestViolationValidation = [
  body('reason').notEmpty().withMessage('Contest reason is required'),
  body('evidence').optional().notEmpty().withMessage('Evidence cannot be empty if provided')
];

const correctiveActionValidation = [
  body('actionType').isIn([
    'DRIVER_TRAINING', 'POLICY_UPDATE', 'SYSTEM_UPGRADE', 'MAINTENANCE',
    'DOCUMENTATION', 'FINE_PAYMENT', 'OTHER'
  ]).withMessage('Valid action type is required'),
  body('description').notEmpty().withMessage('Action description is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date required'),
  body('assignedTo').optional().isMongoId().withMessage('Valid user ID for assignment required')
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('Valid violation ID is required')
];

const driverIdValidation = [
  param('driverId').isMongoId().withMessage('Valid driver ID is required')
];

// Routes

// GET /api/v1/violations - Get all violations
router.get('/', getViolations);

// GET /api/v1/violations/statistics - Get violation statistics
router.get('/statistics', getViolationStatistics);

// GET /api/v1/violations/trends - Get violation trends
router.get('/trends', authorize('admin', 'manager'), getViolationTrends);

// GET /api/v1/violations/export - Export violations
router.get('/export', authorize('admin', 'manager'), exportViolations);

// GET /api/v1/violations/safety-score/:driverId - Get driver safety score
router.get('/safety-score/:driverId', driverIdValidation, getDriverSafetyScore);

// GET /api/v1/violations/:id - Get specific violation
router.get('/:id', mongoIdValidation, getViolation);

// POST /api/v1/violations - Create new violation
router.post('/', createViolationValidation, createViolation);

// POST /api/v1/violations/:id/resolve - Resolve violation
router.post('/:id/resolve', 
  [...mongoIdValidation, ...resolveViolationValidation], 
  resolveViolation
);

// POST /api/v1/violations/:id/contest - Contest violation
router.post('/:id/contest', 
  [...mongoIdValidation, ...contestViolationValidation], 
  contestViolation
);

// POST /api/v1/violations/:id/corrective-actions - Add corrective action
router.post('/:id/corrective-actions', 
  [...mongoIdValidation, ...correctiveActionValidation, authorize('admin', 'manager')], 
  addCorrectiveAction
);

// PUT /api/v1/violations/:id - Update violation
router.put('/:id', 
  [...mongoIdValidation, ...updateViolationValidation], 
  updateViolation
);

// DELETE /api/v1/violations/:id - Delete violation (admin only)
router.delete('/:id', 
  [...mongoIdValidation, authorize('admin')], 
  deleteViolation
);

module.exports = router;
