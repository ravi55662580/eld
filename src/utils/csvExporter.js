const convertToCSV = (data, headers = null) => {
  if (!data || data.length === 0) {
    return '';
  }

  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(csvHeaders.join(','));

  data.forEach(row => {
    const values = csvHeaders.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

const formatLogBookForCSV = (logBooks) => {
  return logBooks.map(log => ({
    logDate: log.logDate,
    driverFirstName: log.driverId?.firstName || '',
    driverLastName: log.driverId?.lastName || '',
    licenseNumber: log.driverId?.licenseNumber || '',
    vehicleNumber: log.vehicleId?.vehicleNumber || '',
    vin: log.vehicleId?.vin || '',
    totalMiles: log.totalMiles || 0,
    engineHours: log.engineHours || 0,
    status: log.status || '',
    certificationStatus: log.certification?.status || 'UNCERTIFIED'
  }));
};

const formatDVIRForCSV = (dvirs) => {
  return dvirs.map(dvir => ({
    inspectionDate: dvir.inspectionDate,
    inspectionType: dvir.inspectionType,
    driverFirstName: dvir.driverId?.firstName || '',
    driverLastName: dvir.driverId?.lastName || '',
    vehicleNumber: dvir.vehicleId?.vehicleNumber || '',
    vin: dvir.vehicleId?.vin || '',
    make: dvir.vehicleId?.make || '',
    model: dvir.vehicleId?.model || '',
    status: dvir.status || '',
    hasDefects: dvir.defects && dvir.defects.length > 0 ? 'Yes' : 'No',
    defectCount: dvir.defects ? dvir.defects.length : 0
  }));
};

const formatViolationsForCSV = (violations) => {
  return violations.map(violation => ({
    violationDate: violation.violationDate,
    violationType: violation.violationType,
    severity: violation.severity,
    description: violation.description,
    driverFirstName: violation.driverId?.firstName || '',
    driverLastName: violation.driverId?.lastName || '',
    status: violation.status || '',
    resolvedDate: violation.resolvedDate || ''
  }));
};

const formatFuelReceiptsForCSV = (receipts) => {
  return receipts.map(receipt => ({
    purchaseDate: receipt.purchaseDate,
    location: receipt.location,
    gallons: receipt.gallons,
    pricePerGallon: receipt.pricePerGallon,
    totalAmount: receipt.totalAmount,
    fuelType: receipt.fuelType,
    driverFirstName: receipt.driverId?.firstName || '',
    driverLastName: receipt.driverId?.lastName || '',
    vehicleNumber: receipt.vehicleId?.vehicleNumber || ''
  }));
};

const formatStateMileageForCSV = (mileageData) => {
  return mileageData.map(data => ({
    date: data.date,
    state: data.state,
    miles: data.miles,
    fuelGallons: data.fuelGallons,
    driverFirstName: data.driverId?.firstName || '',
    driverLastName: data.driverId?.lastName || '',
    vehicleNumber: data.vehicleId?.vehicleNumber || ''
  }));
};

const formatComplianceForCSV = (complianceData) => {
  return complianceData.map(data => ({
    date: data.date,
    complianceType: data.complianceType,
    status: data.status,
    description: data.description,
    driverFirstName: data.driverId?.firstName || '',
    driverLastName: data.driverId?.lastName || '',
    resolvedDate: data.resolvedDate || ''
  }));
};

module.exports = {
  convertToCSV,
  formatLogBookForCSV,
  formatDVIRForCSV,
  formatViolationsForCSV,
  formatFuelReceiptsForCSV,
  formatStateMileageForCSV,
  formatComplianceForCSV
};
