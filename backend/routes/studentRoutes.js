import express from 'express';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', restrictTo('admin', 'teacher'), getStudents);
router.post('/', restrictTo('admin'), createStudent);
router.put('/:id', restrictTo('admin'), updateStudent);
router.delete('/:id', restrictTo('admin'), deleteStudent);

export default router;
