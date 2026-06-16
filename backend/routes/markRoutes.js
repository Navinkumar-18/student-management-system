import express from 'express';
import { getMarks, createMark, updateMark } from '../controllers/markController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMarks);
router.post('/', restrictTo('teacher', 'admin'), createMark);
router.put('/:id', restrictTo('teacher', 'admin'), updateMark);

export default router;
