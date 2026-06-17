import express from 'express';
import { body } from 'express-validator';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../controllers/teacherController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', restrictTo('admin'), getTeachers);

router.post(
  '/',
  restrictTo('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
  ],
  validate,
  createTeacher
);

router.put('/:id', restrictTo('admin'), updateTeacher);
router.delete('/:id', restrictTo('admin'), deleteTeacher);

export default router;
