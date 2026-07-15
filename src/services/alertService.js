import Budget from '../models/Budget.js';
import Notification from '../models/Notification.js';
import { getSpentAmount } from './budgetService.js';
import { emitToUser } from '../config/socket.js';

const THRESHOLDS = [50, 80, 100];

// ₦16,300
const formatNaira = (n) => `₦${n.toLocaleString()}`;

// The figures only. React builds the headline, so we do not say it twice.
const buildMessage = (budget, spent, threshold) => {
  const remaining = budget.limit - spent;

  if (threshold === 100) {
    return `${formatNaira(spent)} spent against a ${formatNaira(budget.limit)} limit.`;
  }

  return `${formatNaira(spent)} of ${formatNaira(budget.limit)} used. ${formatNaira(remaining)} left.`;
};

export const checkBudgetAlerts = async (userId, expense, excludeSocketId = null) => {
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
        message: buildMessage(budget, spent, threshold),
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

if (newAlerts.length > 0) {
  emitToUser(userId, 'budget-alert', newAlerts, excludeSocketId);
}

  return newAlerts;
};

// Runs after an expense is deleted or edited. Spending may have fallen back
// below a threshold we already announced, so we remove it from the budget's
// memory. Without this, crossing that line again would be silent.
export const recheckBudgetThresholds = async (userId, expense) => {
  const budgets = await Budget.find({
    user: userId,
    category: { $in: [expense.category, 'Overall'] },
    startDate: { $lte: expense.date },
    endDate: { $gte: expense.date },
  });

  for (const budget of budgets) {
    const spent = await getSpentAmount(userId, budget.startDate, budget.endDate, budget.category);
    const percentage = Math.round((spent / budget.limit) * 100);

    // Keep only the thresholds the user is STILL past.
    const stillPast = budget.notifiedThresholds.filter((t) => percentage >= t);

    // Nothing changed, so do not write to the database for no reason.
    if (stillPast.length === budget.notifiedThresholds.length) continue;

    budget.notifiedThresholds = stillPast;
    await budget.save();
  }
};
