const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  // A bug, not a deliberate error. Log the whole thing for us.
  if (!err.isOperational) {
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json({
    status,
    message: err.isOperational ? err.message : 'Something went wrong on our end',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
