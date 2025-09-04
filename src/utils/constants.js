const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DRIVER: 'driver',
  DISPATCHER: 'dispatcher'
};

const ASSET_TYPES = {
  TRACTOR: 'Tractor',
  TRAILER: 'Trailer',
  TRUCK: 'Truck'
};

const FUEL_TYPES = {
  DIESEL: 'Diesel',
  GASOLINE: 'Gasoline',
  ELECTRIC: 'Electric',
  HYBRID: 'Hybrid'
};

const DUTY_STATUSES = {
  ON_DUTY: 'ON_DUTY',
  OFF_DUTY: 'OFF_DUTY',
  DRIVING: 'DRIVING',
  SLEEPER_BERTH: 'SLEEPER_BERTH'
};

const INSPECTION_TYPES = {
  PRE_TRIP: 'PRE_TRIP',
  POST_TRIP: 'POST_TRIP',
  INTERMEDIATE: 'INTERMEDIATE'
};

const VIOLATION_SEVERITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const COMPLIANCE_STATUSES = {
  COMPLIANT: 'COMPLIANT',
  NON_COMPLIANT: 'NON_COMPLIANT',
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW'
};

const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};

const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};

module.exports = {
  ROLES,
  ASSET_TYPES,
  FUEL_TYPES,
  DUTY_STATUSES,
  INSPECTION_TYPES,
  VIOLATION_SEVERITIES,
  COMPLIANCE_STATUSES,
  FILE_UPLOAD_LIMITS,
  PAGINATION_DEFAULTS
};
