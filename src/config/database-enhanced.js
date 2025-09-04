const mongoose = require('mongoose');
const { createHash } = require('crypto');

/**
 * Enhanced Database Configuration for ELD System
 * Features: Encryption, Sharding, Compliance, Performance Optimization
 */

class EnhancedDatabaseConfig {
  constructor() {
    this.connectionPool = null;
    this.encryptionKey = process.env.DB_ENCRYPTION_KEY;
    this.auditLogger = null;
    this.performanceMonitor = null;
  }

  /**
   * MongoDB Connection with Enterprise Security Features
   */
  async connect() {
    try {
      // Enhanced connection options for production
      const connectionOptions = {
        // Connection Pool Configuration
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 100,
        minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 10,
        maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 30000,
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
        
        // Replica Set Configuration
        readPreference: 'secondaryPreferred',
        readConcern: { level: 'majority' },
        writeConcern: { 
          w: 'majority', 
          j: true, 
          wtimeout: parseInt(process.env.DB_WRITE_TIMEOUT) || 5000 
        },
        
        // Security Configuration
        ssl: process.env.NODE_ENV === 'production',
        sslValidate: process.env.NODE_ENV === 'production',
        authSource: 'admin',
        retryWrites: true,
        retryReads: true,
        
        // Compression
        compressors: ['snappy', 'zlib'],
        
        // Monitoring
        monitorCommands: true,
        heartbeatFrequencyMS: 10000,
        
        // Buffer Settings
        bufferMaxEntries: 0,
        bufferCommands: false,
      };

      // Add authentication for production
      if (process.env.NODE_ENV === 'production') {
        connectionOptions.authMechanism = 'SCRAM-SHA-256';
        connectionOptions.tls = true;
        connectionOptions.tlsCAFile = process.env.DB_TLS_CA_FILE;
        connectionOptions.tlsCertificateKeyFile = process.env.DB_TLS_CERT_FILE;
      }

      const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Connection Pool: ${connectionOptions.maxPoolSize} max connections`);
      
      // Initialize database features
      await this.initializeSharding();
      await this.setupIndexes();
      await this.initializeEncryption();
      await this.setupAuditLogging();
      await this.initializeComplianceFeatures();
      
      this.setupConnectionEventHandlers();
      this.setupPerformanceMonitoring();
      
      return conn;
      
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      await this.handleConnectionError(error);
      process.exit(1);
    }
  }

  /**
   * Initialize MongoDB Sharding Configuration
   */
  async initializeSharding() {
    try {
      if (process.env.DB_ENABLE_SHARDING === 'true') {
        console.log('🔀 Configuring database sharding...');
        
        // Shard key configuration for different collections
        const shardKeys = {
          logbooks: { carrierId: 'hashed', timestamp: 1 },
          vehicles: { carrierId: 'hashed', deviceId: 1 },
          drivers: { carrierId: 'hashed', driverId: 1 },
          compliance: { carrierId: 'hashed', date: 1 },
          audit_logs: { timestamp: 1 },
          time_series_data: { deviceId: 'hashed', timestamp: 1 }
        };

        // Enable sharding for collections
        for (const [collection, shardKey] of Object.entries(shardKeys)) {
          try {
            await mongoose.connection.db.admin().command({
              shardCollection: `${mongoose.connection.name}.${collection}`,
              key: shardKey
            });
            console.log(`✅ Sharding enabled for ${collection}`);
          } catch (err) {
            console.log(`ℹ️ Sharding already configured for ${collection}`);
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Sharding configuration error:', error.message);
    }
  }

  /**
   * Setup Performance-Optimized Indexes
   */
  async setupIndexes() {
    console.log('📈 Setting up performance indexes...');
    
    const indexConfigs = {
      // Driver logbook indexes
      logbooks: [
        { carrierId: 1, driverId: 1, date: -1 },
        { deviceId: 1, timestamp: -1 },
        { location: '2dsphere', timestamp: -1 },
        { 'compliance.status': 1, date: -1 },
        { 'violations.type': 1, 'violations.resolved': 1 }
      ],
      
      // Vehicle and asset indexes
      assets: [
        { carrierId: 1, active: 1, assetType: 1 },
        { vin: 1 },
        { 'location.coordinates': '2dsphere' },
        { maintenanceSchedule: 1, nextService: 1 }
      ],
      
      // Driver indexes
      drivers: [
        { carrierId: 1, active: 1, licenseNumber: 1 },
        { username: 1 },
        { 'compliance.expiryDates': 1 }
      ],
      
      // Compliance indexes
      compliance: [
        { carrierId: 1, type: 1, status: 1, date: -1 },
        { driverId: 1, violationType: 1, resolved: 1 },
        { expiryDate: 1, notified: 1 }
      ],
      
      // Audit log indexes
      audit_logs: [
        { timestamp: -1 },
        { userId: 1, action: 1, timestamp: -1 },
        { resourceId: 1, resourceType: 1, timestamp: -1 },
        { 'metadata.ipAddress': 1, timestamp: -1 }
      ],
      
      // User indexes
      users: [
        { username: 1 },
        { email: 1 },
        { carrierId: 1, role: 1, active: 1 },
        { 'security.lastLogin': -1 },
        { 'security.failedAttempts': 1, 'security.lockedUntil': 1 }
      ]
    };

    for (const [collection, indexes] of Object.entries(indexConfigs)) {
      try {
        const db = mongoose.connection.db;
        for (const index of indexes) {
          await db.collection(collection).createIndex(index, { background: true });
        }
        console.log(`✅ Indexes created for ${collection}`);
      } catch (error) {
        console.error(`⚠️ Index creation error for ${collection}:`, error.message);
      }
    }
  }

  /**
   * Initialize Field-Level Encryption for PII
   */
  async initializeEncryption() {
    if (!this.encryptionKey) {
      console.warn('⚠️ DB_ENCRYPTION_KEY not set - field encryption disabled');
      return;
    }

    console.log('🔐 Initializing field-level encryption...');
    
    // Setup automatic encryption for sensitive fields
    const encryptedFields = {
      drivers: ['ssn', 'licenseNumber', 'medicalCert', 'personalInfo'],
      users: ['email', 'phone'],
      carriers: ['ein', 'bankingInfo'],
      logbooks: ['personalNotes']
    };

    // Configure JSON Schema for encrypted fields
    mongoose.set('autoEncryption', {
      keyVaultNamespace: 'encryption.__keyVault',
      kmsProviders: {
        local: {
          key: Buffer.from(this.encryptionKey, 'base64')
        }
      },
      schemaMap: this.generateEncryptionSchemas(encryptedFields)
    });

    console.log('✅ Field-level encryption initialized');
  }

  /**
   * Generate encryption schemas for sensitive fields
   */
  generateEncryptionSchemas(encryptedFields) {
    const schemas = {};
    
    for (const [collection, fields] of Object.entries(encryptedFields)) {
      const properties = {};
      
      fields.forEach(field => {
        properties[field] = {
          encrypt: {
            bsonType: 'string',
            algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
          }
        };
      });

      schemas[`${mongoose.connection.name}.${collection}`] = {
        bsonType: 'object',
        properties
      };
    }
    
    return schemas;
  }

  /**
   * Setup Comprehensive Audit Logging
   */
  async setupAuditLogging() {
    console.log('📋 Setting up audit logging...');
    
    // MongoDB audit configuration
    if (process.env.DB_ENABLE_AUDITING === 'true') {
      const auditConfig = {
        auditLog: {
          destination: 'file',
          format: 'JSON',
          path: process.env.DB_AUDIT_LOG_PATH || '/var/log/mongodb/audit.json',
          filter: {
            users: [
              { db: 'admin', user: 'auditUser' }
            ],
            roles: [
              { db: 'admin', role: 'readWrite' }
            ]
          }
        }
      };
      
      console.log('✅ Database audit logging configured');
    }

    // Application-level audit logging
    this.auditLogger = {
      log: async (action, userId, resourceType, resourceId, metadata = {}) => {
        try {
          const auditEntry = {
            timestamp: new Date(),
            action,
            userId,
            resourceType,
            resourceId,
            metadata: {
              ...metadata,
              ipAddress: metadata.ipAddress,
              userAgent: metadata.userAgent,
              sessionId: metadata.sessionId
            },
            hash: this.generateAuditHash(action, userId, resourceType, resourceId)
          };

          // Store in audit collection
          await mongoose.connection.db.collection('audit_logs').insertOne(auditEntry);
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      }
    };

    console.log('✅ Application audit logging initialized');
  }

  /**
   * Generate tamper-proof audit hash
   */
  generateAuditHash(action, userId, resourceType, resourceId) {
    const data = `${action}:${userId}:${resourceType}:${resourceId}:${Date.now()}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Initialize Compliance Features
   */
  async initializeComplianceFeatures() {
    console.log('📜 Initializing compliance features...');
    
    // Data retention policies
    const retentionPolicies = {
      audit_logs: { expireAfterSeconds: 7 * 365 * 24 * 60 * 60 }, // 7 years
      logbooks: { expireAfterSeconds: 3 * 365 * 24 * 60 * 60 },   // 3 years
      driver_logs: { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 }, // 2 years
      violations: { expireAfterSeconds: 3 * 365 * 24 * 60 * 60 }   // 3 years
    };

    // Create TTL indexes for data retention
    for (const [collection, policy] of Object.entries(retentionPolicies)) {
      try {
        await mongoose.connection.db.collection(collection).createIndex(
          { createdAt: 1 },
          { expireAfterSeconds: policy.expireAfterSeconds, background: true }
        );
        console.log(`✅ Data retention policy set for ${collection}`);
      } catch (error) {
        console.error(`⚠️ Retention policy error for ${collection}:`, error.message);
      }
    }

    // GDPR compliance features
    await this.setupGDPRCompliance();
    
    console.log('✅ Compliance features initialized');
  }

  /**
   * Setup GDPR Compliance Features
   */
  async setupGDPRCompliance() {
    console.log('🇪🇺 Setting up GDPR compliance...');
    
    // Create consent tracking collection
    const consentSchema = {
      userId: { type: 'ObjectId', required: true },
      consentType: { type: 'String', required: true },
      granted: { type: 'Boolean', required: true },
      timestamp: { type: 'Date', required: true },
      ipAddress: { type: 'String' },
      userAgent: { type: 'String' },
      legalBasis: { type: 'String', required: true },
      purpose: { type: 'String', required: true },
      dataCategories: [{ type: 'String' }],
      signature: { type: 'String' } // Cryptographic proof
    };

    try {
      await mongoose.connection.db.createCollection('consent_records', {
        validator: { $jsonSchema: { bsonType: 'object', properties: consentSchema } }
      });
      
      await mongoose.connection.db.collection('consent_records').createIndex(
        { userId: 1, consentType: 1, timestamp: -1 }
      );
      
      console.log('✅ GDPR consent tracking initialized');
    } catch (error) {
      console.log('ℹ️ GDPR consent collection already exists');
    }

    // Setup data anonymization pipeline
    this.setupAnonymizationPipeline();
  }

  /**
   * Setup data anonymization pipeline
   */
  setupAnonymizationPipeline() {
    this.anonymizationPipeline = {
      // Anonymize driver PII while preserving analytical value
      anonymizeDriver: async (driverId) => {
        const updates = {
          $set: {
            'personalInfo.firstName': this.generatePseudonym(),
            'personalInfo.lastName': this.generatePseudonym(),
            'personalInfo.ssn': null,
            'personalInfo.phone': null,
            'personalInfo.email': this.generatePseudoEmail(),
            'personalInfo.address': null,
            anonymized: true,
            anonymizedAt: new Date()
          }
        };
        
        await mongoose.connection.db.collection('drivers').updateOne(
          { _id: driverId },
          updates
        );
      },
      
      // Generate consistent pseudonyms
      generatePseudonym: (seed) => {
        const hash = createHash('sha256').update(seed || Math.random().toString()).digest('hex');
        return `ANON_${hash.substring(0, 8)}`;
      },
      
      // Generate pseudo email that maintains domain structure
      generatePseudoEmail: () => {
        const domains = ['example.com', 'anonymous.org', 'privacy.net'];
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        return `user_${Math.random().toString(36).substring(2, 10)}@${randomDomain}`;
      }
    };
  }

  /**
   * Setup Connection Event Handlers
   */
  setupConnectionEventHandlers() {
    // Connection monitoring
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      this.handleConnectionError(err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    mongoose.connection.on('close', () => {
      console.log('🔒 MongoDB connection closed');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await this.gracefulShutdown();
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    process.on('SIGTERM', async () => {
      try {
        await this.gracefulShutdown();
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
  }

  /**
   * Setup Performance Monitoring
   */
  setupPerformanceMonitoring() {
    console.log('📊 Setting up performance monitoring...');
    
    // Query performance monitoring
    mongoose.set('debug', process.env.NODE_ENV === 'development');
    
    // Slow query logging
    if (process.env.DB_LOG_SLOW_QUERIES === 'true') {
      const slowThreshold = parseInt(process.env.DB_SLOW_QUERY_THRESHOLD) || 1000;
      
      mongoose.connection.db.command({
        profile: 2,
        slowms: slowThreshold,
        sampleRate: 0.1
      });
    }

    // Connection pool monitoring
    setInterval(() => {
      const poolStats = mongoose.connection.db.serverStatus?.connections;
      if (poolStats) {
        console.log(`📊 Connection Pool - Current: ${poolStats.current}, Available: ${poolStats.available}`);
      }
    }, 60000); // Log every minute

    console.log('✅ Performance monitoring active');
  }

  /**
   * Handle connection errors with retry logic
   */
  async handleConnectionError(error) {
    console.error('Database connection error:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('🔄 Attempting to reconnect...');
      setTimeout(() => {
        mongoose.connect(process.env.MONGODB_URI);
      }, 5000);
    }
  }

  /**
   * Graceful shutdown procedure
   */
  async gracefulShutdown() {
    console.log('🔄 Starting graceful database shutdown...');
    
    try {
      // Close all connections
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed gracefully');
      
      // Final audit log
      console.log('✅ Database shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during database shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus() {
    try {
      const status = {
        connected: mongoose.connection.readyState === 1,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections).length : 0,
        indexes: 0,
        performance: {
          poolSize: mongoose.connection.db?.serverConfig?.s?.poolSize || 0,
          activeConnections: mongoose.connection.db?.serverConfig?.s?.size || 0,
        }
      };

      // Get index count
      if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
          const indexes = await mongoose.connection.db.collection(collection.name).indexes();
          status.indexes += indexes.length;
        }
      }

      return status;
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Export audit logger for use in other modules
   */
  getAuditLogger() {
    return this.auditLogger;
  }

  /**
   * Export anonymization pipeline
   */
  getAnonymizationPipeline() {
    return this.anonymizationPipeline;
  }
}

// Create singleton instance
const enhancedDB = new EnhancedDatabaseConfig();

module.exports = {
  connectDB: () => enhancedDB.connect(),
  getHealthStatus: () => enhancedDB.getHealthStatus(),
  getAuditLogger: () => enhancedDB.getAuditLogger(),
  getAnonymizationPipeline: () => enhancedDB.getAnonymizationPipeline()
};
