import express from 'express';
import { body } from 'express-validator';
import { getMarks, createMark, updateMark } from '../controllers/markController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getMarks);

router.post(
  '/',
  restrictTo('teacher', 'admin'),
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('subjectName').trim().notEmpty().withMessage('Subject name is required'),
    body('marksObtained').isNumeric().withMessage('Marks obtained must be a number'),
  ],
  validate,
  createMark
);

router.put('/:id', restrictTo('teacher', 'admin'), updateMark);

export default router;
