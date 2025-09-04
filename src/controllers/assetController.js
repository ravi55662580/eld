const Asset = require('../models/Asset');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const { applyRoleFiltering } = require('../utils/roleFiltering');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const logger = require('../utils/logger');

const getAssets = asyncHandler(async (req, res) => {
  const { search, homeBase, type, active, page = 1, limit = 10 } = req.query;
  
  let query = {};
  
  applyRoleFiltering(query, req.user);
  
  if (search) {
    query.$or = [
      { number: new RegExp(search, 'i') },
      { vin: new RegExp(search, 'i') },
      { plate: new RegExp(search, 'i') },
      { make: new RegExp(search, 'i') },
      { model: new RegExp(search, 'i') }
    ];
  }
  
  if (homeBase && homeBase !== 'Filter by Home Base') query.homeBase = homeBase;
  if (type && type !== 'Filter by Asset Type') query.type = type;
  if (active !== undefined) query.active = active === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const assets = await Asset.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await Asset.countDocuments(query);

  logger.info(`Retrieved ${assets.length} assets for user ${req.user._id}`);

  res.json(successResponse({
    assets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }));
});

const createAsset = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errorResponse('Validation error', errors.array()));
  }

  const assetData = {
    ...req.body,
    carrierId: req.user.carrierId
  };

  const asset = await Asset.create(assetData);

  logger.info(`Asset created: ${asset._id} by user ${req.user._id}`);

  res.status(201).json(successResponse(
    { asset },
    'Asset created successfully'
  ));
});

const getAsset = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  applyRoleFiltering(query, req.user);
  
  const asset = await Asset.findOne(query);

  if (!asset) {
    return res.status(404).json(errorResponse('Asset not found'));
  }

  res.json(successResponse({ asset }));
});

const updateAsset = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  applyRoleFiltering(query, req.user);
  
  const asset = await Asset.findOneAndUpdate(
    query,
    req.body,
    { new: true, runValidators: true }
  );

  if (!asset) {
    return res.status(404).json(errorResponse('Asset not found'));
  }

  logger.info(`Asset updated: ${asset._id} by user ${req.user._id}`);

  res.json(successResponse(
    { asset },
    'Asset updated successfully'
  ));
});

const deleteAsset = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  
  applyRoleFiltering(query, req.user);
  
  const asset = await Asset.findOneAndDelete(query);

  if (!asset) {
    return res.status(404).json(errorResponse('Asset not found'));
  }

  logger.info(`Asset deleted: ${asset._id} by user ${req.user._id}`);

  res.json(successResponse(
    null,
    'Asset deleted successfully'
  ));
});

module.exports = {
  getAssets,
  createAsset,
  getAsset,
  updateAsset,
  deleteAsset
};
