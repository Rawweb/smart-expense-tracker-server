import express from 'express';
import {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budgetController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createBudget).get(getBudgets);
router.route('/:id').get(getBudget).put(updateBudget).delete(deleteBudget);

export default router;
