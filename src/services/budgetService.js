import Expense from '../models/Expense.js';

// Adds up what a user spent in a date range.
// Pass a category to limit it, or "Overall" for everything.
export const getSpentAmount = async (userId, startDate, endDate, category) => {
  const match = {
    user: userId,
    date: { $gte: startDate, $lte: endDate },
  };

  // "Overall" means every category, so we only filter for a real category.
  if (category && category !== 'Overall') {
    match.category = category;
  }

  const result = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  // aggregate returns an empty array when nothing matched.
  return result.length > 0 ? result[0].total : 0;
};

// Turns a budget into the numbers the interface needs.
export const getBudgetUsage = async (budget) => {
  const spent = await getSpentAmount(
    budget.user,
    budget.startDate,
    budget.endDate,
    budget.category,
  );

  const remaining = budget.limit - spent;
  const percentage = Math.round((spent / budget.limit) * 100);

  const now = new Date();
  const isActive = now >= budget.startDate && now <= budget.endDate;

  return {
    _id: budget._id,
    name: budget.name,
    category: budget.category,
    limit: budget.limit,
    startDate: budget.startDate,
    endDate: budget.endDate,
    spent,
    remaining,
    percentage,
    isActive,
  };
};
