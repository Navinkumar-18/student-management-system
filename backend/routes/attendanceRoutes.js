import express from 'express';
import { body } from 'express-validator';
import { getAttendance, saveAttendance } from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', protect, getAttendance);

router.post(
  '/',
  protect,
  [
    body('records').isArray({ min: 1 }).withMessage('Attendance records are required'),
    body('records.*.studentId').notEmpty().withMessage('Student ID is required'),
    body('records.*.status')
      .isIn(['Present', 'Absent', 'Late'])
      .withMessage('Status must be Present, Absent, or Late'),
  ],
  validate,
  saveAttendance
);

export default router;
