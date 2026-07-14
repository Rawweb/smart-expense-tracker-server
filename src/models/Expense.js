import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'Transport',
  'Feeding',
  'Junk and snacks',
  'Data and airtime',
  'Others',
];

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than zero'],
    },

    category: {
      type: String,
      required: true,
      enum: EXPENSE_CATEGORIES,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Speeds up "find this user's expenses, newest first", which is our most common query.
expenseSchema.index({ user: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
