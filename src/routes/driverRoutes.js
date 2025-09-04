const express = require('express');
const Driver = require('../models/Driver');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/drivers
router.get('/', asyncHandler(async (req, res) => {
  const { search, homeBase, active } = req.query;
  const query = {};
  
  // If user is not an admin, filter by their carrierId
  if (req.user.role !== 'admin' && req.user.carrierId) {
    query.carrierId = req.user.carrierId;
  }
  
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

  res.json({
    success: true,
    data: { drivers }
  });
}));

// POST /api/v1/drivers
router.post('/', asyncHandler(async (req, res) => {
  const driver = await Driver.create({
    ...req.body,
    carrierId: req.user.carrierId
  });

  res.status(201).json({
    success: true,
    message: 'Driver created successfully',
    data: { driver }
  });
}));

// GET /api/v1/drivers/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  
  // If user is not an admin, filter by their carrierId
  if (req.user.role !== 'admin' && req.user.carrierId) {
    query.carrierId = req.user.carrierId;
  }
  
  const driver = await Driver.findOne(query);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
  }

  res.json({
    success: true,
    data: { driver }
  });
}));

// PUT /api/v1/drivers/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  
  // If user is not an admin, filter by their carrierId
  if (req.user.role !== 'admin' && req.user.carrierId) {
    query.carrierId = req.user.carrierId;
  }
  
  const driver = await Driver.findOneAndUpdate(
    query,
    req.body,
    { new: true, runValidators: true }
  );

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
  }

  res.json({
    success: true,
    message: 'Driver updated successfully',
    data: { driver }
  });
}));

// DELETE /api/v1/drivers/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  
  // If user is not an admin, filter by their carrierId
  if (req.user.role !== 'admin' && req.user.carrierId) {
    query.carrierId = req.user.carrierId;
  }
  
  const driver = await Driver.findOneAndDelete(query);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
  }

  res.json({
    success: true,
    message: 'Driver deleted successfully'
  });
}));

module.exports = router;
