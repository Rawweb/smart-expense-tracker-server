import Budget from '../models/Budget.js';
import { getBudgetUsage } from '../services/budgetService.js';

// @desc    Create a budget
// @route   POST /api/budgets
// @access  Private
export const createBudget = async (req, res) => {
  const { name, category, limit, startDate, endDate } = req.body;

  if (!name || !category || !limit || !startDate || !endDate) {
    return res.status(400).json({
      message: 'Name, category, limit, start date and end date are required',
    });
  }

  if (limit <= 0) {
    return res.status(400).json({ message: 'Budget limit must be greater than zero' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // isNaN on an invalid Date returns true. Catches "banana" before it reaches Mongo.
  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({ message: 'Please provide valid dates' });
  }

  if (end <= start) {
    return res.status(400).json({ message: 'End date must be after start date' });
  }

  // "2026-07-01" parses as midnight, and "2026-07-31" also parses as midnight,
  // which would exclude everything spent on the 31st. So we widen the end to
  // the last millisecond of that day.
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  // No two budgets for the same category may overlap in time, or an expense
  // would belong to two budgets at once and the alerts would be ambiguous.
  // Two ranges overlap when A starts before B ends AND A ends after B starts.
  const overlapping = await Budget.findOne({
    user: req.user._id,
    category,
    startDate: { $lte: end },
    endDate: { $gte: start },
  });

  if (overlapping) {
    return res.status(400).json({
      message: `You already have a ${category} budget covering part of this period`,
    });
  }

  const budget = await Budget.create({
    user: req.user._id,
    name,
    category,
    limit,
    startDate: start,
    endDate: end,
  });

  res.status(201).json({
    message: 'Budget created successfully',
    budget,
  });
};

// @desc    Get all budgets with usage
// @route   GET /api/budgets
// @route   GET /api/budgets?active=true
// @access  Private
export const getBudgets = async (req, res) => {
  const filter = { user: req.user._id };

  // ?active=true returns only the budgets running today.
  if (req.query.active === 'true') {
    const now = new Date();
    filter.startDate = { $lte: now };
    filter.endDate = { $gte: now };
  }

  const budgets = await Budget.find(filter).sort({ startDate: -1 });

  // Promise.all runs the usage queries together, not one after another.
  const budgetsWithUsage = await Promise.all(budgets.map((budget) => getBudgetUsage(budget)));

  res.status(200).json({
    count: budgetsWithUsage.length,
    budgets: budgetsWithUsage,
  });
};

// @desc    Get one budget with usage
// @route   GET /api/budgets/:id
// @access  Private
export const getBudget = async (req, res) => {
  const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });

  if (!budget) {
    return res.status(404).json({ message: 'Budget not found' });
  }

  const usage = await getBudgetUsage(budget);

  res.status(200).json({ budget: usage });
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
export const updateBudget = async (req, res) => {
  const { name, limit } = req.body;

  if (limit !== undefined && limit <= 0) {
    return res.status(400).json({ message: 'Budget limit must be greater than zero' });
  }

  // Only the name and limit can change. Moving the dates or the category would
  // corrupt notifiedThresholds, since alerts were already sent for the old period.
  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { name, limit },
    { new: true, runValidators: true },
  );

  if (!budget) {
    return res.status(404).json({ message: 'Budget not found' });
  }

  res.status(200).json({
    message: 'Budget updated successfully',
    budget,
  });
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!budget) {
    return res.status(404).json({ message: 'Budget not found' });
  }

  res.status(200).json({ message: 'Budget deleted successfully' });
};
