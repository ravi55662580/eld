const express = require('express');
const LogBook = require('../models/LogBook');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Simple working route to get log books
router.get('/', async (req, res) => {
  try {
    console.log('Logbooks route accessed!');
    
    const logBooks = await LogBook.find({})
      .populate('driverId', 'firstName lastName')
      .populate('primaryVehicle', 'number make model')
      .populate('carrierId', 'name dotNumber')
      .sort({ date: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        logBooks,
        total: logBooks.length
      },
      message: 'Logbooks fetched successfully'
    });
  } catch (error) {
    console.error('Logbooks route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching log books',
      error: error.message
    });
  }
});

module.exports = router;
