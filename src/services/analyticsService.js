import Expense from '../models/Expense.js';
import Income from '../models/Income.js';

const sumAmount = async (Model, userId, startDate, endDate) => {
  const result = await Model.aggregate([
    {
      $match: {
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: { _id: null, total: { $sum: '$amount' } },
    },
  ]);

  // aggregate returns an empty array when nothing matched.
  return result.length > 0 ? result[0].total : 0;
};

// Total income, total expenses, and what is left.
export const getSummary = async (userId, startDate, endDate) => {
  const [totalIncome, totalExpenses] = await Promise.all([
    sumAmount(Income, userId, startDate, endDate),
    sumAmount(Expense, userId, startDate, endDate),
  ]);

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
  };
};

// What the user spends most on. This answers requirement 3.5.1 item 2.
export const getSpendingByCategory = async (userId, startDate, endDate) => {
  const results = await Expense.aggregate([
    {
      $match: {
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      // Group by category instead of null, so we get one row per category.
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }, // how many expenses in this category
      },
    },
    {
      $sort: { total: -1 }, // biggest spender first
    },
  ]);

  // Needed to work out each category's share of the whole.
  const grandTotal = results.reduce((sum, row) => sum + row.total, 0);

  const categories = results.map((row) => ({
    category: row._id,
    total: row.total,
    count: row.count,
    percentage: grandTotal > 0 ? Math.round((row.total / grandTotal) * 100) : 0,
  }));

  return {
    grandTotal,
    // The first row is the biggest, because we sorted descending.
    topCategory: categories.length > 0 ? categories[0].category : null,
    categories,
  };
};

// Spending per day, for the bar chart.
export const getDailySpending = async (userId, startDate, endDate) => {
  const results = await Expense.aggregate([
    {
      $match: {
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        // Turns a full timestamp into a "2026-07-14" string, so every expense
        // on the same day lands in the same group.
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' },
        },
        total: { $sum: '$amount' },
      },
    },
    {
      $sort: { _id: 1 }, // oldest day first, so the chart reads left to right
    },
  ]);

  const days = results.map((row) => ({
    date: row._id,
    total: row.total,
  }));

  // The average is over days the user ACTUALLY SPENT, not every day in the range.
  // Dividing by 31 when they only spent on 3 days would be misleading.
  const totalSpent = days.reduce((sum, d) => sum + d.total, 0);
  const dailyAverage = days.length > 0 ? Math.round(totalSpent / days.length) : 0;

  return {
    dailyAverage,
    activeDays: days.length,
    days,
  };
};
