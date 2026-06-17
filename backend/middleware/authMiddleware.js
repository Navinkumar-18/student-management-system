import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        return next(new AppError('Not authorized, user not found', 401));
      }

      req.auth = decoded;
      req.user.role = decoded.role;
      return next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new AppError('Not authorized, invalid token', 401));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Not authorized, token expired', 401));
      }
      logger.error('Auth middleware error:', error);
      return next(new AppError('Not authorized, token failed', 401));
    }
  }

  if (!token) {
    return next(new AppError('Not authorized, no token', 401));
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    const currentRole = String(req.auth?.role || req.user?.role || '').toLowerCase();

    if (!currentRole || !roles.some(role => String(role).toLowerCase() === currentRole)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    return next();
  };
};
