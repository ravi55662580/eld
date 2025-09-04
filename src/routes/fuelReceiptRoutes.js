const express = require('express');
const { body, param } = require('express-validator');
const {
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
} = require('../controllers/fuelReceiptController');
const { authenticate, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/fileUpload');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation rules
const createFuelReceiptValidation = [
  body('driverId').isMongoId().withMessage('Valid driver ID is required'),
  body('vehicleId').optional().isMongoId().withMessage('Valid vehicle ID required'),
  body('purchaseDateTime').isISO8601().withMessage('Valid purchase date/time is required'),
  body('receiptNumber').notEmpty().withMessage('Receipt number is required'),
  body('quantity.gallons').isFloat({ min: 0 }).withMessage('Gallons must be a positive number'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('vendor.name').notEmpty().withMessage('Vendor name is required'),
  body('location.state').isLength({ min: 2, max: 2 }).withMessage('Valid state code is required'),
  body('fuelType').isIn(['DIESEL', 'GASOLINE', 'DEF']).withMessage('Valid fuel type is required')
];

const updateFuelReceiptValidation = [
  body('purchaseDateTime').optional().isISO8601().withMessage('Valid purchase date/time required'),
  body('quantity.gallons').optional().isFloat({ min: 0 }).withMessage('Gallons must be positive'),
  body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Total amount must be positive'),
  body('fuelType').optional().isIn(['DIESEL', 'GASOLINE', 'DEF']).withMessage('Valid fuel type required')
];

const disputeValidation = [
  body('reason').notEmpty().withMessage('Dispute reason is required'),
  body('description').notEmpty().withMessage('Dispute description is required')
];

const flagDuplicateValidation = [
  body('reason').notEmpty().withMessage('Duplicate reason is required')
];

const resolveDuplicateValidation = [
  body('resolution').isIn(['KEEP_ORIGINAL', 'KEEP_DUPLICATE', 'MERGE', 'DELETE_DUPLICATE']).withMessage('Valid resolution required'),
  body('notes').optional().notEmpty().withMessage('Notes cannot be empty if provided')
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('Valid fuel receipt ID is required')
];

// Routes

// GET /api/v1/fuel-receipts - Get all fuel receipts
router.get('/', getFuelReceipts);

// GET /api/v1/fuel-receipts/statistics - Get fuel statistics
router.get('/statistics', getFuelStatistics);

// GET /api/v1/fuel-receipts/ifta-summary - Get IFTA summary
router.get('/ifta-summary', getIFTASummary);

// GET /api/v1/fuel-receipts/duplicates - Get duplicate detection results
router.get('/duplicates', getDuplicates);

// GET /api/v1/fuel-receipts/efficiency-report - Get fuel efficiency report
router.get('/efficiency-report', getEfficiencyReport);

// GET /api/v1/fuel-receipts/spending-trends - Get fuel spending trends
router.get('/spending-trends', getSpendingTrends);

// GET /api/v1/fuel-receipts/export - Export fuel receipts
router.get('/export', authorize('admin', 'manager'), exportFuelReceipts);

// GET /api/v1/fuel-receipts/:id - Get specific fuel receipt
router.get('/:id', mongoIdValidation, getFuelReceipt);

// POST /api/v1/fuel-receipts - Create new fuel receipt
router.post('/', createFuelReceiptValidation, createFuelReceipt);

// POST /api/v1/fuel-receipts/:id/flag-duplicate - Flag as duplicate
router.post('/:id/flag-duplicate', 
  [...mongoIdValidation, ...flagDuplicateValidation], 
  flagDuplicate
);

// POST /api/v1/fuel-receipts/:id/resolve-duplicate - Resolve duplicate flag
router.post('/:id/resolve-duplicate', 
  [...mongoIdValidation, ...resolveDuplicateValidation, authorize('admin', 'manager')], 
  resolveDuplicate
);

// POST /api/v1/fuel-receipts/:id/dispute - Dispute fuel receipt
router.post('/:id/dispute', 
  [...mongoIdValidation, ...disputeValidation], 
  disputeFuelReceipt
);

// POST /api/v1/fuel-receipts/:id/upload-image - Upload receipt image
router.post('/:id/upload-image', mongoIdValidation, upload.single('receiptImage'), handleUploadError, uploadReceiptImage);

// PUT /api/v1/fuel-receipts/:id - Update fuel receipt
router.put('/:id', 
  [...mongoIdValidation, ...updateFuelReceiptValidation], 
  updateFuelReceipt
);

// DELETE /api/v1/fuel-receipts/:id - Delete fuel receipt (admin/manager only)
router.delete('/:id', 
  [...mongoIdValidation, authorize('admin', 'manager')], 
  deleteFuelReceipt
);

module.exports = router;
