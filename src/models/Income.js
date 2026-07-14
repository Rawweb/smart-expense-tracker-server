// models/Income.js
import mongoose from 'mongoose';

// Allowed income sources
const incomeSources = [
  'Salary',
  'Business',
  'Freelance',
  'Allowance',
  'Gift',
  'Investment',
  'Other',
];

const incomeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than zero'],
    },
    source: {
      type: String,
      trim: true,
      enum: {
        values: incomeSources,
        message: '{VALUE} is not a valid income source',
      },
      default: 'Other',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export default mongoose.model('Income', incomeSchema);
export { incomeSources };
