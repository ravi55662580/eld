const express = require('express');
const LogBook = require('../models/LogBook');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Simple working route to get log books
router.get('/', async (req, res) => {
  try {
    logger.info('Logbooks route accessed!');
    
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
    logger.error('Logbooks route error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching log books',
      error: error.message
    });
  }
});

module.exports = router;
