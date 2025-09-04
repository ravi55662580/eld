const applyRoleFiltering = (query, user) => {
  if (user.role !== 'admin' && user.carrierId) {
    query.carrierId = user.carrierId;
  }
  
  if (user.role === 'driver' && user.driverId) {
    query.driverId = user.driverId;
  }
};

const canAccessCarrierData = (user, targetCarrierId) => {
  if (user.role === 'admin') {
    return true;
  }
  
  return user.carrierId && user.carrierId.toString() === targetCarrierId;
};

const canAccessDriverData = (user, targetDriverId) => {
  if (user.role === 'admin') {
    return true;
  }
  
  if (user.role === 'driver') {
    return user.driverId && user.driverId.toString() === targetDriverId;
  }
  
  return true;
};

const hasPermission = (user, requiredRoles) => {
  return requiredRoles.includes(user.role);
};

module.exports = {
  applyRoleFiltering,
  canAccessCarrierData,
  canAccessDriverData,
  hasPermission
};
