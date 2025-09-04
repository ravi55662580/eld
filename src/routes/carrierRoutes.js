const express = require('express');
const Carrier = require('../models/Carrier');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/carriers
router.get('/', asyncHandler(async (req, res) => {
  const query = req.user.role === 'admin' ? {} : { _id: req.user.carrierId };
  const carriers = await Carrier.find(query).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { carriers }
  });
}));

// POST /api/v1/carriers
router.post('/', authorize('admin'), asyncHandler(async (req, res) => {
  const carrier = await Carrier.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Carrier created successfully',
    data: { carrier }
  });
}));

// GET /api/v1/carriers/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const query = req.user.role === 'admin' 
    ? { _id: req.params.id }
    : { _id: req.params.id, _id: req.user.carrierId };
    
  const carrier = await Carrier.findOne(query);

  if (!carrier) {
    return res.status(404).json({
      success: false,
      message: 'Carrier not found'
    });
  }

  res.json({
    success: true,
    data: { carrier }
  });
}));

// PUT /api/v1/carriers/:id
router.put('/:id', authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const query = req.user.role === 'admin' 
    ? { _id: req.params.id }
    : { _id: req.params.id, _id: req.user.carrierId };

  const carrier = await Carrier.findOneAndUpdate(query, req.body, {
    new: true,
    runValidators: true
  });

  if (!carrier) {
    return res.status(404).json({
      success: false,
      message: 'Carrier not found'
    });
  }

  res.json({
    success: true,
    message: 'Carrier updated successfully',
    data: { carrier }
  });
}));

module.exports = router;
