import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();

// ── Environment Validation ──
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret_key_change_in_production') {
  logger.error('JWT_SECRET must be changed from the default value in production');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Security Middleware ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── General Rate Limiting ──
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// ── Auth Rate Limiting ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Logging ──
app.use(morgan('dev'));
app.use((req, res, next) => {
  const originalSend = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode}`, body);
    }
    return originalSend(body);
  };
  next();
});

// ── Middleware ──
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import homeworkRoutes from './routes/homeworkRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import markRoutes from './routes/markRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/stats', statsRoutes);

// ── Health Check ──
app.get('/api/health', async (req, res) => {
  const mongoose = (await import('mongoose')).default;
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    success: true,
    message: 'Student Management System API is running',
    data: {
      uptime: process.uptime(),
      dbStatus: dbStatus[dbState] || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
});

// ── Error Handling ──
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
});
