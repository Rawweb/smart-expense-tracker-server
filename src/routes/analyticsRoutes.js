import express from 'express';
import {
  getSummaryReport,
  getCategoryReport,
  getDailyReport,
  getDashboard,
} from '../controllers/analyticsController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getSummaryReport);
router.get('/by-category', getCategoryReport);
router.get('/daily', getDailyReport);
router.get('/dashboard', getDashboard);

export default router;
