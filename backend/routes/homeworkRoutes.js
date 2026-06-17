import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import fs from 'fs';
import { getHomework, createHomework, updateHomework, submitHomework, verifySubmission } from '../controllers/homeworkController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

fs.mkdirSync('uploads/homework/', { recursive: true });

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/homework/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.get('/', protect, getHomework);

router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
  ],
  validate,
  createHomework
);

router.put('/:id', protect, updateHomework);
router.post('/:id/submit', protect, upload.single('file'), submitHomework);
router.put('/:id/verify', protect, verifySubmission);

export default router;
