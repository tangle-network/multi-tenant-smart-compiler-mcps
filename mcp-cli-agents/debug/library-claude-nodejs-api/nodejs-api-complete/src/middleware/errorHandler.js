const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.name === 'ValidationError' || err.message.includes('validation')) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message
    });
  }

  if (err.message === 'User with this email already exists') {
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: err.message
    });
  }

  if (err.message === 'User not found') {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: err.message
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  errorHandler,
  notFound
};