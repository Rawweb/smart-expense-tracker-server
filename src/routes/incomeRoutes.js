import express from 'express';
import {
  createIncome,
  getIncomes,
  getIncome,
  updateIncome,
  deleteIncome,
} from '../controllers/incomeController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createIncome).get(getIncomes);
router.route('/:id').get(getIncome).put(updateIncome).delete(deleteIncome);

export default router;
