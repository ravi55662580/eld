require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

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
  console.log('Loading logbooks routes...');
  const logBookRoutes = require('./routes/logBookRoutes');
  console.log('Logbook routes object:', typeof logBookRoutes, Object.keys(logBookRoutes));
  console.log('Registering logbooks routes at:', `${apiPrefix}/logbooks`);
  app.use(`${apiPrefix}/logbooks`, logBookRoutes);
  console.log('✅ Logbooks routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load logbooks routes:', error.message);
  console.error('Full error:', error);
}

try {
  app.use(`${apiPrefix}/dvirs`, require('./routes/dvirRoutes'));
} catch (error) {
  console.error('❌ Failed to load DVIR routes:', error.message);
}

try {
  app.use(`${apiPrefix}/fuel-receipts`, require('./routes/fuelReceiptRoutes'));
} catch (error) {
  console.error('❌ Failed to load fuel receipts routes:', error.message);
}

try {
  app.use(`${apiPrefix}/violations`, require('./routes/violationRoutes'));
} catch (error) {
  console.error('❌ Failed to load violations routes:', error.message);
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
    if (middleware.route) {
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
  console.log(`
🚛 ELD Software API Server
📡 Running in ${process.env.NODE_ENV} mode
🌐 Server: http://localhost:${PORT}
📚 API: http://localhost:${PORT}${apiPrefix}
❤️  Health: http://localhost:${PORT}/health
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
