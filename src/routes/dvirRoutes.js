const express = require('express');
const { body, param } = require('express-validator');
const {
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
} = require('../controllers/dvirController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation rules
const createDVIRValidation = [
  body('driverId').isMongoId().withMessage('Valid driver ID is required'),
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID is required'),
  body('inspectionDate').isISO8601().withMessage('Valid inspection date is required'),
  body('inspectionType').isIn(['PRE_TRIP', 'POST_TRIP', 'INTERMEDIATE']).withMessage('Valid inspection type is required'),
  body('odometer').optional().isNumeric().withMessage('Odometer must be a number'),
  body('location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required')
];

const updateDVIRValidation = [
  body('inspectionDate').optional().isISO8601().withMessage('Valid inspection date required'),
  body('inspectionType').optional().isIn(['PRE_TRIP', 'POST_TRIP', 'INTERMEDIATE']).withMessage('Valid inspection type required'),
  body('odometer').optional().isNumeric().withMessage('Odometer must be a number'),
  body('status').optional().isIn(['IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED']).withMessage('Invalid status')
];

const addDefectValidation = [
  body('component').notEmpty().withMessage('Component is required'),
  body('defectType').notEmpty().withMessage('Defect type is required'),
  body('severity').isIn(['MINOR', 'MAJOR', 'CRITICAL']).withMessage('Valid severity is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('isOutOfService').optional().isBoolean().withMessage('Out of service must be boolean'),
  body('estimatedCost').optional().isNumeric().withMessage('Estimated cost must be a number')
];

const updateDefectValidation = [
  body('status').optional().isIn(['IDENTIFIED', 'IN_REPAIR', 'REPAIRED', 'VERIFIED']).withMessage('Valid status required'),
  body('repairDescription').optional().notEmpty().withMessage('Repair description cannot be empty'),
  body('actualCost').optional().isNumeric().withMessage('Actual cost must be a number')
];

const signDVIRValidation = [
  body('signature').notEmpty().withMessage('Signature is required'),
  body('signatureMethod').optional().isIn(['ELECTRONIC', 'WET_SIGNATURE', 'PIN']).withMessage('Valid signature method required')
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('Valid DVIR ID is required')
];

const defectIdValidation = [
  param('defectId').isMongoId().withMessage('Valid defect ID is required')
];

// Routes

// GET /api/v1/dvirs - Get all DVIRs
router.get('/', getDVIRs);

// GET /api/v1/dvirs/statistics - Get DVIR statistics
router.get('/statistics', getDVIRStatistics);

// GET /api/v1/dvirs/outstanding-defects - Get outstanding defects
router.get('/outstanding-defects', getOutstandingDefects);

// GET /api/v1/dvirs/compliance-report - Get compliance report
router.get('/compliance-report', authorize('admin', 'manager'), getComplianceReport);

// GET /api/v1/dvirs/defect-trends - Get defect trends
router.get('/defect-trends', authorize('admin', 'manager'), getDefectTrends);

// GET /api/v1/dvirs/export - Export DVIRs
router.get('/export', authorize('admin', 'manager'), exportDVIRs);

// GET /api/v1/dvirs/:id - Get specific DVIR
router.get('/:id', mongoIdValidation, getDVIR);

// POST /api/v1/dvirs - Create new DVIR
router.post('/', createDVIRValidation, createDVIR);

// POST /api/v1/dvirs/:id/defects - Add defect to DVIR
router.post('/:id/defects', 
  [...mongoIdValidation, ...addDefectValidation], 
  addDefect
);

// POST /api/v1/dvirs/:id/sign - Sign DVIR
router.post('/:id/sign', 
  [...mongoIdValidation, ...signDVIRValidation], 
  signDVIR
);

// POST /api/v1/dvirs/:id/approve - Approve DVIR (manager/admin only)
router.post('/:id/approve', 
  [...mongoIdValidation, authorize('admin', 'manager')], 
  approveDVIR
);

// PUT /api/v1/dvirs/:id - Update DVIR
router.put('/:id', 
  [...mongoIdValidation, ...updateDVIRValidation], 
  updateDVIR
);

// PUT /api/v1/dvirs/:id/defects/:defectId - Update defect
router.put('/:id/defects/:defectId', 
  [...mongoIdValidation, ...defectIdValidation, ...updateDefectValidation], 
  updateDefect
);

// DELETE /api/v1/dvirs/:id - Delete DVIR (admin/manager only)
router.delete('/:id', 
  [...mongoIdValidation, authorize('admin', 'manager')], 
  deleteDVIR
);

module.exports = router;
