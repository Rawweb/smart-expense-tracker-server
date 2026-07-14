import Income from '../models/Income.js';

// @desc    Create an income record
// @route   POST /api/incomes
// @access  Private
export const createIncome = async (req, res) => {
  const { title, amount, source, date } = req.body;

  if (!title || !amount) {
    return res.status(400).json({ message: 'Title and amount are required' });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than zero' });
  }

  const income = await Income.create({
    user: req.user._id,
    title,
    amount,
    source,
    date,
  });

  res.status(201).json({
    message: 'Income added successfully',
    income,
  });
};

// @desc    Get all incomes for the logged in user
// @route   GET /api/incomes
// @access  Private
export const getIncomes = async (req, res) => {
  const incomes = await Income.find({ user: req.user._id }).sort({ date: -1 });

  res.status(200).json({
    count: incomes.length,
    incomes,
  });
};

// @desc    Get one income
// @route   GET /api/incomes/:id
// @access  Private
export const getIncome = async (req, res) => {
  const income = await Income.findOne({ _id: req.params.id, user: req.user._id });

  if (!income) {
    return res.status(404).json({ message: 'Income not found' });
  }

  res.status(200).json({ income });
};

// @desc    Update an income
// @route   PUT /api/incomes/:id
// @access  Private
export const updateIncome = async (req, res) => {
  const { title, amount, source, date } = req.body;

  if (amount !== undefined && amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than zero' });
  }

  const income = await Income.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { title, amount, source, date },
    { new: true, runValidators: true },
  );

  if (!income) {
    return res.status(404).json({ message: 'Income not found' });
  }

  res.status(200).json({
    message: 'Income updated successfully',
    income,
  });
};

// @desc    Delete an income
// @route   DELETE /api/incomes/:id
// @access  Private
export const deleteIncome = async (req, res) => {
  const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!income) {
    return res.status(404).json({ message: 'Income not found' });
  }

  res.status(200).json({ message: 'Income deleted successfully' });
};
