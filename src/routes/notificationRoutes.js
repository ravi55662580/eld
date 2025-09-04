const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/notifications
router.get('/', asyncHandler(async (req, res) => {
  const { search, homeBase, type } = req.query;
  const query = { carrierId: req.user.carrierId };
  
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { 'emails': new RegExp(search, 'i') }
    ];
  }
  
  if (homeBase && homeBase !== 'Filter by Home Base') query.homeBase = homeBase;
  if (type) query.type = type;

  const notifications = await Notification.find(query)
    .populate('createdBy', 'firstName lastName username')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { notifications }
  });
}));

// POST /api/v1/notifications
router.post('/', asyncHandler(async (req, res) => {
  const notification = await Notification.create({
    ...req.body,
    carrierId: req.user.carrierId,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: { notification }
  });
}));

// GET /api/v1/notifications/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    carrierId: req.user.carrierId
  }).populate('createdBy', 'firstName lastName username');

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    data: { notification }
  });
}));

// PUT /api/v1/notifications/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, carrierId: req.user.carrierId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    message: 'Notification updated successfully',
    data: { notification }
  });
}));

// DELETE /api/v1/notifications/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    carrierId: req.user.carrierId
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
}));

module.exports = router;
