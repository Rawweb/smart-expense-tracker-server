import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import Income from '../models/Income.js';
import Notification from '../models/Notification.js';
import {
  getSummary,
  getSpendingByCategory,
  getDailySpending,
} from '../services/analyticsService.js';
import { getBudgetUsage } from '../services/budgetService.js';

// Reads ?startDate and ?endDate, or falls back to the current month.
// Every analytics route needs a date range, so this lives in one place.
const getDateRange = (req) => {
  const now = new Date();

  let start;
  let end;

  if (req.query.startDate && req.query.endDate) {
    start = new Date(req.query.startDate);
    end = new Date(req.query.endDate);

    if (isNaN(start) || isNaN(end)) return null;
  } else {
    // Default: the first and last day of the current month.
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  }

  // Same UTC boundary rule as budgets, so the last day is never silently dropped.
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
};

// @desc    Total income, total expenses, balance
// @route   GET /api/analytics/summary
// @access  Private
export const getSummaryReport = async (req, res) => {
  const range = getDateRange(req);

  if (!range) {
    return res.status(400).json({ message: 'Please provide valid dates' });
  }

  const summary = await getSummary(req.user._id, range.start, range.end);

  res.status(200).json({
    startDate: range.start,
    endDate: range.end,
    ...summary,
  });
};

// @desc    What the user spends most on
// @route   GET /api/analytics/by-category
// @access  Private
export const getCategoryReport = async (req, res) => {
  const range = getDateRange(req);

  if (!range) {
    return res.status(400).json({ message: 'Please provide valid dates' });
  }

  const data = await getSpendingByCategory(req.user._id, range.start, range.end);

  res.status(200).json({
    startDate: range.start,
    endDate: range.end,
    ...data,
  });
};

// @desc    Spending per day, for the chart
// @route   GET /api/analytics/daily
// @access  Private
export const getDailyReport = async (req, res) => {
  const range = getDateRange(req);

  if (!range) {
    return res.status(400).json({ message: 'Please provide valid dates' });
  }

  const data = await getDailySpending(req.user._id, range.start, range.end);

  res.status(200).json({
    startDate: range.start,
    endDate: range.end,
    ...data,
  });
};

// @desc    Everything the dashboard needs, in one request
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboard = async (req, res) => {
  const range = getDateRange(req);

  if (!range) {
    return res.status(400).json({ message: 'Please provide valid dates' });
  }

  const now = new Date();

  // Six independent queries. Fired together, not one after another.
 const [summary, byCategory, daily, activeBudgets, recentExpenses, unreadCount, latestAlert] =
   await Promise.all([
     getSummary(req.user._id, range.start, range.end),
     getSpendingByCategory(req.user._id, range.start, range.end),
     getDailySpending(req.user._id, range.start, range.end),
     Budget.find({
       user: req.user._id,
       startDate: { $lte: now },
       endDate: { $gte: now },
     }),
     Expense.find({ user: req.user._id }).sort({ date: -1 }).limit(5),
     Notification.countDocuments({ user: req.user._id, isRead: false }),
     Notification.findOne({ user: req.user._id, isRead: false }).sort({ createdAt: -1 }),
   ]);

  // Budget usage needs its own round of queries, and it depends on the budgets above.
  const budgets = await Promise.all(activeBudgets.map((b) => getBudgetUsage(b)));

  res.status(200).json({
    startDate: range.start,
    endDate: range.end,
    summary,
    byCategory,
    daily,
    budgets,
    recentExpenses,
    unreadCount,
    latestAlert,
  });
};
