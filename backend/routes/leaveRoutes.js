import express from 'express';
import { getLeaves, createLeave, updateLeave, getLeaveBalance } from '../controllers/leaveController.js';

const router = express.Router();

router.get('/', getLeaves);
router.post('/', createLeave);
router.put('/:id', updateLeave);
router.get('/balance', getLeaveBalance);

export default router;
