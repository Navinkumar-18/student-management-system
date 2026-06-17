import express from 'express';
import { body } from 'express-validator';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', restrictTo('admin', 'teacher'), getStudents);

router.post(
  '/',
  restrictTo('teacher'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('grade').notEmpty().withMessage('Grade is required'),
  ],
  validate,
  createStudent
);

router.put('/:id', restrictTo('teacher'), updateStudent);
router.delete('/:id', restrictTo('teacher'), deleteStudent);

export default router;
