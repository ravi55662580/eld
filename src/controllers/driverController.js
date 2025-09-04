const Driver = require('../models/Driver');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const { applyRoleFiltering } = require('../utils/roleFiltering');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const logger = require('../utils/logger');

const getDrivers = asyncHandler(async (req, res) => {
  const { search, homeBase, active } = req.query;
  let query = {};
  
  applyRoleFiltering(query, req.user);
  
  if (search) {
    query.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { username: new RegExp(search, 'i') },
      { licenseNumber: new RegExp(search, 'i') }
    ];
  }
  
  if (homeBase && homeBase !== 'Filter by Home Base') query.homeBase = homeBase;
  if (active !== undefined) query.active = active === 'true';

  const drivers = await Driver.find(query).sort({ createdAt: -1 });

  logger.info(`Retrieved ${drivers.length} drivers for user ${req.user._id}`);
  
  res.json(successResponse({ drivers }));
});

const createDriver = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errorResponse('Validation error', errors.array()));
  }

  const driver = await Driver.create({
    ...req.body,
    carrierId: req.user.carrierId
  });

  logger.info(`Driver created: ${driver._id} by user ${req.user._id}`);

  res.status(201).json(successResponse(
    { driver },
    'Driver created successfully'
  ));
});

const getDriver = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  applyRoleFiltering(query, req.user);
  
  const driver = await Driver.findOne(query);

  if (!driver) {
    return res.status(404).json(errorResponse('Driver not found'));
  }

  res.json(successResponse({ driver }));
});

const updateDriver = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  applyRoleFiltering(query, req.user);
  
  const driver = await Driver.findOneAndUpdate(
    query,
    req.body,
    { new: true, runValidators: true }
  );

  if (!driver) {
    return res.status(404).json(errorResponse('Driver not found'));
  }

  logger.info(`Driver updated: ${driver._id} by user ${req.user._id}`);

  res.json(successResponse(
    { driver },
    'Driver updated successfully'
  ));
});

const deleteDriver = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  applyRoleFiltering(query, req.user);
  
  const driver = await Driver.findOneAndDelete(query);

  if (!driver) {
    return res.status(404).json(errorResponse('Driver not found'));
  }

  logger.info(`Driver deleted: ${driver._id} by user ${req.user._id}`);

  res.json(successResponse(
    null,
    'Driver deleted successfully'
  ));
});

module.exports = {
  getDrivers,
  createDriver,
  getDriver,
  updateDriver,
  deleteDriver
};
