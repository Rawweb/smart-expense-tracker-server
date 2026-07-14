import express from 'express';
import {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createExpense).get(getExpenses);
router.route('/:id').get(getExpense).put(updateExpense).delete(deleteExpense);

export default router;
