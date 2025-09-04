const express = require('express');
const { body, param } = require('express-validator');
const {
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
} = require('../controllers/stateMileageController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation rules
const createStateMileageValidation = [
  body('driverId').isMongoId().withMessage('Valid driver ID is required'),
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID is required'),
  body('state').isLength({ min: 2, max: 2 }).withMessage('Valid state code is required'),
  body('reportingPeriod.year').isInt({ min: 2020, max: 2050 }).withMessage('Valid year is required'),
  body('reportingPeriod.quarter').isIn(['Q1', 'Q2', 'Q3', 'Q4']).withMessage('Valid quarter is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('totalMiles').optional().isFloat({ min: 0 }).withMessage('Total miles must be non-negative')
];

const updateStateMileageValidation = [
  body('totalMiles').optional().isFloat({ min: 0 }).withMessage('Total miles must be non-negative'),
  body('iftaMiles').optional().isFloat({ min: 0 }).withMessage('IFTA miles must be non-negative'),
  body('nonIftaMiles').optional().isFloat({ min: 0 }).withMessage('Non-IFTA miles must be non-negative'),
  body('totalGallonsPurchased').optional().isFloat({ min: 0 }).withMessage('Gallons must be non-negative')
];

const tripSegmentValidation = [
  body('startLocation.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid start latitude required'),
  body('startLocation.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid start longitude required'),
  body('endLocation.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid end latitude required'),
  body('endLocation.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid end longitude required'),
  body('miles').isFloat({ min: 0 }).withMessage('Miles must be non-negative'),
  body('startTime').isISO8601().withMessage('Valid start time required'),
  body('endTime').isISO8601().withMessage('Valid end time required')
];

const fuelPurchaseValidation = [
  body('purchaseDate').isISO8601().withMessage('Valid purchase date required'),
  body('gallons').isFloat({ min: 0 }).withMessage('Gallons must be non-negative'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be non-negative'),
  body('location.city').notEmpty().withMessage('Purchase city is required')
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('Valid state mileage record ID is required')
];

// Routes

// GET /api/v1/state-mileage - Get all state mileage records
router.get('/', getStateMileageRecords);

// GET /api/v1/state-mileage/ifta-summary - Get IFTA summary
router.get('/ifta-summary', getIFTASummary);

// GET /api/v1/state-mileage/statistics - Get mileage statistics
router.get('/statistics', getMileageStatistics);

// GET /api/v1/state-mileage/quarterly-status - Get quarterly report status
router.get('/quarterly-status', getQuarterlyStatus);

// GET /api/v1/state-mileage/export - Export IFTA data
router.get('/export', authorize('admin', 'manager'), exportIFTAData);

// GET /api/v1/state-mileage/:id - Get specific state mileage record
router.get('/:id', mongoIdValidation, getStateMileageRecord);

// POST /api/v1/state-mileage - Create new state mileage record
router.post('/', createStateMileageValidation, createStateMileageRecord);

// POST /api/v1/state-mileage/:id/trip-segments - Add trip segment
router.post('/:id/trip-segments', 
  [...mongoIdValidation, ...tripSegmentValidation], 
  addTripSegment
);

// POST /api/v1/state-mileage/:id/fuel-purchases - Add fuel purchase
router.post('/:id/fuel-purchases', 
  [...mongoIdValidation, ...fuelPurchaseValidation], 
  addFuelPurchase
);

// POST /api/v1/state-mileage/:id/submit - Submit state mileage record
router.post('/:id/submit', mongoIdValidation, submitStateMileageRecord);

// POST /api/v1/state-mileage/:id/validate - Validate data quality
router.post('/:id/validate', mongoIdValidation, validateDataQuality);

// PUT /api/v1/state-mileage/:id - Update state mileage record
router.put('/:id', 
  [...mongoIdValidation, ...updateStateMileageValidation], 
  updateStateMileageRecord
);

// DELETE /api/v1/state-mileage/:id - Delete state mileage record (admin/manager only)
router.delete('/:id', 
  [...mongoIdValidation, authorize('admin', 'manager')], 
  deleteStateMileageRecord
);

module.exports = router;
