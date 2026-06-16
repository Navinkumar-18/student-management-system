import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { getHomework, createHomework, updateHomework, submitHomework, verifySubmission } from '../controllers/homeworkController.js';

// Ensure upload directory exists
fs.mkdirSync('uploads/homework/', { recursive: true });

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/homework/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
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
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

router.get('/', getHomework);
router.post('/', createHomework);
router.put('/:id', updateHomework);
router.post('/:id/submit', upload.single('file'), submitHomework);
router.put('/:id/verify', verifySubmission);

export default router;
