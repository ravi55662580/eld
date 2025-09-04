const mongoose = require('mongoose');
const { createHash, randomBytes } = require('crypto');
const logger = require('../utils/logger');

/**
 * Comprehensive Compliance and Audit Service
 * Features: GDPR, CCPA, FMCSA compliance, audit trails, data governance
 */

class ComplianceService {
  constructor() {
    this.complianceFrameworks = {
      GDPR: {
        dataRetention: {
          personalData: 365 * 2, // 2 years default
          consentRecords: 365 * 7, // 7 years
          auditLogs: 365 * 7 // 7 years
        },
        dataSubjectRights: [
          'access', 'rectification', 'erasure', 'portability', 
          'restriction', 'objection', 'automated_decision_making'
        ],
        legalBases: [
          'consent', 'contract', 'legal_obligation', 'vital_interests',
          'public_task', 'legitimate_interests'
        ]
      },
      CCPA: {
        dataRetention: {
          personalInfo: 365 * 2, // 2 years
          saleRecords: 365 * 2, // 2 years
          requestLogs: 365 * 2 // 2 years
        },
        consumerRights: [
          'know', 'delete', 'opt_out', 'non_discrimination'
        ]
      },
      FMCSA: {
        dataRetention: {
          eldRecords: 365 * 3, // 3 years
          driverLogs: 365 * 3, // 3 years
          inspectionReports: 365 * 3, // 3 years
          maintenanceRecords: 365 * 1 // 1 year
        },
        requiredData: [
          'date', 'time', 'location', 'engine_hours', 'vehicle_miles',
          'driver_identification', 'co_driver_identification'
        ]
      }
    };

    this.auditLogger = null;
    this.privacyControls = null;
    this.initializeCompliance();
  }

  /**
   * Initialize compliance systems
   */
  async initializeCompliance() {
    await this.setupAuditSystem();
    await this.setupPrivacyControls();
    await this.setupDataGovernance();
    await this.setupComplianceMonitoring();
    
    logger.info('✅ Compliance service initialized');
  }

  /**
   * Setup comprehensive audit system
   */
  async setupAuditSystem() {
    this.auditLogger = {
      // Log compliance-related events
      logComplianceEvent: async (eventType, userId, details = {}) => {
        const auditEntry = {
          timestamp: new Date(),
          eventType,
          category: 'compliance',
          userId,
          details,
          hash: this.generateAuditHash(eventType, userId, details),
          compliance: {
            gdpr: this.isGDPRRelevant(eventType, details),
            ccpa: this.isCCPARelevant(eventType, details),
            fmcsa: this.isFMCSARelevant(eventType, details)
          }
        };

        await this.storeAuditLog(auditEntry);
        return auditEntry;
      },

      // Log data access events
      logDataAccess: async (userId, dataType, resourceId, operation, metadata = {}) => {
        return await this.auditLogger.logComplianceEvent('DATA_ACCESS', userId, {
          dataType,
          resourceId,
          operation,
          metadata,
          timestamp: new Date(),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        });
      },

      // Log consent changes
      logConsentChange: async (userId, consentType, granted, legalBasis, metadata = {}) => {
        return await this.auditLogger.logComplianceEvent('CONSENT_CHANGE', userId, {
          consentType,
          granted,
          legalBasis,
          metadata,
          previousConsent: await this.getPreviousConsent(userId, consentType)
        });
      },

      // Log data subject requests
      logDataSubjectRequest: async (userId, requestType, status, details = {}) => {
        return await this.auditLogger.logComplianceEvent('DATA_SUBJECT_REQUEST', userId, {
          requestType,
          status,
          details,
          processingTime: details.processingTime,
          outcome: details.outcome
        });
      }
    };

    logger.info('✅ Audit system configured');
  }

  /**
   * Setup privacy controls and data subject rights
   */
  async setupPrivacyControls() {
    this.privacyControls = {
      // Handle GDPR data subject access request
      handleAccessRequest: async (userId, requestData = {}) => {
        const startTime = new Date();
        
        try {
          // Validate request
          await this.validateDataSubjectRequest(userId, 'access', requestData);
          
          // Collect all personal data
          const personalData = await this.collectPersonalData(userId);
          
          // Generate portable data export
          const dataExport = await this.generateDataExport(personalData);
          
          // Log the request
          await this.auditLogger.logDataSubjectRequest(userId, 'access', 'completed', {
            processingTime: Date.now() - startTime.getTime(),
            dataPoints: Object.keys(personalData).length,
            outcome: 'data_provided'
          });

          return {
            success: true,
            requestId: this.generateRequestId(),
            data: dataExport,
            processingTime: Date.now() - startTime.getTime()
          };
        } catch (error) {
          await this.auditLogger.logDataSubjectRequest(userId, 'access', 'failed', {
            processingTime: Date.now() - startTime.getTime(),
            error: error.message,
            outcome: 'request_failed'
          });
          throw error;
        }
      },

      // Handle GDPR erasure request (Right to be forgotten)
      handleErasureRequest: async (userId, requestData = {}) => {
        const startTime = new Date();
        
        try {
          // Validate erasure request
          await this.validateErasureRequest(userId, requestData);
          
          // Check if erasure is permissible
          const erasureCheck = await this.checkErasurePermissibility(userId);
          
          if (!erasureCheck.canErase) {
            throw new Error(`Erasure not permitted: ${erasureCheck.reason}`);
          }

          // Perform anonymization instead of deletion (preserve analytical value)
          const anonymizationResult = await this.anonymizePersonalData(userId);
          
          // Log the request
          await this.auditLogger.logDataSubjectRequest(userId, 'erasure', 'completed', {
            processingTime: Date.now() - startTime.getTime(),
            anonymizedRecords: anonymizationResult.recordsAffected,
            outcome: 'data_anonymized'
          });

          return {
            success: true,
            requestId: this.generateRequestId(),
            result: 'data_anonymized',
            recordsAffected: anonymizationResult.recordsAffected,
            processingTime: Date.now() - startTime.getTime()
          };
        } catch (error) {
          await this.auditLogger.logDataSubjectRequest(userId, 'erasure', 'failed', {
            processingTime: Date.now() - startTime.getTime(),
            error: error.message,
            outcome: 'request_failed'
          });
          throw error;
        }
      },

      // Handle data rectification request
      handleRectificationRequest: async (userId, rectificationData, requestData = {}) => {
        const startTime = new Date();
        
        try {
          // Validate rectification request
          await this.validateRectificationData(userId, rectificationData);
          
          // Apply rectifications
          const updateResult = await this.rectifyPersonalData(userId, rectificationData);
          
          // Log the request
          await this.auditLogger.logDataSubjectRequest(userId, 'rectification', 'completed', {
            processingTime: Date.now() - startTime.getTime(),
            fieldsUpdated: Object.keys(rectificationData),
            recordsUpdated: updateResult.recordsAffected,
            outcome: 'data_rectified'
          });

          return {
            success: true,
            requestId: this.generateRequestId(),
            fieldsUpdated: Object.keys(rectificationData),
            recordsAffected: updateResult.recordsAffected,
            processingTime: Date.now() - startTime.getTime()
          };
        } catch (error) {
          await this.auditLogger.logDataSubjectRequest(userId, 'rectification', 'failed', {
            processingTime: Date.now() - startTime.getTime(),
            error: error.message,
            outcome: 'request_failed'
          });
          throw error;
        }
      },

      // Handle data portability request
      handlePortabilityRequest: async (userId, format = 'json', requestData = {}) => {
        const startTime = new Date();
        
        try {
          // Collect portable data
          const portableData = await this.collectPortableData(userId);
          
          // Format data according to request
          const formattedData = await this.formatPortableData(portableData, format);
          
          // Log the request
          await this.auditLogger.logDataSubjectRequest(userId, 'portability', 'completed', {
            processingTime: Date.now() - startTime.getTime(),
            format: format,
            dataSize: JSON.stringify(formattedData).length,
            outcome: 'data_exported'
          });

          return {
            success: true,
            requestId: this.generateRequestId(),
            data: formattedData,
            format: format,
            processingTime: Date.now() - startTime.getTime()
          };
        } catch (error) {
          await this.auditLogger.logDataSubjectRequest(userId, 'portability', 'failed', {
            processingTime: Date.now() - startTime.getTime(),
            error: error.message,
            outcome: 'request_failed'
          });
          throw error;
        }
      }
    };

    logger.info('✅ Privacy controls configured');
  }

  /**
   * Setup data governance framework
   */
  async setupDataGovernance() {
    this.dataGovernance = {
      // Classify data according to sensitivity
      classifyData: async (dataType, content) => {
        const classifications = {
          'PII': ['ssn', 'license_number', 'email', 'phone', 'address'],
          'SENSITIVE': ['medical_cert', 'background_check', 'financial_info'],
          'OPERATIONAL': ['location', 'speed', 'engine_data', 'fuel_usage'],
          'PUBLIC': ['company_info', 'vehicle_specs', 'routes']
        };

        for (const [level, fields] of Object.entries(classifications)) {
          if (fields.some(field => dataType.toLowerCase().includes(field))) {
            return level;
          }
        }

        return 'OPERATIONAL'; // Default classification
      },

      // Apply data retention policies
      applyRetentionPolicies: async () => {
        const policies = this.complianceFrameworks;
        const currentDate = new Date();

        for (const [framework, config] of Object.entries(policies)) {
          for (const [dataType, retentionDays] of Object.entries(config.dataRetention)) {
            const cutoffDate = new Date(currentDate.getTime() - (retentionDays * 24 * 60 * 60 * 1000));
            
            await this.archiveExpiredData(dataType, cutoffDate, framework);
          }
        }
      },

      // Monitor data processing activities
      monitorProcessingActivities: async () => {
        const activities = await this.getProcessingActivities();
        
        for (const activity of activities) {
          // Check for compliance violations
          const violations = await this.checkComplianceViolations(activity);
          
          if (violations.length > 0) {
            await this.handleComplianceViolations(violations);
          }
        }
      }
    };

    logger.info('✅ Data governance configured');
  }

  /**
   * Setup compliance monitoring and alerting
   */
  async setupComplianceMonitoring() {
    this.complianceMonitor = {
      // Monitor for potential violations
      monitorCompliance: async () => {
        const checks = [
          this.checkDataRetentionCompliance(),
          this.checkConsentCompliance(),
          this.checkAccessLogCompliance(),
          this.checkFMCSACompliance()
        ];

        const results = await Promise.all(checks);
        
        for (const result of results) {
          if (result.violations.length > 0) {
            await this.handleViolations(result.violations);
          }
        }

        return results;
      },

      // Generate compliance reports
      generateComplianceReport: async (framework, startDate, endDate) => {
        const report = {
          framework,
          period: { startDate, endDate },
          generated: new Date(),
          metrics: {},
          violations: [],
          recommendations: []
        };

        switch (framework.toUpperCase()) {
          case 'GDPR':
            report.metrics = await this.generateGDPRMetrics(startDate, endDate);
            break;
          case 'CCPA':
            report.metrics = await this.generateCCPAMetrics(startDate, endDate);
            break;
          case 'FMCSA':
            report.metrics = await this.generateFMCSAMetrics(startDate, endDate);
            break;
        }

        // Store report
        await this.storeComplianceReport(report);
        
        return report;
      },

      // Alert on critical compliance issues
      alertComplianceIssue: async (issueType, severity, details) => {
        const alert = {
          timestamp: new Date(),
          issueType,
          severity,
          details,
          framework: this.determineRelevantFramework(issueType),
          escalationLevel: this.determineEscalationLevel(severity),
          autoRemediation: await this.attemptAutoRemediation(issueType, details)
        };

        // Store alert
        await this.storeComplianceAlert(alert);
        
        // Send notifications
        await this.sendComplianceNotifications(alert);
        
        return alert;
      }
    };

    // Schedule periodic compliance checks
    this.scheduleComplianceChecks();
    
    logger.info('✅ Compliance monitoring configured');
  }

  /**
   * FMCSA specific compliance functions
   */
  async checkFMCSACompliance() {
    const violations = [];
    
    // Check for required data elements
    const requiredElements = this.complianceFrameworks.FMCSA.requiredData;
    const recentLogs = await this.getRecentDriverLogs(7); // Last 7 days
    
    for (const log of recentLogs) {
      for (const element of requiredElements) {
        if (!log[element] && log[element] !== 0) {
          violations.push({
            type: 'missing_required_data',
            severity: 'HIGH',
            logId: log._id,
            missingElement: element,
            framework: 'FMCSA'
          });
        }
      }
    }

    // Check for edit compliance
    const editsToCheck = await this.getRecentLogEdits(30); // Last 30 days
    
    for (const edit of editsToCheck) {
      if (!await this.validateFMCSAEdit(edit)) {
        violations.push({
          type: 'invalid_edit',
          severity: 'MEDIUM',
          editId: edit._id,
          reason: edit.reason,
          framework: 'FMCSA'
        });
      }
    }

    return { framework: 'FMCSA', violations };
  }

  /**
   * GDPR specific functions
   */
  async generateGDPRMetrics(startDate, endDate) {
    return {
      dataSubjectRequests: {
        total: await this.countDataSubjectRequests(startDate, endDate),
        byType: await this.countRequestsByType(startDate, endDate),
        averageProcessingTime: await this.getAverageProcessingTime(startDate, endDate),
        completionRate: await this.getRequestCompletionRate(startDate, endDate)
      },
      consentMetrics: {
        totalConsents: await this.countActiveConsents(),
        withdrawnConsents: await this.countWithdrawnConsents(startDate, endDate),
        consentsByPurpose: await this.countConsentsByPurpose()
      },
      breachMetrics: {
        totalBreaches: await this.countSecurityBreaches(startDate, endDate),
        notifiedBreaches: await this.countNotifiedBreaches(startDate, endDate),
        averageNotificationTime: await this.getAverageNotificationTime(startDate, endDate)
      },
      dataProcessingMetrics: {
        personalDataVolume: await this.calculatePersonalDataVolume(),
        retentionCompliance: await this.checkRetentionCompliance(),
        minimizationCompliance: await this.checkDataMinimizationCompliance()
      }
    };
  }

  /**
   * Consent management functions
   */
  async recordConsent(userId, consentType, granted, legalBasis, purpose, metadata = {}) {
    const consentRecord = {
      userId: new mongoose.Types.ObjectId(userId),
      consentType,
      granted,
      legalBasis,
      purpose,
      timestamp: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      consentString: metadata.consentString,
      signature: this.generateConsentSignature(userId, consentType, granted, legalBasis),
      dataCategories: metadata.dataCategories || [],
      processingPurposes: Array.isArray(purpose) ? purpose : [purpose],
      withdrawable: legalBasis === 'consent',
      expiryDate: this.calculateConsentExpiry(consentType, legalBasis)
    };

    // Store consent record
    await mongoose.connection.db.collection('consent_records').insertOne(consentRecord);
    
    // Log consent change
    await this.auditLogger.logConsentChange(userId, consentType, granted, legalBasis, metadata);
    
    // Update user consent status
    await this.updateUserConsentStatus(userId, consentType, granted);
    
    return consentRecord;
  }

  async withdrawConsent(userId, consentType, reason, metadata = {}) {
    // Record withdrawal
    const withdrawalRecord = await this.recordConsent(userId, consentType, false, 'consent', 'withdrawal', {
      ...metadata,
      withdrawalReason: reason,
      originalConsentDate: await this.getOriginalConsentDate(userId, consentType)
    });

    // Handle data processing implications
    await this.handleConsentWithdrawal(userId, consentType);
    
    return withdrawalRecord;
  }

  /**
   * Data anonymization functions
   */
  async anonymizePersonalData(userId) {
    const collections = ['drivers', 'users', 'logbooks', 'violations'];
    let totalRecordsAffected = 0;

    for (const collection of collections) {
      const result = await this.anonymizeCollectionData(collection, userId);
      totalRecordsAffected += result.modifiedCount;
    }

    // Mark user as anonymized
    await mongoose.connection.db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { 
        $set: { 
          anonymized: true,
          anonymizedAt: new Date(),
          anonymizationReason: 'data_subject_request'
        } 
      }
    );

    return {
      recordsAffected: totalRecordsAffected,
      anonymizedAt: new Date(),
      method: 'pseudonymization'
    };
  }

  async anonymizeCollectionData(collection, userId) {
    const anonymizationRules = this.getAnonymizationRules(collection);
    const updateFields = {};

    for (const [field, rule] of Object.entries(anonymizationRules)) {
      updateFields[field] = this.applyAnonymizationRule(rule);
    }

    updateFields.anonymized = true;
    updateFields.anonymizedAt = new Date();

    return await mongoose.connection.db.collection(collection).updateMany(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: updateFields }
    );
  }

  /**
   * Utility functions
   */
  generateAuditHash(eventType, userId, details) {
    const data = `${eventType}:${userId}:${JSON.stringify(details)}:${Date.now()}`;
    return createHash('sha256').update(data).digest('hex');
  }

  generateRequestId() {
    return `REQ_${Date.now()}_${randomBytes(8).toString('hex').toUpperCase()}`;
  }

  generateConsentSignature(userId, consentType, granted, legalBasis) {
    const data = `${userId}:${consentType}:${granted}:${legalBasis}:${Date.now()}`;
    return createHash('sha256').update(data).digest('hex');
  }

  isGDPRRelevant(eventType, details) {
    const gdprEvents = [
      'DATA_ACCESS', 'CONSENT_CHANGE', 'DATA_SUBJECT_REQUEST', 
      'PERSONAL_DATA_PROCESSING', 'DATA_BREACH'
    ];
    return gdprEvents.includes(eventType);
  }

  isCCPARelevant(eventType, details) {
    const ccpaEvents = [
      'PERSONAL_INFO_COLLECTION', 'DATA_SALE', 'CONSUMER_REQUEST',
      'OPT_OUT_REQUEST'
    ];
    return ccpaEvents.includes(eventType);
  }

  isFMCSARelevant(eventType, details) {
    const fmcsaEvents = [
      'ELD_DATA_RECORD', 'DRIVER_LOG_EDIT', 'INSPECTION_REPORT',
      'VIOLATION_RECORD', 'MAINTENANCE_RECORD'
    ];
    return fmcsaEvents.includes(eventType);
  }

  async storeAuditLog(auditEntry) {
    try {
      await mongoose.connection.db.collection('audit_logs').insertOne(auditEntry);
    } catch (error) {
      logger.error('Failed to store audit log:', { error: error.message });
    }
  }

  async storeComplianceReport(report) {
    try {
      await mongoose.connection.db.collection('compliance_reports').insertOne(report);
    } catch (error) {
      logger.error('Failed to store compliance report:', { error: error.message });
    }
  }

  async storeComplianceAlert(alert) {
    try {
      await mongoose.connection.db.collection('compliance_alerts').insertOne(alert);
    } catch (error) {
      logger.error('Failed to store compliance alert:', { error: error.message });
    }
  }

  /**
   * Schedule periodic compliance tasks
   */
  scheduleComplianceChecks() {
    // Daily compliance monitoring
    setInterval(async () => {
      try {
        await this.complianceMonitor.monitorCompliance();
      } catch (error) {
        logger.error('Daily compliance check failed:', { error: error.message });
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    // Weekly data governance tasks
    setInterval(async () => {
      try {
        await this.dataGovernance.applyRetentionPolicies();
        await this.dataGovernance.monitorProcessingActivities();
      } catch (error) {
        logger.error('Weekly data governance tasks failed:', { error: error.message });
      }
    }, 7 * 24 * 60 * 60 * 1000); // Every 7 days

    logger.info('✅ Compliance check schedules configured');
  }

  /**
   * Export compliance service for other modules
   */
  getComplianceAPI() {
    return {
      // Data subject rights
      handleDataSubjectRequest: this.privacyControls.handleAccessRequest.bind(this.privacyControls),
      handleErasureRequest: this.privacyControls.handleErasureRequest.bind(this.privacyControls),
      handleRectificationRequest: this.privacyControls.handleRectificationRequest.bind(this.privacyControls),
      handlePortabilityRequest: this.privacyControls.handlePortabilityRequest.bind(this.privacyControls),
      
      // Consent management
      recordConsent: this.recordConsent.bind(this),
      withdrawConsent: this.withdrawConsent.bind(this),
      
      // Audit logging
      logComplianceEvent: this.auditLogger.logComplianceEvent.bind(this.auditLogger),
      logDataAccess: this.auditLogger.logDataAccess.bind(this.auditLogger),
      
      // Reporting
      generateComplianceReport: this.complianceMonitor.generateComplianceReport.bind(this.complianceMonitor),
      
      // Monitoring
      monitorCompliance: this.complianceMonitor.monitorCompliance.bind(this.complianceMonitor),
      
      // Data governance
      classifyData: this.dataGovernance.classifyData.bind(this.dataGovernance)
    };
  }
}

// Create and export singleton instance
const complianceService = new ComplianceService();

module.exports = {
  ComplianceService,
  complianceService: complianceService.getComplianceAPI()
};
