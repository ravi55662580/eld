require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Auth and base routes
app.use(`${apiPrefix}/auth`, require('./routes/authRoutes'));
app.use(`${apiPrefix}/carriers`, require('./routes/carrierRoutes'));
app.use(`${apiPrefix}/drivers`, require('./routes/driverRoutes'));
app.use(`${apiPrefix}/assets`, require('./routes/assetRoutes'));
app.use(`${apiPrefix}/notifications`, require('./routes/notificationRoutes'));

// ELD core routes with error handling
try {
  logger.debug('Loading logbooks routes...');
  const logBookRoutes = require('./routes/logBookRoutes');
  logger.debug('Logbook routes object:', { type: typeof logBookRoutes, keys: Object.keys(logBookRoutes) });
  logger.debug('Registering logbooks routes at:', `${apiPrefix}/logbooks`);
  app.use(`${apiPrefix}/logbooks`, logBookRoutes);
  logger.info('✅ Logbooks routes loaded successfully');
} catch (error) {
  logger.error('❌ Failed to load logbooks routes:', { error: error.message, stack: error.stack });
}

try {
  app.use(`${apiPrefix}/dvirs`, require('./routes/dvirRoutes'));
} catch (error) {
  logger.error('❌ Failed to load DVIR routes:', { error: error.message });
}

try {
  app.use(`${apiPrefix}/fuel-receipts`, require('./routes/fuelReceiptRoutes'));
} catch (error) {
  logger.error('❌ Failed to load fuel receipts routes:', { error: error.message });
}

try {
  app.use(`${apiPrefix}/violations`, require('./routes/violationRoutes'));
} catch (error) {
  logger.error('❌ Failed to load violations routes:', { error: error.message });
}

// IFTA and compliance routes
app.use(`${apiPrefix}/state-mileage`, require('./routes/stateMileageRoutes'));
app.use(`${apiPrefix}/compliance`, require('./routes/complianceRoutes'));
app.use(`${apiPrefix}/reports`, require('./routes/reportRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ELD Software API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
app.get(`${apiPrefix}`, (req, res) => {
  // List all registered routes for debugging
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route && middleware.route.path) {
      routes.push(middleware.route.path);
    } else if (middleware.name === 'router' && middleware.regexp) {
      const path = middleware.regexp.toString().match(/\\\/([^\\\\]+)/)?.[1] || 'unknown';
      routes.push('/' + path);
    }
  });
  
  res.json({
    success: true,
    message: 'ELD Software API v1',
    endpoints: {
      // Authentication and management
      auth: `${apiPrefix}/auth`,
      carriers: `${apiPrefix}/carriers`,
      drivers: `${apiPrefix}/drivers`,
      assets: `${apiPrefix}/assets`,
      notifications: `${apiPrefix}/notifications`,
      
      // ELD core functionality
      logbooks: `${apiPrefix}/logbooks`,
      dvirs: `${apiPrefix}/dvirs`,
      fuelReceipts: `${apiPrefix}/fuel-receipts`,
      violations: `${apiPrefix}/violations`,
      
      // IFTA and compliance
      stateMileage: `${apiPrefix}/state-mileage`,
      compliance: `${apiPrefix}/compliance`,
      reports: `${apiPrefix}/reports`
    },
    registeredRoutes: routes,
    docs: `${apiPrefix}/docs`
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚛 ELD Software API Server`);
  logger.info(`📡 Running in ${process.env.NODE_ENV} mode`);
  logger.info(`🌐 Server: http://localhost:${PORT}`);
  logger.info(`📚 API: http://localhost:${PORT}${apiPrefix}`);
  logger.info(`❤️  Health: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', { error: err.message, stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = app;
