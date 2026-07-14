import Budget from '../models/Budget.js';
import Notification from '../models/Notification.js';
import { getSpentAmount } from './budgetService.js';

const THRESHOLDS = [50, 80, 100];

// Builds the sentence the user reads.
const buildMessage = (budget, spent, percentage, threshold) => {
  const scope = budget.category === 'Overall' ? 'overall budget' : `${budget.category} budget`;
  const remaining = budget.limit - spent;

  if (threshold === 100) {
    return `You have used up your ${scope}. Spent ₦${spent.toLocaleString()} of ₦${budget.limit.toLocaleString()}.`;
  }

  // Name the threshold that was crossed, then show where they actually stand.
  return `You have passed ${threshold}% of your ${scope}. ₦${spent.toLocaleString()} of ₦${budget.limit.toLocaleString()} used, ₦${remaining.toLocaleString()} left.`;
};

export const checkBudgetAlerts = async (userId, expense) => {
  const budgets = await Budget.find({
    user: userId,
    category: { $in: [expense.category, 'Overall'] },
    startDate: { $lte: expense.date },
    endDate: { $gte: expense.date },
  });

  const newAlerts = [];

  for (const budget of budgets) {
    const spent = await getSpentAmount(userId, budget.startDate, budget.endDate, budget.category);
    const percentage = Math.round((spent / budget.limit) * 100);

    // Thresholds we are now past, minus the ones already announced this period.
    // This is what makes an alert fire on the CROSSING, not on the state.
    const crossed = THRESHOLDS.filter(
      (t) => percentage >= t && !budget.notifiedThresholds.includes(t),
    );

    if (crossed.length === 0) continue;

    for (const threshold of crossed) {
      const notification = await Notification.create({
        user: userId,
        budget: budget._id,
        threshold,
        message: buildMessage(budget, spent, percentage, threshold),
        category: budget.category,
        spent,
        limit: budget.limit,
        percentage,
      });

      newAlerts.push(notification);
    }

    // Remember these, so they never fire again for this budget period.
    budget.notifiedThresholds.push(...crossed);
    await budget.save();
  }

  return newAlerts;
};
