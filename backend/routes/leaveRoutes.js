import express from 'express';
import { body } from 'express-validator';
import { getLeaves, createLeave, updateLeave, getLeaveBalance } from '../controllers/leaveController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getLeaves);

router.post(
  '/',
  [
    body('studentEmail').isEmail().withMessage('Valid student email is required').normalizeEmail(),
    body('type').notEmpty().withMessage('Leave type is required'),
    body('from').isISO8601().withMessage('Valid start date is required'),
    body('to').isISO8601().withMessage('Valid end date is required'),
  ],
  validate,
  createLeave
);

router.put('/:id', updateLeave);
router.get('/balance', getLeaveBalance);

export default router;
