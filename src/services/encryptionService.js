const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

/**
 * Advanced Encryption and Privacy Service
 * Features: End-to-end encryption, field-level encryption, data anonymization,
 * key management, privacy-preserving analytics
 */

class EncryptionService {
  constructor() {
    // Encryption configuration
    this.config = {
      algorithms: {
        symmetric: 'aes-256-gcm',
        asymmetric: 'rsa-4096',
        hash: 'sha256',
        kdf: 'pbkdf2'
      },
      keyDerivation: {
        iterations: 100000,
        keyLength: 32,
        digest: 'sha512'
      },
      encryption: {
        ivLength: 16,
        tagLength: 16,
        saltLength: 32
      }
    };

    // Master encryption keys (in production, use AWS KMS or similar)
    this.masterKeys = {
      primary: process.env.MASTER_ENCRYPTION_KEY || crypto.randomBytes(32),
      secondary: process.env.SECONDARY_ENCRYPTION_KEY || crypto.randomBytes(32)
    };

    // Initialize key management
    this.keyManager = null;
    this.anonymizer = null;
    this.privacyEngine = null;
    
    this.initializeEncryptionServices();
  }

  /**
   * Initialize encryption services
   */
  async initializeEncryptionServices() {
    await this.setupKeyManagement();
    await this.setupDataAnonymization();
    await this.setupPrivacyEngine();
    
    console.log('✅ Encryption services initialized');
  }

  /**
   * Setup advanced key management system
   */
  async setupKeyManagement() {
    this.keyManager = {
      // Generate data encryption key (DEK)
      generateDataKey: async (purpose, keyId = null) => {
        const dek = crypto.randomBytes(32);
        const keyMetadata = {
          keyId: keyId || this.generateKeyId(),
          purpose,
          algorithm: this.config.algorithms.symmetric,
          created: new Date(),
          version: 1,
          status: 'active'
        };

        // Encrypt DEK with master key (envelope encryption)
        const encryptedDEK = await this.encryptWithMasterKey(dek, 'primary');
        
        // Store encrypted key metadata
        await this.storeKeyMetadata(keyMetadata.keyId, {
          ...keyMetadata,
          encryptedKey: encryptedDEK
        });

        return {
          keyId: keyMetadata.keyId,
          plaintextKey: dek,
          encryptedKey: encryptedDEK,
          metadata: keyMetadata
        };
      },

      // Retrieve and decrypt data encryption key
      getDataKey: async (keyId) => {
        const keyMetadata = await this.getKeyMetadata(keyId);
        
        if (!keyMetadata || keyMetadata.status !== 'active') {
          throw new Error(`Key ${keyId} not found or inactive`);
        }

        // Decrypt DEK with master key
        const plaintextKey = await this.decryptWithMasterKey(
          keyMetadata.encryptedKey, 
          'primary'
        );

        return {
          keyId,
          plaintextKey,
          metadata: keyMetadata
        };
      },

      // Rotate encryption keys
      rotateKey: async (keyId) => {
        const oldKeyMetadata = await this.getKeyMetadata(keyId);
        
        // Generate new key version
        const newKey = await this.keyManager.generateDataKey(
          oldKeyMetadata.purpose,
          keyId
        );
        
        // Update version
        newKey.metadata.version = oldKeyMetadata.version + 1;
        
        // Mark old key as deprecated
        await this.updateKeyStatus(keyId, oldKeyMetadata.version, 'deprecated');
        
        return newKey;
      },

      // Key derivation for specific purposes
      deriveKey: async (masterKey, purpose, salt = null) => {
        const derivedSalt = salt || crypto.randomBytes(this.config.encryption.saltLength);
        
        const key = await promisify(crypto.pbkdf2)(
          masterKey,
          derivedSalt,
          this.config.keyDerivation.iterations,
          this.config.keyDerivation.keyLength,
          this.config.keyDerivation.digest
        );

        return {
          key,
          salt: derivedSalt,
          purpose,
          algorithm: this.config.algorithms.symmetric
        };
      }
    };

    console.log('✅ Key management system configured');
  }

  /**
   * Setup data anonymization engine
   */
  async setupDataAnonymization() {
    this.anonymizer = {
      // K-anonymity implementation
      kAnonymize: async (dataset, k, quasiIdentifiers) => {
        // Group records by quasi-identifier combinations
        const groups = this.groupByQuasiIdentifiers(dataset, quasiIdentifiers);
        
        // Suppress or generalize groups with size < k
        const anonymizedGroups = [];
        
        for (const group of groups) {
          if (group.length >= k) {
            anonymizedGroups.push(group);
          } else {
            // Generalize or suppress small groups
            const generalizedGroup = await this.generalizeGroup(group, quasiIdentifiers);
            anonymizedGroups.push(generalizedGroup);
          }
        }

        return this.flattenGroups(anonymizedGroups);
      },

      // L-diversity implementation
      lDiversify: async (dataset, l, sensitiveAttributes) => {
        const groups = this.groupByQuasiIdentifiers(dataset, sensitiveAttributes);
        
        return groups.filter(group => {
          // Check if group has at least l distinct values for sensitive attributes
          return this.checkLDiversity(group, l, sensitiveAttributes);
        });
      },

      // Differential privacy noise injection
      addDifferentialPrivacyNoise: async (value, epsilon, sensitivity = 1) => {
        // Laplace mechanism for differential privacy
        const scale = sensitivity / epsilon;
        const noise = this.generateLaplaceNoise(scale);
        
        return value + noise;
      },

      // Synthetic data generation
      generateSyntheticData: async (originalData, privacyBudget) => {
        // Use differential privacy to generate synthetic dataset
        const syntheticData = [];
        
        for (const record of originalData) {
          const syntheticRecord = {};
          
          for (const [field, value] of Object.entries(record)) {
            if (this.isSensitiveField(field)) {
              // Add noise to sensitive fields
              syntheticRecord[field] = await this.anonymizer.addDifferentialPrivacyNoise(
                value, 
                privacyBudget, 
                this.getSensitivity(field)
              );
            } else {
              syntheticRecord[field] = value;
            }
          }
          
          syntheticData.push(syntheticRecord);
        }

        return syntheticData;
      },

      // Data masking for non-production environments
      maskSensitiveData: async (data, maskingRules) => {
        const maskedData = JSON.parse(JSON.stringify(data)); // Deep clone
        
        for (const rule of maskingRules) {
          await this.applyMaskingRule(maskedData, rule);
        }

        return maskedData;
      },

      // Pseudonymization with consistent mapping
      pseudonymize: async (identifier, domain = 'default') => {
        // Generate deterministic pseudonym for consistent mapping
        const hash = crypto.createHmac('sha256', this.masterKeys.primary);
        hash.update(`${domain}:${identifier}`);
        
        return `PSEUDO_${hash.digest('hex').substring(0, 12).toUpperCase()}`;
      }
    };

    console.log('✅ Data anonymization engine configured');
  }

  /**
   * Setup privacy-preserving analytics engine
   */
  async setupPrivacyEngine() {
    this.privacyEngine = {
      // Homomorphic encryption for privacy-preserving computations
      homomorphicSum: async (encryptedValues) => {
        // Simplified homomorphic addition (in production, use libraries like SEAL)
        let result = 0;
        
        for (const encValue of encryptedValues) {
          // Decrypt, add, re-encrypt (simplified for demonstration)
          const plainValue = await this.decrypt(encValue);
          result += plainValue;
        }
        
        return await this.encrypt(result);
      },

      // Secure multi-party computation simulation
      secureAggregation: async (parties, values) => {
        // Simple secure sum protocol
        const shares = this.generateSecretShares(values, parties.length);
        
        // Each party computes on their shares
        const results = await Promise.all(
          parties.map((party, index) => 
            this.computeOnShares(shares[index], party.computation)
          )
        );
        
        // Combine results
        return this.combineShares(results);
      },

      // Zero-knowledge proof verification
      verifyZKProof: async (proof, statement, publicInputs) => {
        // Simplified ZK proof verification
        // In production, use libraries like circomlib or snarkjs
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify({ proof, statement, publicInputs }));
        
        return hash.digest('hex') === proof.commitment;
      },

      // Privacy-preserving analytics
      computePrivateStatistics: async (dataset, epsilon) => {
        const stats = {};
        
        // Count with differential privacy
        stats.count = await this.anonymizer.addDifferentialPrivacyNoise(
          dataset.length, 
          epsilon / 4
        );
        
        // Mean with differential privacy
        const sum = dataset.reduce((acc, val) => acc + val, 0);
        const noisySum = await this.anonymizer.addDifferentialPrivacyNoise(
          sum, 
          epsilon / 4
        );
        stats.mean = noisySum / stats.count;
        
        return stats;
      }
    };

    console.log('✅ Privacy engine configured');
  }

  /**
   * Field-level encryption functions
   */
  async encryptField(plaintext, keyId = null) {
    if (!plaintext) return null;
    
    // Get or generate encryption key
    const keyData = keyId 
      ? await this.keyManager.getDataKey(keyId)
      : await this.keyManager.generateDataKey('field_encryption');
    
    // Generate random IV
    const iv = crypto.randomBytes(this.config.encryption.ivLength);
    
    // Create cipher
    const cipher = crypto.createCipherGCM(this.config.algorithms.symmetric, keyData.plaintextKey, iv);
    
    // Encrypt data
    let encrypted = cipher.update(plaintext.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      keyId: keyData.keyId,
      algorithm: this.config.algorithms.symmetric
    };
  }

  async decryptField(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'object') {
      return encryptedData;
    }
    
    const { encrypted, iv, tag, keyId, algorithm } = encryptedData;
    
    // Get decryption key
    const keyData = await this.keyManager.getDataKey(keyId);
    
    // Create decipher
    const decipher = crypto.createDecipherGCM(
      algorithm, 
      keyData.plaintextKey, 
      Buffer.from(iv, 'hex')
    );
    
    // Set authentication tag
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Document-level encryption
   */
  async encryptDocument(document, schema = null) {
    const encryptedDoc = {};
    
    for (const [field, value] of Object.entries(document)) {
      if (this.shouldEncryptField(field, schema)) {
        encryptedDoc[field] = await this.encryptField(value);
      } else {
        encryptedDoc[field] = value;
      }
    }
    
    // Add encryption metadata
    encryptedDoc._encryption = {
      version: '1.0',
      timestamp: new Date(),
      schema: schema?.name || 'default'
    };
    
    return encryptedDoc;
  }

  async decryptDocument(encryptedDocument) {
    const decryptedDoc = {};
    
    for (const [field, value] of Object.entries(encryptedDocument)) {
      if (field === '_encryption') {
        continue; // Skip encryption metadata
      }
      
      if (this.isEncryptedField(value)) {
        decryptedDoc[field] = await this.decryptField(value);
      } else {
        decryptedDoc[field] = value;
      }
    }
    
    return decryptedDoc;
  }

  /**
   * End-to-end encryption for client-server communication
   */
  async generateKeyPair() {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      }, (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      });
    });
  }

  async encryptWithPublicKey(data, publicKey) {
    const buffer = Buffer.from(JSON.stringify(data), 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    
    return encrypted.toString('base64');
  }

  async decryptWithPrivateKey(encryptedData, privateKey) {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    
    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Password and authentication security
   */
  async hashPassword(password, rounds = 12) {
    const salt = await bcrypt.genSalt(rounds);
    return await bcrypt.hash(password, salt);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  async generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Data integrity and authentication
   */
  async generateHMAC(data, key = null) {
    const hmacKey = key || this.masterKeys.primary;
    const hmac = crypto.createHmac(this.config.algorithms.hash, hmacKey);
    hmac.update(JSON.stringify(data));
    
    return hmac.digest('hex');
  }

  async verifyHMAC(data, signature, key = null) {
    const expectedSignature = await this.generateHMAC(data, key);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Utility functions for privacy operations
   */
  shouldEncryptField(fieldName, schema) {
    const sensitiveFields = [
      'ssn', 'social_security_number', 'tax_id',
      'license_number', 'driver_license',
      'credit_card', 'bank_account',
      'medical_info', 'health_records',
      'personal_notes', 'comments'
    ];
    
    if (schema && schema.encryptedFields) {
      return schema.encryptedFields.includes(fieldName);
    }
    
    return sensitiveFields.some(sensitive => 
      fieldName.toLowerCase().includes(sensitive)
    );
  }

  isEncryptedField(value) {
    return value && 
           typeof value === 'object' && 
           value.encrypted && 
           value.iv && 
           value.tag && 
           value.keyId;
  }

  isSensitiveField(fieldName) {
    const sensitivePatterns = [
      /ssn/i, /social/i, /license/i, /medical/i, 
      /health/i, /credit/i, /bank/i, /financial/i,
      /personal/i, /private/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(fieldName));
  }

  getSensitivity(fieldName) {
    // Return sensitivity level for differential privacy
    const sensitivities = {
      'age': 1,
      'salary': 10000,
      'location': 0.001,
      'speed': 1,
      'default': 1
    };
    
    return sensitivities[fieldName.toLowerCase()] || sensitivities.default;
  }

  generateLaplaceNoise(scale) {
    // Generate Laplace noise for differential privacy
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  generateKeyId() {
    return `KEY_${Date.now()}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  }

  async encryptWithMasterKey(data, keyName) {
    const masterKey = this.masterKeys[keyName];
    if (!masterKey) throw new Error(`Master key ${keyName} not found`);
    
    const iv = crypto.randomBytes(this.config.encryption.ivLength);
    const cipher = crypto.createCipherGCM(this.config.algorithms.symmetric, masterKey, iv);
    
    let encrypted = cipher.update(data, null, 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  async decryptWithMasterKey(encryptedData, keyName) {
    const masterKey = this.masterKeys[keyName];
    if (!masterKey) throw new Error(`Master key ${keyName} not found`);
    
    const { encrypted, iv, tag } = encryptedData;
    
    const decipher = crypto.createDecipherGCM(
      this.config.algorithms.symmetric, 
      masterKey, 
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex');
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  /**
   * Export encryption service API
   */
  getEncryptionAPI() {
    return {
      // Field-level encryption
      encryptField: this.encryptField.bind(this),
      decryptField: this.decryptField.bind(this),
      
      // Document encryption
      encryptDocument: this.encryptDocument.bind(this),
      decryptDocument: this.decryptDocument.bind(this),
      
      // Key management
      generateDataKey: this.keyManager.generateDataKey.bind(this.keyManager),
      getDataKey: this.keyManager.getDataKey.bind(this.keyManager),
      rotateKey: this.keyManager.rotateKey.bind(this.keyManager),
      
      // Anonymization
      kAnonymize: this.anonymizer.kAnonymize.bind(this.anonymizer),
      addDifferentialPrivacyNoise: this.anonymizer.addDifferentialPrivacyNoise.bind(this.anonymizer),
      pseudonymize: this.anonymizer.pseudonymize.bind(this.anonymizer),
      maskSensitiveData: this.anonymizer.maskSensitiveData.bind(this.anonymizer),
      
      // Privacy-preserving analytics
      computePrivateStatistics: this.privacyEngine.computePrivateStatistics.bind(this.privacyEngine),
      
      // Authentication
      hashPassword: this.hashPassword.bind(this),
      verifyPassword: this.verifyPassword.bind(this),
      generateSecureToken: this.generateSecureToken.bind(this),
      
      // Integrity
      generateHMAC: this.generateHMAC.bind(this),
      verifyHMAC: this.verifyHMAC.bind(this),
      
      // End-to-end encryption
      generateKeyPair: this.generateKeyPair.bind(this),
      encryptWithPublicKey: this.encryptWithPublicKey.bind(this),
      decryptWithPrivateKey: this.decryptWithPrivateKey.bind(this)
    };
  }
}

// Create and export singleton instance
const encryptionService = new EncryptionService();

module.exports = {
  EncryptionService,
  encryptionService: encryptionService.getEncryptionAPI()
};
