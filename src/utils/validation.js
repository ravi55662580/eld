const { body, param, query } = require('express-validator');
const { ROLES, ASSET_TYPES, FUEL_TYPES, DUTY_STATUSES, INSPECTION_TYPES } = require('./constants');

const validateObjectId = (fieldName) => {
  return param(fieldName).isMongoId().withMessage(`Invalid ${fieldName} format`);
};

const validateDateRange = () => {
  return [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format')
  ];
};

const validatePagination = () => {
  return [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ];
};

const validateDriverCreation = () => {
  return [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
    body('homeBase').optional().isIn(['Home Terminal', 'Other Terminal']).withMessage('Invalid home base'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean')
  ];
};

const validateAssetCreation = () => {
  return [
    body('type').isIn(Object.values(ASSET_TYPES)).withMessage('Invalid asset type'),
    body('number').trim().notEmpty().withMessage('Asset number is required'),
    body('vin').isLength({ min: 17, max: 17 }).matches(/^[A-HJ-NPR-Z0-9]{17}$/).withMessage('Invalid VIN format'),
    body('fuelType').isIn(Object.values(FUEL_TYPES)).withMessage('Invalid fuel type'),
    body('registrationState').isLength({ min: 2, max: 2 }).withMessage('Invalid state format')
  ];
};

const validateLogBookCreation = () => {
  return [
    body('driverId').isMongoId().withMessage('Invalid driver ID'),
    body('vehicleId').optional().isMongoId().withMessage('Invalid vehicle ID'),
    body('logDate').isISO8601().withMessage('Invalid log date format'),
    body('dutyEvents').isArray().withMessage('Duty events must be an array'),
    body('dutyEvents.*.eventType').isIn(Object.values(DUTY_STATUSES)).withMessage('Invalid event type'),
    body('dutyEvents.*.timestamp').isISO8601().withMessage('Invalid timestamp format')
  ];
};

const validateDVIRCreation = () => {
  return [
    body('driverId').isMongoId().withMessage('Invalid driver ID'),
    body('vehicleId').isMongoId().withMessage('Invalid vehicle ID'),
    body('inspectionDate').isISO8601().withMessage('Invalid inspection date format'),
    body('inspectionType').isIn(Object.values(INSPECTION_TYPES)).withMessage('Invalid inspection type'),
    body('defects').optional().isArray().withMessage('Defects must be an array')
  ];
};

module.exports = {
  validateObjectId,
  validateDateRange,
  validatePagination,
  validateDriverCreation,
  validateAssetCreation,
  validateLogBookCreation,
  validateDVIRCreation
};
