const express = require('express');
const Asset = require('../models/Asset');
const { authenticate, sameCarrier } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/assets - Get all assets for user's carrier
router.get('/', asyncHandler(async (req, res) => {
  const { search, homeBase, type, active, page = 1, limit = 10 } = req.query;
  
  // Build query
  const query = {};
  
  // If user is not an admin, filter by their carrierId
  if (req.user.role !== 'admin' && req.user.carrierId) {
    query.carrierId = req.user.carrierId;
  }
  
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

  res.json({
    success: true,
    data: {
      assets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

// POST /api/v1/assets - Create new asset
router.post('/', asyncHandler(async (req, res) => {
  const assetData = {
    ...req.body,
    carrierId: req.user.carrierId
  };

  const asset = await Asset.create(assetData);

  res.status(201).json({
    success: true,
    message: 'Asset created successfully',
    data: { asset }
  });
}));

// GET /api/v1/assets/:id - Get single asset
router.get('/:id', asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  
  // If user is not an admin, filter by their carrierId
  if (req.user.role !== 'admin' && req.user.carrierId) {
    query.carrierId = req.user.carrierId;
  }
  
  const asset = await Asset.findOne(query);

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  res.json({
    success: true,
    data: { asset }
  });
}));

// PUT /api/v1/assets/:id - Update asset
router.put('/:id', asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  
  // If user is not an admin, filter by their carrierId
  if (req.user.role !== 'admin' && req.user.carrierId) {
    query.carrierId = req.user.carrierId;
  }
  
  const asset = await Asset.findOneAndUpdate(
    query,
    req.body,
    { new: true, runValidators: true }
  );

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  res.json({
    success: true,
    message: 'Asset updated successfully',
    data: { asset }
  });
}));

// DELETE /api/v1/assets/:id - Delete asset
router.delete('/:id', asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  
  // If user is not an admin, filter by their carrierId
  if (req.user.role !== 'admin' && req.user.carrierId) {
    query.carrierId = req.user.carrierId;
  }
  
  const asset = await Asset.findOneAndDelete(query);

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  res.json({
    success: true,
    message: 'Asset deleted successfully'
  });
}));

module.exports = router;
