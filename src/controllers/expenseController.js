import Expense from '../models/Expense.js';
import { checkBudgetAlerts } from '../services/alertService.js';
// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  const { title, amount, category, date } = req.body;

  if (!title || !amount || !category) {
    return res.status(400).json({ message: 'Title, amount and category are required' });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than zero' });
  }

  // The owner comes from the token, never from the request body.
  const expense = await Expense.create({
    user: req.user._id,
    title,
    amount,
    category,
    date,
  });

  let alerts = [];
  try {
    alerts = await checkBudgetAlerts(req.user._id, expense);
  } catch (error) {
    console.error('Alert check failed:', error.message);
  }

  res.status(201).json({
    message: 'Expense added successfully',
    expense,
    alerts,
  });
};

// @desc    Get all expenses for the logged in user
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  // Filtering by user is what keeps one person's data out of another's.
  const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });

  res.status(200).json({
    count: expenses.length,
    expenses,
  });
};

// @desc    Get one expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpense = async (req, res) => {
  // Ownership is part of the query, so there is no separate check to forget.
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  res.status(200).json({ expense });
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  const { title, amount, category, date } = req.body;

  if (amount !== undefined && amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than zero' });
  }

  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { title, amount, category, date },
    // new: return the updated doc. runValidators: enforce the schema on update too.
    { new: true, runValidators: true },
  );

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  res.status(200).json({
    message: 'Expense updated successfully',
    expense,
  });
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  res.status(200).json({ message: 'Expense deleted successfully' });
};
