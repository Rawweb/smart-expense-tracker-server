import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES } from './Expense.js';

// A budget covers one category, or "Overall" for everything.
export const BUDGET_SCOPES = ['Overall', ...EXPENSE_CATEGORIES];

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // A friendly label, e.g. "July allowance" or "Exam week".
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: BUDGET_SCOPES,
    },

    // The ceiling the user does not want to cross.
    limit: {
      type: Number,
      required: true,
      min: [1, 'Budget limit must be greater than zero'],
    },

    // The period this budget covers.
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // Which alerts have already fired for this budget. Used in Sprint 4.
    // Stops the same 50% alert firing on every new expense.
    notifiedThresholds: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true },
);

// Speeds up the overlap check and the "which budget does this expense fall into" lookup.
budgetSchema.index({ user: 1, category: 1, startDate: 1, endDate: 1 });

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
