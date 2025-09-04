const EventEmitter = require('events');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Comprehensive Monitoring and Alerting Service
 * Features: Performance monitoring, health checks, alerting, metrics collection,
 * log aggregation, anomaly detection, SLA monitoring
 */

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    
    this.config = {
      metrics: {
        collectionInterval: 30000,  // 30 seconds
        retentionPeriod: 30 * 24 * 60 * 60 * 1000,  // 30 days
        aggregationWindows: ['1m', '5m', '15m', '1h', '1d']
      },
      alerts: {
        evaluationInterval: 60000,  // 1 minute
        maxRetries: 3,
        cooldownPeriod: 5 * 60 * 1000,  // 5 minutes
        escalationLevels: ['info', 'warning', 'critical', 'emergency']
      },
      healthCheck: {
        interval: 10000,  // 10 seconds
        timeout: 5000,   // 5 seconds
        retries: 3
      }
    };

    // Monitoring components
    this.metricsCollector = null;
    this.alertManager = null;
    this.healthChecker = null;
    this.anomalyDetector = null;
    this.logAggregator = null;
    
    // Data storage
    this.metrics = new Map();
    this.alerts = new Map();
    this.healthStatus = new Map();
    this.anomalies = new Map();
    
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  async initializeMonitoring() {
    await this.setupMetricsCollection();
    await this.setupHealthChecks();
    await this.setupAlertManager();
    await this.setupAnomalyDetection();
    await this.setupLogAggregation();
    await this.setupPerformanceMonitoring();
    
    // Start monitoring processes
    this.startMonitoring();
    
    logger.info('✅ Monitoring service initialized');
  }

  /**
   * Setup comprehensive metrics collection
   */
  async setupMetricsCollection() {
    this.metricsCollector = {
      // Collect system metrics
      collectSystemMetrics: async () => {
        const timestamp = new Date();
        
        return {
          timestamp,
          system: {
            cpu: {
              usage: await this.getCPUUsage(),
              loadAverage: os.loadavg(),
              cores: os.cpus().length
            },
            memory: {
              used: process.memoryUsage(),
              system: {
                total: os.totalmem(),
                free: os.freemem(),
                usage: (os.totalmem() - os.freemem()) / os.totalmem() * 100
              }
            },
            disk: await this.getDiskUsage(),
            network: await this.getNetworkStats()
          },
          process: {
            uptime: process.uptime(),
            pid: process.pid,
            version: process.version,
            platform: process.platform,
            arch: process.arch
          }
        };
      },

      // Collect application metrics
      collectApplicationMetrics: async () => {
        const timestamp = new Date();
        
        return {
          timestamp,
          application: {
            requests: {
              total: this.getRequestCount(),
              success: this.getSuccessCount(),
              errors: this.getErrorCount(),
              averageResponseTime: this.getAverageResponseTime(),
              p95ResponseTime: this.getP95ResponseTime(),
              p99ResponseTime: this.getP99ResponseTime()
            },
            database: {
              connections: this.getDatabaseConnections(),
              queries: this.getDatabaseQueryMetrics(),
              slowQueries: this.getSlowQueries()
            },
            security: {
              authAttempts: this.getAuthAttempts(),
              failedLogins: this.getFailedLogins(),
              blockedRequests: this.getBlockedRequests(),
              threatEvents: this.getThreatEvents()
            },
            compliance: {
              auditEvents: this.getAuditEventCount(),
              dataSubjectRequests: this.getDataSubjectRequestCount(),
              privacyViolations: this.getPrivacyViolations()
            }
          }
        };
      },

      // Collect business metrics
      collectBusinessMetrics: async () => {
        const timestamp = new Date();
        
        return {
          timestamp,
          business: {
            users: {
              active: await this.getActiveUserCount(),
              new: await this.getNewUserCount(),
              retention: await this.getUserRetention()
            },
            devices: {
              connected: await this.getConnectedDevices(),
              dataVolume: await this.getDataVolume(),
              errors: await this.getDeviceErrors()
            },
            compliance: {
              violations: await this.getComplianceViolations(),
              inspections: await this.getInspectionCount(),
              certifications: await this.getCertificationStatus()
            }
          }
        };
      },

      // Store metrics with aggregation
      storeMetrics: async (metrics) => {
        const key = `${metrics.timestamp.getTime()}`;
        this.metrics.set(key, metrics);
        
        // Aggregate metrics for different time windows
        await this.aggregateMetrics(metrics);
        
        // Clean up old metrics
        await this.cleanupOldMetrics();
      },

      // Get metrics for specific time range
      getMetrics: async (startTime, endTime, aggregation = '1m') => {
        const aggregatedKey = `${aggregation}_aggregated`;
        const results = [];
        
        for (const [key, metrics] of this.metrics.entries()) {
          const timestamp = new Date(parseInt(key));
          
          if (timestamp >= startTime && timestamp <= endTime) {
            if (key.includes(aggregatedKey) || aggregation === 'raw') {
              results.push(metrics);
            }
          }
        }
        
        return results.sort((a, b) => a.timestamp - b.timestamp);
      }
    };

    logger.info('✅ Metrics collection configured');
  }

  /**
   * Setup comprehensive health checks
   */
  async setupHealthChecks() {
    this.healthChecker = {
      // Define health check components
      components: [
        {
          name: 'database',
          check: this.checkDatabaseHealth.bind(this),
          critical: true,
          timeout: 5000
        },
        {
          name: 'redis',
          check: this.checkRedisHealth.bind(this),
          critical: true,
          timeout: 3000
        },
        {
          name: 'external-apis',
          check: this.checkExternalAPIs.bind(this),
          critical: false,
          timeout: 10000
        },
        {
          name: 'disk-space',
          check: this.checkDiskSpace.bind(this),
          critical: true,
          timeout: 1000
        },
        {
          name: 'memory',
          check: this.checkMemoryUsage.bind(this),
          critical: true,
          timeout: 1000
        },
        {
          name: 'security',
          check: this.checkSecurityHealth.bind(this),
          critical: true,
          timeout: 5000
        },
        {
          name: 'compliance',
          check: this.checkComplianceHealth.bind(this),
          critical: false,
          timeout: 5000
        }
      ],

      // Perform comprehensive health check
      performHealthCheck: async () => {
        const healthReport = {
          timestamp: new Date(),
          overall: 'healthy',
          components: {},
          details: {}
        };

        const checkPromises = this.healthChecker.components.map(async (component) => {
          try {
            const startTime = Date.now();
            
            const result = await Promise.race([
              component.check(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Health check timeout')), component.timeout)
              )
            ]);
            
            const responseTime = Date.now() - startTime;
            
            healthReport.components[component.name] = {
              status: result.healthy ? 'healthy' : 'unhealthy',
              responseTime,
              details: result.details || {},
              critical: component.critical
            };
            
            if (!result.healthy && component.critical) {
              healthReport.overall = 'unhealthy';
            }
            
          } catch (error) {
            healthReport.components[component.name] = {
              status: 'error',
              error: error.message,
              critical: component.critical
            };
            
            if (component.critical) {
              healthReport.overall = 'unhealthy';
            }
          }
        });

        await Promise.all(checkPromises);
        
        // Store health status
        this.healthStatus.set(healthReport.timestamp.getTime(), healthReport);
        
        // Emit health status change event
        this.emit('healthStatusChange', healthReport);
        
        return healthReport;
      },

      // Get current health status
      getHealthStatus: () => {
        const latest = Array.from(this.healthStatus.values())
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        return latest || { overall: 'unknown', components: {} };
      }
    };

    logger.info('✅ Health checks configured');
  }

  /**
   * Setup intelligent alert manager
   */
  async setupAlertManager() {
    this.alertManager = {
      // Alert rules configuration
      rules: [
        {
          id: 'high-cpu-usage',
          name: 'High CPU Usage',
          condition: (metrics) => metrics.system?.cpu?.usage > 80,
          severity: 'warning',
          cooldown: 5 * 60 * 1000,
          escalation: {
            warning: 80,
            critical: 90,
            emergency: 95
          }
        },
        {
          id: 'high-memory-usage',
          name: 'High Memory Usage',
          condition: (metrics) => metrics.system?.memory?.system?.usage > 85,
          severity: 'warning',
          cooldown: 5 * 60 * 1000,
          escalation: {
            warning: 85,
            critical: 95,
            emergency: 98
          }
        },
        {
          id: 'high-error-rate',
          name: 'High Error Rate',
          condition: (metrics) => {
            const errorRate = metrics.application?.requests?.errors / metrics.application?.requests?.total;
            return errorRate > 0.05; // 5% error rate
          },
          severity: 'critical',
          cooldown: 2 * 60 * 1000
        },
        {
          id: 'slow-response-time',
          name: 'Slow Response Time',
          condition: (metrics) => metrics.application?.requests?.p95ResponseTime > 2000,
          severity: 'warning',
          cooldown: 10 * 60 * 1000
        },
        {
          id: 'database-connection-issues',
          name: 'Database Connection Issues',
          condition: (metrics) => metrics.application?.database?.connections < 1,
          severity: 'critical',
          cooldown: 1 * 60 * 1000
        },
        {
          id: 'security-threat-detected',
          name: 'Security Threat Detected',
          condition: (metrics) => metrics.application?.security?.threatEvents > 10,
          severity: 'emergency',
          cooldown: 0 // No cooldown for security alerts
        },
        {
          id: 'compliance-violation',
          name: 'Compliance Violation',
          condition: (metrics) => metrics.application?.compliance?.privacyViolations > 0,
          severity: 'critical',
          cooldown: 0 // No cooldown for compliance alerts
        }
      ],

      // Evaluate alert rules
      evaluateRules: async (metrics) => {
        const activeAlerts = [];
        
        for (const rule of this.alertManager.rules) {
          try {
            if (rule.condition(metrics)) {
              const alertKey = rule.id;
              const lastAlert = this.alerts.get(alertKey);
              
              // Check cooldown period
              if (lastAlert && Date.now() - lastAlert.timestamp < rule.cooldown) {
                continue;
              }
              
              // Determine severity level
              const severity = this.determineSeverity(rule, metrics);
              
              const alert = {
                id: rule.id,
                name: rule.name,
                severity,
                timestamp: new Date(),
                metrics: metrics,
                details: this.getAlertDetails(rule, metrics),
                escalationLevel: this.getEscalationLevel(severity)
              };
              
              // Store alert
              this.alerts.set(alertKey, alert);
              activeAlerts.push(alert);
              
              // Emit alert event
              this.emit('alertTriggered', alert);
              
              // Send notifications
              await this.sendAlertNotifications(alert);
            }
          } catch (error) {
            logger.error(`Error evaluating alert rule ${rule.id}:`, { error: error.message, ruleId: rule.id });
          }
        }
        
        return activeAlerts;
      },

      // Send alert notifications
      sendNotifications: async (alert) => {
        const notifications = [];
        
        // Email notifications
        if (alert.severity === 'critical' || alert.severity === 'emergency') {
          notifications.push(this.sendEmailAlert(alert));
        }
        
        // Slack notifications
        notifications.push(this.sendSlackAlert(alert));
        
        // SMS notifications for emergency alerts
        if (alert.severity === 'emergency') {
          notifications.push(this.sendSMSAlert(alert));
        }
        
        // PagerDuty integration for critical alerts
        if (alert.severity === 'critical' || alert.severity === 'emergency') {
          notifications.push(this.sendPagerDutyAlert(alert));
        }
        
        await Promise.all(notifications);
      }
    };

    logger.info('✅ Alert manager configured');
  }

  /**
   * Setup anomaly detection system
   */
  async setupAnomalyDetection() {
    this.anomalyDetector = {
      // Statistical anomaly detection
      detectStatisticalAnomalies: async (metrics) => {
        const anomalies = [];
        
        // Check for metric value anomalies
        const metricKeys = this.extractMetricKeys(metrics);
        
        for (const key of metricKeys) {
          const historicalValues = await this.getHistoricalValues(key, 100);
          const currentValue = this.getMetricValue(metrics, key);
          
          if (this.isStatisticalAnomaly(currentValue, historicalValues)) {
            anomalies.push({
              type: 'statistical',
              metric: key,
              currentValue,
              expectedRange: this.calculateExpectedRange(historicalValues),
              severity: this.calculateAnomalySeverity(currentValue, historicalValues),
              timestamp: new Date()
            });
          }
        }
        
        return anomalies;
      },

      // Pattern-based anomaly detection
      detectPatternAnomalies: async (metrics) => {
        const anomalies = [];
        
        // Check for unusual patterns in request rates
        const requestPattern = await this.analyzeRequestPattern();
        if (requestPattern.anomaly) {
          anomalies.push({
            type: 'pattern',
            metric: 'request_rate',
            description: requestPattern.description,
            severity: requestPattern.severity,
            timestamp: new Date()
          });
        }
        
        // Check for unusual error patterns
        const errorPattern = await this.analyzeErrorPattern();
        if (errorPattern.anomaly) {
          anomalies.push({
            type: 'pattern',
            metric: 'error_rate',
            description: errorPattern.description,
            severity: errorPattern.severity,
            timestamp: new Date()
          });
        }
        
        return anomalies;
      },

      // Machine learning-based anomaly detection
      detectMLAnomalies: async (metrics) => {
        // Simplified ML-based anomaly detection
        // In production, use proper ML libraries like TensorFlow.js
        const anomalies = [];
        
        try {
          const features = this.extractFeatures(metrics);
          const anomalyScore = await this.calculateAnomalyScore(features);
          
          if (anomalyScore > 0.8) { // Threshold for anomaly
            anomalies.push({
              type: 'ml',
              score: anomalyScore,
              features: features,
              severity: anomalyScore > 0.9 ? 'high' : 'medium',
              timestamp: new Date()
            });
          }
        } catch (error) {
          logger.error('ML anomaly detection error:', { error: error.message });
        }
        
        return anomalies;
      },

      // Comprehensive anomaly detection
      detectAnomalies: async (metrics) => {
        const allAnomalies = [];
        
        // Run all detection methods
        const [statistical, pattern, ml] = await Promise.all([
          this.anomalyDetector.detectStatisticalAnomalies(metrics),
          this.anomalyDetector.detectPatternAnomalies(metrics),
          this.anomalyDetector.detectMLAnomalies(metrics)
        ]);
        
        allAnomalies.push(...statistical, ...pattern, ...ml);
        
        // Store anomalies
        if (allAnomalies.length > 0) {
          const timestamp = Date.now();
          this.anomalies.set(timestamp, allAnomalies);
          
          // Emit anomaly events
          for (const anomaly of allAnomalies) {
            this.emit('anomalyDetected', anomaly);
          }
        }
        
        return allAnomalies;
      }
    };

    logger.info('✅ Anomaly detection configured');
  }

  /**
   * Setup log aggregation and analysis
   */
  async setupLogAggregation() {
    this.logAggregator = {
      // Log levels and categories
      levels: ['error', 'warn', 'info', 'debug'],
      categories: ['application', 'security', 'compliance', 'performance'],
      
      // Aggregate logs from different sources
      aggregateLogs: async (timeWindow = '1h') => {
        const logs = await this.collectLogsFromSources(timeWindow);
        
        return {
          total: logs.length,
          byLevel: this.groupLogsByLevel(logs),
          byCategory: this.groupLogsByCategory(logs),
          errors: this.extractErrorLogs(logs),
          security: this.extractSecurityLogs(logs),
          performance: this.extractPerformanceLogs(logs),
          trends: this.analyzeLogTrends(logs)
        };
      },

      // Analyze log patterns
      analyzeLogPatterns: async (logs) => {
        const patterns = {
          errorSpikes: this.detectErrorSpikes(logs),
          securityEvents: this.detectSecurityEvents(logs),
          performanceIssues: this.detectPerformanceIssues(logs),
          anomalousPatterns: this.detectAnomalousLogPatterns(logs)
        };
        
        return patterns;
      },

      // Search and filter logs
      searchLogs: async (query, filters = {}) => {
        const results = await this.performLogSearch(query, filters);
        
        return {
          total: results.length,
          logs: results.slice(0, 1000), // Limit results
          aggregations: this.aggregateSearchResults(results),
          suggestions: this.generateSearchSuggestions(query, results)
        };
      }
    };

    logger.info('✅ Log aggregation configured');
  }

  /**
   * Setup performance monitoring
   */
  async setupPerformanceMonitoring() {
    this.performanceMonitor = {
      // Monitor API performance
      monitorAPIPerformance: () => {
        return (req, res, next) => {
          const startTime = Date.now();
          
          res.on('finish', () => {
            const duration = Date.now() - startTime;
            
            this.recordAPIMetric({
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              duration,
              timestamp: new Date(),
              userAgent: req.get('User-Agent'),
              ip: req.ip
            });
          });
          
          next();
        };
      },

      // Monitor database performance
      monitorDatabasePerformance: async () => {
        const queries = await this.getDatabaseQueries();
        const slowQueries = queries.filter(q => q.duration > 1000);
        
        return {
          totalQueries: queries.length,
          slowQueries: slowQueries.length,
          averageDuration: queries.reduce((sum, q) => sum + q.duration, 0) / queries.length,
          slowestQuery: slowQueries.sort((a, b) => b.duration - a.duration)[0]
        };
      },

      // Monitor system resources
      monitorSystemResources: async () => {
        return {
          cpu: await this.getCPUUsage(),
          memory: this.getMemoryUsage(),
          disk: await this.getDiskUsage(),
          network: await this.getNetworkStats(),
          processes: await this.getProcessStats()
        };
      }
    };

    logger.info('✅ Performance monitoring configured');
  }

  /**
   * Start monitoring processes
   */
  startMonitoring() {
    // Start metrics collection
    setInterval(async () => {
      try {
        const [system, application, business] = await Promise.all([
          this.metricsCollector.collectSystemMetrics(),
          this.metricsCollector.collectApplicationMetrics(),
          this.metricsCollector.collectBusinessMetrics()
        ]);
        
        const allMetrics = { ...system, ...application, ...business };
        await this.metricsCollector.storeMetrics(allMetrics);
        
        // Evaluate alerts
        await this.alertManager.evaluateRules(allMetrics);
        
        // Detect anomalies
        await this.anomalyDetector.detectAnomalies(allMetrics);
        
      } catch (error) {
        logger.error('Metrics collection error:', { error: error.message });
      }
    }, this.config.metrics.collectionInterval);

    // Start health checks
    setInterval(async () => {
      try {
        await this.healthChecker.performHealthCheck();
      } catch (error) {
        logger.error('Health check error:', { error: error.message });
      }
    }, this.config.healthCheck.interval);

    // Start log aggregation
    setInterval(async () => {
      try {
        await this.logAggregator.aggregateLogs();
      } catch (error) {
        logger.error('Log aggregation error:', { error: error.message });
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    logger.info('✅ Monitoring processes started');
  }

  /**
   * Health check implementations
   */
  async checkDatabaseHealth() {
    // Implementation would check MongoDB connection
    return { healthy: true, details: { connectionCount: 10 } };
  }

  async checkRedisHealth() {
    // Implementation would check Redis connection
    return { healthy: true, details: { memory: '50MB' } };
  }

  async checkExternalAPIs() {
    // Implementation would check external API health
    return { healthy: true, details: { responseTime: 150 } };
  }

  async checkDiskSpace() {
    // Implementation would check disk space
    return { healthy: true, details: { freeSpace: '50GB' } };
  }

  async checkMemoryUsage() {
    const usage = process.memoryUsage();
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = (used / total) * 100;
    
    return {
      healthy: percentage < 90,
      details: { usage: percentage, used, free, total }
    };
  }

  async checkSecurityHealth() {
    // Implementation would check security status
    return { healthy: true, details: { threats: 0 } };
  }

  async checkComplianceHealth() {
    // Implementation would check compliance status
    return { healthy: true, details: { violations: 0 } };
  }

  /**
   * Utility functions for metrics and monitoring
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const percentage = (endUsage.user + endUsage.system) / 10000;
        resolve(Math.min(100, percentage));
      }, 100);
    });
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      percentage: (usage.heapUsed / usage.heapTotal) * 100
    };
  }

  async getDiskUsage() {
    try {
      const stats = await fs.stat(process.cwd());
      return {
        size: stats.size,
        free: 1000000000, // Placeholder
        used: 500000000,  // Placeholder
        percentage: 50    // Placeholder
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getNetworkStats() {
    return {
      bytesIn: 1000000,  // Placeholder
      bytesOut: 500000,  // Placeholder
      packetsIn: 1000,   // Placeholder
      packetsOut: 800    // Placeholder
    };
  }

  /**
   * Export monitoring service API
   */
  getMonitoringAPI() {
    return {
      // Metrics
      getMetrics: this.metricsCollector.getMetrics.bind(this.metricsCollector),
      
      // Health checks
      getHealthStatus: this.healthChecker.getHealthStatus.bind(this.healthChecker),
      performHealthCheck: this.healthChecker.performHealthCheck.bind(this.healthChecker),
      
      // Alerts
      getActiveAlerts: () => Array.from(this.alerts.values()),
      
      // Anomalies
      getAnomalies: (startTime, endTime) => {
        const results = [];
        for (const [timestamp, anomalies] of this.anomalies.entries()) {
          const date = new Date(timestamp);
          if (date >= startTime && date <= endTime) {
            results.push({ timestamp: date, anomalies });
          }
        }
        return results;
      },
      
      // Performance monitoring middleware
      performanceMiddleware: this.performanceMonitor.monitorAPIPerformance.bind(this.performanceMonitor),
      
      // Log search
      searchLogs: this.logAggregator.searchLogs.bind(this.logAggregator),
      
      // Event listeners
      onAlert: (callback) => this.on('alertTriggered', callback),
      onAnomaly: (callback) => this.on('anomalyDetected', callback),
      onHealthChange: (callback) => this.on('healthStatusChange', callback)
    };
  }
}

// Create and export singleton instance
const monitoringService = new MonitoringService();

module.exports = {
  MonitoringService,
  monitoringService: monitoringService.getMonitoringAPI()
};
