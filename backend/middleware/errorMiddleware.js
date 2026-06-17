import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate value for ${field}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, errors);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Token expired. Please log in again.', 401);
const handleMulterError = (err) => new AppError(err.message, 400);

export const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err.name === 'MulterError') error = handleMulterError(err);

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.isOperational ? error.message : 'Something went wrong';

  if (!error.isOperational) {
    logger.error('UNEXPECTED ERROR:', err);
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message,
      errors: error.errors || [],
      stack: err.stack,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors.length > 0 && { errors: error.errors }),
  });
};

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};
