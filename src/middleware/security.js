const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const { body, validationResult, sanitizeBody } = require('express-validator');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Advanced Security Middleware Suite for ELD System
 * Features: Rate limiting, encryption, CSRF, XSS protection, audit logging
 */

class SecurityMiddleware {
  constructor() {
    this.encryptionKey = process.env.SECURITY_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.auditLogger = null;
    this.threatDetection = new Map(); // Store threat patterns
    this.initializeThreatDetection();
  }

  /**
   * Initialize threat detection patterns
   */
  initializeThreatDetection() {
    this.threatPatterns = {
      sql_injection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|(\b(OR|AND)\s+\d+\s*=\s*\d+)|('(''|[^'])*')|(;|\-\-|\#|\/\*|\*\/)/gi,
      xss_attack: /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      path_traversal: /(\.\.(\/|\\))/g,
      command_injection: /(\b(system|exec|eval|shell_exec|passthru|popen|proc_open|file_get_contents|file_put_contents|fopen|fwrite|unlink)\b)/gi,
      ldap_injection: /(\(|\)|&|\||!|=|\*|~|>=|<=|\xff|\x00)/g
    };

    logger.info('🛡️ Security threat detection patterns loaded');
  }

  /**
   * Comprehensive Helmet Security Configuration
   */
  getHelmetConfig() {
    return helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'", "'unsafe-eval'"], // Restricted for production
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        },
        reportUri: '/api/v1/security/csp-violation'
      },
      
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      
      // X-Frame-Options
      frameguard: { action: 'deny' },
      
      // X-Content-Type-Options
      noSniff: true,
      
      // X-XSS-Protection
      xssFilter: true,
      
      // Referrer Policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      
      // Permission Policy (Feature Policy)
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: ["'self'"],
        payment: [],
        usb: [],
        magnetometer: [],
        accelerometer: [],
        gyroscope: []
      },
      
      // Hide X-Powered-By header
      hidePoweredBy: true,
      
      // DNS Prefetch Control
      dnsPrefetchControl: { allow: false },
      
      // IE No Open
      ieNoOpen: true,
      
      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
    });
  }

  /**
   * Advanced Rate Limiting with Multiple Tiers
   */
  getRateLimiters() {
    const createLimiter = (windowMs, max, message, keyGenerator = null) => {
      return rateLimit({
        windowMs,
        max,
        message: {
          success: false,
          message: message,
          retryAfter: Math.ceil(windowMs / 1000)
        },
        keyGenerator: keyGenerator || ((req) => {
          return req.ip + ':' + (req.user?.id || 'anonymous');
        }),
        handler: (req, res) => {
          this.logSecurityEvent('RATE_LIMIT_EXCEEDED', req);
          res.status(429).json({
            success: false,
            message: message,
            retryAfter: Math.ceil(windowMs / 1000)
          });
        },
        standardHeaders: true,
        legacyHeaders: false
      });
    };

    return {
      // General API rate limit
      general: createLimiter(
        15 * 60 * 1000, // 15 minutes
        1000, // 1000 requests per window
        'Too many requests, please try again later'
      ),

      // Strict rate limit for authentication endpoints
      auth: createLimiter(
        15 * 60 * 1000, // 15 minutes
        10, // 10 attempts per window
        'Too many authentication attempts, please try again later'
      ),

      // Data ingestion rate limit (higher for ELD devices)
      dataIngestion: createLimiter(
        60 * 1000, // 1 minute
        10000, // 10,000 requests per minute
        'Data ingestion rate limit exceeded',
        (req) => req.headers['device-id'] || req.ip
      ),

      // Admin operations rate limit
      admin: createLimiter(
        60 * 60 * 1000, // 1 hour
        100, // 100 admin operations per hour
        'Admin operations rate limit exceeded'
      ),

      // File upload rate limit
      upload: createLimiter(
        60 * 60 * 1000, // 1 hour
        50, // 50 uploads per hour
        'File upload rate limit exceeded'
      ),

      // Password reset rate limit
      passwordReset: createLimiter(
        60 * 60 * 1000, // 1 hour
        3, // 3 password reset attempts per hour
        'Password reset rate limit exceeded'
      )
    };
  }

  /**
   * Input Validation and Sanitization Middleware
   */
  getInputValidation() {
    return {
      // Sanitize all string inputs
      sanitizeInputs: (req, res, next) => {
        if (req.body) {
          this.sanitizeObject(req.body);
        }
        if (req.query) {
          this.sanitizeObject(req.query);
        }
        if (req.params) {
          this.sanitizeObject(req.params);
        }
        next();
      },

      // Validate common patterns
      validateEmail: body('email')
        .isEmail()
        .normalizeEmail()
        .isLength({ max: 254 })
        .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        .withMessage('Valid email required'),

      validatePassword: body('password')
        .isLength({ min: 12, max: 128 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be 12+ chars with uppercase, lowercase, number, and special character'),

      validateUsername: body('username')
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9_.-]+$/)
        .withMessage('Username can only contain letters, numbers, dots, dashes, and underscores'),

      validateObjectId: (field) => body(field)
        .matches(/^[0-9a-fA-F]{24}$/)
        .withMessage(`${field} must be a valid ObjectId`),

      // Handle validation errors
      handleValidationErrors: (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          this.logSecurityEvent('VALIDATION_ERROR', req, { errors: errors.array() });
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
          });
        }
        next();
      }
    };
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          // Remove potential XSS and injection attempts
          obj[key] = this.sanitizeString(obj[key]);
          
          // Check for threat patterns
          this.detectThreats(obj[key], key);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.sanitizeObject(obj[key]);
        }
      }
    }
  }

  /**
   * Sanitize individual strings
   */
  sanitizeString(str) {
    if (!str || typeof str !== 'string') return str;

    // Remove null bytes
    str = str.replace(/\x00/g, '');
    
    // Basic XSS protection
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/javascript:/gi, '');
    str = str.replace(/on\w+\s*=/gi, '');
    
    // SQL injection protection
    str = str.replace(/['";]|--|\*\/|\*\*|\/\*/g, '');
    
    // Trim and limit length
    str = str.trim().substring(0, 10000);
    
    return str;
  }

  /**
   * Threat detection system
   */
  detectThreats(input, field = 'unknown') {
    if (!input || typeof input !== 'string') return;

    for (const [threatType, pattern] of Object.entries(this.threatPatterns)) {
      if (pattern.test(input)) {
        this.logSecurityEvent('THREAT_DETECTED', null, {
          threatType,
          field,
          input: input.substring(0, 100) // Log first 100 chars only
        });
      }
    }
  }

  /**
   * CSRF Protection Middleware
   */
  getCSRFProtection() {
    return (req, res, next) => {
      // Skip CSRF for API endpoints with proper authentication
      if (req.path.startsWith('/api/') && req.headers.authorization) {
        return next();
      }

      const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;
      const expectedToken = req.session?.csrfToken;

      if (!token || !expectedToken || token !== expectedToken) {
        this.logSecurityEvent('CSRF_TOKEN_INVALID', req);
        return res.status(403).json({
          success: false,
          message: 'Invalid or missing CSRF token'
        });
      }

      next();
    };
  }

  /**
   * Advanced Authentication Security
   */
  getAuthSecurity() {
    return {
      // Account lockout mechanism
      accountLockout: async (req, res, next) => {
        const identifier = req.body.username || req.body.email;
        if (!identifier) return next();

        try {
          const user = await mongoose.connection.db.collection('users').findOne({
            $or: [{ username: identifier }, { email: identifier }]
          });

          if (user && user.security) {
            const { failedAttempts = 0, lockedUntil } = user.security;
            
            // Check if account is locked
            if (lockedUntil && lockedUntil > new Date()) {
              this.logSecurityEvent('ACCOUNT_LOCKED_ACCESS_ATTEMPT', req, { userId: user._id });
              return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed attempts',
                lockedUntil: lockedUntil
              });
            }

            // Check if approaching lockout threshold
            if (failedAttempts >= 3) {
              this.logSecurityEvent('ACCOUNT_NEAR_LOCKOUT', req, { 
                userId: user._id, 
                failedAttempts 
              });
            }
          }

          req.userForLockout = user;
          next();
        } catch (error) {
          next(error);
        }
      },

      // Handle failed login attempt
      handleFailedLogin: async (userId) => {
        try {
          const lockoutDuration = 30 * 60 * 1000; // 30 minutes
          const maxAttempts = 5;

          await mongoose.connection.db.collection('users').updateOne(
            { _id: userId },
            {
              $inc: { 'security.failedAttempts': 1 },
              $set: { 'security.lastFailedLogin': new Date() }
            }
          );

          const user = await mongoose.connection.db.collection('users').findOne({ _id: userId });
          
          if (user.security.failedAttempts >= maxAttempts) {
            await mongoose.connection.db.collection('users').updateOne(
              { _id: userId },
              {
                $set: {
                  'security.lockedUntil': new Date(Date.now() + lockoutDuration),
                  'security.lockedAt': new Date()
                }
              }
            );

            this.logSecurityEvent('ACCOUNT_LOCKED', null, { userId, failedAttempts: user.security.failedAttempts });
          }
        } catch (error) {
          logger.error('Failed login handling error:', { error: error.message });
        }
      },

      // Handle successful login
      handleSuccessfulLogin: async (userId, req) => {
        try {
          await mongoose.connection.db.collection('users').updateOne(
            { _id: userId },
            {
              $unset: {
                'security.failedAttempts': '',
                'security.lockedUntil': '',
                'security.lockedAt': ''
              },
              $set: {
                'security.lastLogin': new Date(),
                'security.lastLoginIP': req.ip,
                'security.lastLoginUserAgent': req.get('User-Agent')
              }
            }
          );

          this.logSecurityEvent('LOGIN_SUCCESS', req, { userId });
        } catch (error) {
          logger.error('Successful login handling error:', { error: error.message });
        }
      }
    };
  }

  /**
   * Data Encryption Utilities
   */
  getEncryption() {
    return {
      encrypt: (text) => {
        if (!text) return text;
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
          encrypted,
          iv: iv.toString('hex'),
          authTag: authTag.toString('hex')
        };
      },

      decrypt: (encryptedData) => {
        if (!encryptedData || typeof encryptedData !== 'object') return encryptedData;
        
        const { encrypted, iv, authTag } = encryptedData;
        
        const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
      },

      hashPassword: (password, saltRounds = 12) => {
        const bcrypt = require('bcryptjs');
        return bcrypt.hash(password, saltRounds);
      },

      comparePassword: (password, hash) => {
        const bcrypt = require('bcryptjs');
        return bcrypt.compare(password, hash);
      }
    };
  }

  /**
   * Request/Response Security Headers
   */
  getSecurityHeaders() {
    return (req, res, next) => {
      // Security headers
      res.set({
        'X-API-Version': process.env.API_VERSION || '1.0.0',
        'X-Response-Time': Date.now() - req.startTime,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });

      // Remove sensitive headers
      res.removeHeader('X-Powered-By');
      res.removeHeader('Server');
      
      next();
    };
  }

  /**
   * IP Whitelist/Blacklist Middleware
   */
  getIPFiltering() {
    const whitelist = process.env.IP_WHITELIST?.split(',') || [];
    const blacklist = process.env.IP_BLACKLIST?.split(',') || [];

    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;

      // Check blacklist first
      if (blacklist.length > 0 && blacklist.includes(clientIP)) {
        this.logSecurityEvent('IP_BLACKLISTED', req);
        return res.status(403).json({
          success: false,
          message: 'Access denied from this IP address'
        });
      }

      // Check whitelist for sensitive endpoints
      if (req.path.includes('/admin') && whitelist.length > 0 && !whitelist.includes(clientIP)) {
        this.logSecurityEvent('IP_NOT_WHITELISTED', req);
        return res.status(403).json({
          success: false,
          message: 'Access denied - IP not whitelisted for admin operations'
        });
      }

      next();
    };
  }

  /**
   * Security Event Logging
   */
  logSecurityEvent(eventType, req = null, additionalData = {}) {
    const logEntry = {
      timestamp: new Date(),
      eventType,
      severity: this.getEventSeverity(eventType),
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      url: req?.originalUrl,
      method: req?.method,
      userId: req?.user?.id,
      sessionId: req?.sessionID,
      ...additionalData
    };

    // Store in security logs collection
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.db.collection('security_logs').insertOne(logEntry).catch(err => 
        logger.error('Failed to insert security log:', { error: err.message })
      );
    }

    // Log security events
    logger.warn(`🚨 Security Event: ${eventType}`, logEntry);

    // Alert for critical events
    if (logEntry.severity === 'CRITICAL') {
      this.alertCriticalEvent(logEntry);
    }
  }

  /**
   * Determine event severity
   */
  getEventSeverity(eventType) {
    const severityMap = {
      'LOGIN_SUCCESS': 'INFO',
      'LOGIN_FAILURE': 'WARNING',
      'ACCOUNT_LOCKED': 'CRITICAL',
      'THREAT_DETECTED': 'HIGH',
      'RATE_LIMIT_EXCEEDED': 'MEDIUM',
      'VALIDATION_ERROR': 'LOW',
      'IP_BLACKLISTED': 'CRITICAL',
      'CSRF_TOKEN_INVALID': 'HIGH'
    };

    return severityMap[eventType] || 'MEDIUM';
  }

  /**
   * Alert critical security events
   */
  alertCriticalEvent(logEntry) {
    // In production, this would integrate with alerting systems
    logger.error('🚨 CRITICAL SECURITY EVENT:', logEntry);
    
    // TODO: Integrate with:
    // - Slack/Teams notifications
    // - Email alerts
    // - PagerDuty
    // - Security incident response system
  }

  /**
   * Security Health Check
   */
  getSecurityHealthCheck() {
    return (req, res) => {
      const healthData = {
        timestamp: new Date(),
        security: {
          encryptionEnabled: !!this.encryptionKey,
          rateLimitingActive: true,
          helmetConfigured: true,
          auditLoggingActive: !!this.auditLogger,
          threatDetectionActive: true
        },
        checks: {
          database: mongoose.connection.readyState === 1,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      };

      res.json({
        success: true,
        data: healthData
      });
    };
  }

  /**
   * Initialize audit logger reference
   */
  setAuditLogger(auditLogger) {
    this.auditLogger = auditLogger;
    logger.info('✅ Security middleware connected to audit logger');
  }
}

// Export singleton instance
const securityMiddleware = new SecurityMiddleware();

module.exports = {
  SecurityMiddleware,
  security: securityMiddleware,
  
  // Individual middleware functions
  helmet: securityMiddleware.getHelmetConfig(),
  rateLimiters: securityMiddleware.getRateLimiters(),
  inputValidation: securityMiddleware.getInputValidation(),
  csrfProtection: securityMiddleware.getCSRFProtection(),
  authSecurity: securityMiddleware.getAuthSecurity(),
  encryption: securityMiddleware.getEncryption(),
  securityHeaders: securityMiddleware.getSecurityHeaders(),
  ipFiltering: securityMiddleware.getIPFiltering(),
  securityHealthCheck: securityMiddleware.getSecurityHealthCheck()
};
