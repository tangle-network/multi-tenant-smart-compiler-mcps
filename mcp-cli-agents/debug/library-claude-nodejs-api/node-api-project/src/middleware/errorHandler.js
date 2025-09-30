const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error'
  };

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation Error';
    error.details = err.details || err.message;
    return res.status(400).json(error);
  }

  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error.message = 'Invalid JSON format';
    return res.status(400).json(error);
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json(error);
  }

  // Default server error
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  res.status(500).json(error);
};

module.exports = errorHandler;