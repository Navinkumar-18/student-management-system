import express from 'express';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../controllers/teacherController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', restrictTo('admin'), getTeachers);
router.post('/', restrictTo('admin'), createTeacher);
router.put('/:id', restrictTo('admin'), updateTeacher);
router.delete('/:id', restrictTo('admin'), deleteTeacher);

export default router;
