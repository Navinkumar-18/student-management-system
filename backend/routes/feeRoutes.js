import express from 'express';
import { getFees, updateFee } from '../controllers/feeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getFees);
router.put('/:id', updateFee);

export default router;
