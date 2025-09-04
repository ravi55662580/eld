const successResponse = (data = null, message = 'Success') => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return response;
};

const errorResponse = (message = 'An error occurred', errors = null, statusCode = 400) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  if (process.env.NODE_ENV === 'development' && statusCode) {
    response.statusCode = statusCode;
  }
  
  return response;
};

const paginatedResponse = (data, pagination, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    pagination
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};
