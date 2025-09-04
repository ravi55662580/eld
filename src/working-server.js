require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const Carrier = require('./models/Carrier');
const logger = require('./utils/logger');

const app = express();

// Connect to database
connectDB();

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const apiPrefix = '/api/v1';

// Simple health endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ELD Software API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Simple carriers endpoint without auth for testing
app.get(`${apiPrefix}/carriers`, async (req, res) => {
  try {
    logger.info('Carriers endpoint accessed');
    const carriers = await Carrier.find({}).sort({ createdAt: -1 });
    logger.info('Found carriers:', { count: carriers.length });
    
    res.json({
      success: true,
      data: { carriers }
    });
  } catch (error) {
    logger.error('Carriers route error:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error fetching carriers',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  logger.info(`Working server running on http://localhost:${PORT}`);
  logger.info(`Carriers endpoint: http://localhost:${PORT}${apiPrefix}/carriers`);
});
